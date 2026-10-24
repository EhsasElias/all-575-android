import { useMutation } from '@tanstack/react-query';
import { useEffect, useMemo, useReducer } from 'react';
import { useTranslation } from 'react-i18next';
import { useSession } from '@/shared/session';
import { useToast } from '@/shared/ui';
import { requestOtp, verifyOtp, type ConsentChoice } from './authApi';
import { classifyAuthFailure, type AuthFailure } from './authFailure';
import { isSameContact, type Contact } from './contact';
import { currentDeviceName } from './deviceName';
import { flowReducer, type FlowState } from './signInFlow';
import { forgetFlow, recallFlow, rememberFlow } from './signInMemory';

const MILLISECONDS = 1000;

type RequestVariables = {
  contact: Contact;
  isResend: boolean;
  /** Who the unfinished code was sent to, if the customer came back to change the number. */
  previousContact: Contact | null;
};
type VerifyVariables = { challengeId: string; code: string; consent: ConsentChoice | null };

export type Progress = { pending: boolean; failure: AuthFailure | null };

export type SignInFlow = {
  state: FlowState;
  /** Asking for a code: the first time and every resend. */
  request: Progress;
  /** Checking a code, with or without the consent choices. */
  verify: Progress;
  sendCode: (contact: Contact) => void;
  resendCode: () => void;
  verifyCode: (code: string) => void;
  acceptTerms: (consent: ConsentChoice) => void;
  changeContact: () => void;
  /** Forgets the last answer of the server for the first screen, e.g. once the customer edits the field. */
  dismissRequestFailure: () => void;
};

function useFailure(error: unknown): AuthFailure | null {
  return useMemo(() => (error === null ? null : classifyAuthFailure(error)), [error]);
}

/**
 * Asking again for the same number inside the cooldown is not an error for the customer: the code that
 * was already sent still works, so the flow goes back to it.
 */
async function requestOrReuse({ contact, previousContact }: RequestVariables) {
  try {
    return { kind: 'issued', issued: await requestOtp(contact) } as const;
  } catch (error) {
    const canReuse =
      previousContact !== null &&
      isSameContact(previousContact, contact) &&
      classifyAuthFailure(error).kind === 'otp-cooldown';
    if (canReuse) return { kind: 'reuse-previous' } as const;
    throw error;
  }
}

/**
 * Runs the passwordless sign-in: ask for a code, check it, and (for a new account, or after the legal texts
 * changed) send it again with the consent choices. The session is signed in here; the screen only redirects.
 */
export function useSignInFlow(): SignInFlow {
  const { t } = useTranslation('auth');
  const session = useSession();
  const { showToast } = useToast();
  const [state, dispatch] = useReducer(flowReducer, undefined, recallFlow);

  useEffect(() => {
    rememberFlow(state);
  }, [state]);

  const verifyMutation = useMutation({
    mutationFn: async ({ challengeId, code, consent }: VerifyVariables) => {
      const outcome = await verifyOtp({
        challengeId,
        code,
        consent,
        deviceName: currentDeviceName(),
      });
      if (outcome.kind === 'verified') await session.signIn(outcome.token, outcome.user);
      return outcome;
    },
    onSuccess: (outcome, { code }) => {
      if (outcome.kind === 'consent-required') {
        dispatch({ type: 'consentRequired', code, versions: outcome.versions });
        return;
      }
      forgetFlow();
      showToast({
        message: t(outcome.isNewUser ? 'welcome.newAccount' : 'welcome.returning'),
        variant: 'success',
      });
    },
  });

  const requestMutation = useMutation({
    mutationFn: requestOrReuse,
    onSuccess: (outcome, { contact, isResend }) => {
      verifyMutation.reset();
      if (outcome.kind === 'reuse-previous') {
        dispatch({ type: 'resumePrevious' });
        showToast({ message: t('code.alreadySent') });
        return;
      }
      const now = Date.now();
      dispatch({
        type: 'codeSent',
        contact,
        challenge: {
          id: outcome.issued.challenge_id,
          resendAt: now + outcome.issued.resend_after * MILLISECONDS,
          expiresAt: now + outcome.issued.expires_in * MILLISECONDS,
        },
      });
      if (isResend) showToast({ message: t('code.resent'), variant: 'success' });
    },
  });

  const requestFailure = useFailure(requestMutation.error);
  const verifyFailure = useFailure(verifyMutation.error);
  const previousContact = state.step === 'contact' ? (state.previous?.contact ?? null) : null;

  return {
    state,
    request: { pending: requestMutation.isPending, failure: requestFailure },
    verify: { pending: verifyMutation.isPending, failure: verifyFailure },
    sendCode: (contact) => {
      if (requestMutation.isPending) return;
      requestMutation.mutate({ contact, isResend: false, previousContact });
    },
    resendCode: () => {
      if (state.step !== 'code' || requestMutation.isPending) return;
      requestMutation.mutate({ contact: state.contact, isResend: true, previousContact: null });
    },
    verifyCode: (code) => {
      if (state.step !== 'code' || verifyMutation.isPending) return;
      verifyMutation.mutate({ challengeId: state.challenge.id, code, consent: null });
    },
    acceptTerms: (consent) => {
      if (state.step !== 'consent' || verifyMutation.isPending) return;
      verifyMutation.mutate({ challengeId: state.challenge.id, code: state.code, consent });
    },
    changeContact: () => {
      requestMutation.reset();
      verifyMutation.reset();
      dispatch({ type: 'changeContact' });
    },
    dismissRequestFailure: () => {
      requestMutation.reset();
    },
  };
}
