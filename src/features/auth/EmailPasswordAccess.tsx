import { useState, type SubmitEvent } from 'react';
import {
  createUserWithEmailAndPassword,
  getIdToken,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import { errorCode, http, isApiError, type Data, type Schemas } from '@/shared/api';
import { getFirebaseAuth } from '@/shared/firebase/firebase';
import { useSession } from '@/shared/session';
import { Button, ErrorState, Skeleton, useToast } from '@/shared/ui';
import { ConsentForm } from './ConsentForm';
import { SignInSteps } from './SignInSteps';
import { currentDeviceName } from './deviceName';
import { failureKey } from './emailPasswordFailure';
import { EmailPasswordForm } from './EmailPasswordForm';
import { useConsentVersions } from './useConsentVersions';
import type { ConsentChoice } from './authApi';
import styles from './StepLayout.module.css';

type LoginReply = {
  token: string;
  user: Schemas['UserResource'];
  is_new_user: boolean;
};

type Props = { createAccount: boolean };

/**
 * Firebase authenticates email/password. Only a confirmed Firebase email ID token
 * is exchanged for the application's regular Laravel Sanctum customer session.
 * Existing Laravel phone/email OTP remains available as an explicit alternative.
 */
export function EmailPasswordAccess({ createAccount }: Props) {
  const { t } = useTranslation('auth');
  const session = useSession();
  const { showToast } = useToast();
  const legal = useConsentVersions(null);
  const [useOtp, setUseOtp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [needsConsent, setNeedsConsent] = useState(false);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState('');
  const [notice, setNotice] = useState('');

  async function exchange(consents: ConsentChoice | null): Promise<void> {
    const auth = getFirebaseAuth();
    const currentUser = auth.currentUser;
    if (!currentUser?.emailVerified) {
      throw new Error('Verified Firebase email session required');
    }

    const data = (
      await http.post<Data<LoginReply>>('/auth/firebase/login', {
        id_token: await getIdToken(currentUser),
        device_name: currentDeviceName(),
        ...(consents === null
          ? {}
          : {
              consents: {
                terms_version: consents.terms,
                privacy_version: consents.privacy,
                marketing: consents.marketing,
              },
            }),
      })
    ).data;

    await session.signIn(data.token, data.user);
    showToast({
      message: t(data.is_new_user ? 'welcome.newAccount' : 'welcome.returning'),
      variant: 'success',
    });
  }

  async function finish(consents: ConsentChoice | null): Promise<void> {
    setPending(true);
    setFailure('');
    setNotice('');
    try {
      await exchange(consents);
    } catch (error) {
      if (isApiError(error) && errorCode(error) === 'consent_required') {
        setNeedsConsent(true);
      } else {
        setFailure(t(failureKey(error)));
      }
    } finally {
      setPending(false);
    }
  }

  async function submit(event: SubmitEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (pending) return;

    setFailure('');
    setNotice('');
    if (createAccount && (!termsAccepted || !privacyAccepted)) {
      setFailure(t('emailPassword.acceptLegal'));
      return;
    }
    if (createAccount && legal.status !== 'ready') {
      setFailure(t('emailPassword.tryAgain'));
      return;
    }
    if (createAccount && password.length < 12) {
      setFailure(t('emailPassword.weakPassword'));
      return;
    }

    setPending(true);
    try {
      const auth = getFirebaseAuth();
      if (createAccount) {
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        try {
          await sendEmailVerification(credential.user);
          setNotice(t('emailPassword.verificationSent'));
          setPassword('');
        } finally {
          // A new, unverified account must never remain authenticated in the app.
          await signOut(auth);
        }
      } else {
        const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
        if (!credential.user.emailVerified) {
          try {
            await sendEmailVerification(credential.user);
            setNotice(t('emailPassword.verificationRequired'));
            setPassword('');
          } finally {
            await signOut(auth);
          }
        } else {
          await exchange(null);
        }
      }
    } catch (error) {
      if (isApiError(error) && errorCode(error) === 'consent_required') {
        setNeedsConsent(true);
      } else {
        setFailure(t(failureKey(error)));
      }
    } finally {
      setPending(false);
    }
  }

  async function resetPassword(): Promise<void> {
    if (pending) return;
    if (email.trim() === '') {
      setFailure(t('emailPassword.enterEmail'));
      return;
    }
    setPending(true);
    setFailure('');
    setNotice('');
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
      setNotice(t('emailPassword.resetSent'));
    } catch (error) {
      setFailure(t(failureKey(error)));
    } finally {
      setPending(false);
    }
  }

  if (useOtp) {
    return (
      <div className={styles.step}>
        <Button variant="ghost" onClick={() => {
          setUseOtp(false);
        }}>
          {t('emailPassword.backToEmail')}
        </Button>
        <SignInSteps />
      </div>
    );
  }

  if (needsConsent) {
    return (
      <div className={styles.step}>
        <h2 className={styles.stepTitle}>{t('consent.title')}</h2>
        {legal.status === 'loading' && <Skeleton height="8rem" />}
        {legal.status === 'error' && <ErrorState headingLevel={3} onRetry={legal.retry} />}
        {legal.status === 'ready' && (
          <ConsentForm
            channel="email"
            versions={legal.versions}
            versionsChanged={false}
            verify={{ pending, failure: null }}
            onAccept={(choice) => {
              void finish(choice);
            }}
          />
        )}
        {failure && (
          <p role="alert" className={styles.alert}>
            {failure}
          </p>
        )}
      </div>
    );
  }

  return (
    <EmailPasswordForm
      createAccount={createAccount}
      email={email}
      password={password}
      pending={pending}
      failure={failure}
      notice={notice}
      legal={legal}
      termsAccepted={termsAccepted}
      privacyAccepted={privacyAccepted}
      onEmail={setEmail}
      onPassword={setPassword}
      onTerms={setTermsAccepted}
      onPrivacy={setPrivacyAccepted}
      onSubmit={(event) => {
        void submit(event);
      }}
      onReset={() => {
        void resetPassword();
      }}
      onOtp={() => {
        setUseOtp(true);
      }}
    />
  );
}
