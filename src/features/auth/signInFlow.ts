import type { LegalVersions } from './authApi';
import type { Contact } from './contact';

/** A code the server has issued. Times are timestamps in milliseconds. */
export type Challenge = { id: string; resendAt: number; expiresAt: number };

type PreviousChallenge = { contact: Contact; challenge: Challenge };

/** Where the customer is in signing in. Only the first screen is editable; the others wait for an answer. */
export type FlowState =
  | { step: 'contact'; contact: Contact; previous: PreviousChallenge | null }
  | { step: 'code'; contact: Contact; challenge: Challenge }
  | {
      step: 'consent';
      contact: Contact;
      challenge: Challenge;
      /** Kept in memory only, so the same code can be sent again with the consent choices. */
      code: string;
      versions: LegalVersions | null;
      /** The server asked again, with other versions, after the customer had already seen a first set. */
      versionsChanged: boolean;
    };

export type FlowAction =
  | { type: 'codeSent'; contact: Contact; challenge: Challenge }
  | { type: 'consentRequired'; code: string; versions: LegalVersions | null }
  | { type: 'changeContact' }
  | { type: 'resumePrevious' };

export const INITIAL_FLOW: FlowState = {
  step: 'contact',
  contact: { channel: 'phone', destination: '' },
  previous: null,
};

export function flowReducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case 'codeSent':
      return { step: 'code', contact: action.contact, challenge: action.challenge };
    case 'consentRequired':
      if (state.step === 'contact') return state;
      return {
        step: 'consent',
        contact: state.contact,
        challenge: state.challenge,
        code: action.code,
        versions: action.versions,
        versionsChanged: state.step === 'consent',
      };
    case 'changeContact':
      // The unfinished challenge is kept: asking for the same number again within the cooldown reuses it.
      return state.step === 'contact'
        ? state
        : {
            step: 'contact',
            contact: state.contact,
            previous: { contact: state.contact, challenge: state.challenge },
          };
    case 'resumePrevious':
      return state.step === 'contact' && state.previous !== null
        ? { step: 'code', contact: state.previous.contact, challenge: state.previous.challenge }
        : state;
  }
}

/** Drops whatever has expired: a code that can no longer be used is never offered again. */
export function dropExpired(state: FlowState, now: number): FlowState {
  if (state.step === 'contact') {
    return state.previous !== null && state.previous.challenge.expiresAt <= now
      ? { ...state, previous: null }
      : state;
  }
  return state.challenge.expiresAt <= now
    ? { step: 'contact', contact: state.contact, previous: null }
    : state;
}
