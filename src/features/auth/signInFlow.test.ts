import { beforeEach, describe, expect, it } from 'vitest';
import {
  INITIAL_FLOW,
  dropExpired,
  flowReducer,
  type Challenge,
  type FlowState,
} from './signInFlow';
import { forgetFlow, recallFlow, rememberFlow } from './signInMemory';

const NOW = 1_000_000;
const contact = { channel: 'phone', destination: '0512345678' } as const;
const challenge: Challenge = { id: 'c1', resendAt: NOW + 60_000, expiresAt: NOW + 300_000 };
const codeStep: FlowState = { step: 'code', contact, challenge };

describe('flowReducer', () => {
  it('moves to the code step once a code was sent', () => {
    const next = flowReducer(INITIAL_FLOW, { type: 'codeSent', contact, challenge });

    expect(next).toEqual(codeStep);
  });

  it('keeps the code in memory when consent is needed, and notes when the versions changed', () => {
    const versions = { terms: '2026-10-02', privacy: '2026-10-02' };
    const asked = flowReducer(codeStep, { type: 'consentRequired', code: '123456', versions });
    const askedAgain = flowReducer(asked, { type: 'consentRequired', code: '123456', versions });

    expect(asked).toMatchObject({
      step: 'consent',
      code: '123456',
      versions,
      versionsChanged: false,
    });
    expect(askedAgain).toMatchObject({ step: 'consent', versionsChanged: true });
  });

  it('ignores a consent request when no code was sent', () => {
    expect(
      flowReducer(INITIAL_FLOW, { type: 'consentRequired', code: '123456', versions: null }),
    ).toBe(INITIAL_FLOW);
  });

  it('goes back to the first step with the unfinished code kept for later', () => {
    const back = flowReducer(codeStep, { type: 'changeContact' });

    expect(back).toEqual({ step: 'contact', contact, previous: { contact, challenge } });
    expect(flowReducer(back, { type: 'resumePrevious' })).toEqual(codeStep);
  });

  it('has nothing to resume when no code was sent before', () => {
    expect(flowReducer(INITIAL_FLOW, { type: 'resumePrevious' })).toBe(INITIAL_FLOW);
  });
});

describe('dropExpired', () => {
  it('keeps a code that can still be used', () => {
    expect(dropExpired(codeStep, NOW)).toBe(codeStep);
  });

  it('sends the customer back to the first step, with their number, once the code expired', () => {
    expect(dropExpired(codeStep, challenge.expiresAt)).toEqual({
      step: 'contact',
      contact,
      previous: null,
    });
  });

  it('forgets an unfinished code that expired while the customer was changing the number', () => {
    const changing = flowReducer(codeStep, { type: 'changeContact' });

    expect(dropExpired(changing, challenge.expiresAt)).toMatchObject({ previous: null });
  });
});

describe('the sign-in kept in memory', () => {
  beforeEach(forgetFlow);

  it('starts empty', () => {
    expect(recallFlow(NOW)).toBe(INITIAL_FLOW);
  });

  it('gives back what was remembered while the code is valid, and nothing after', () => {
    rememberFlow(codeStep);

    expect(recallFlow(NOW)).toEqual(codeStep);
    expect(recallFlow(challenge.expiresAt)).toMatchObject({ step: 'contact', previous: null });
  });

  it('forgets on request', () => {
    rememberFlow(codeStep);
    forgetFlow();

    expect(recallFlow(NOW)).toBe(INITIAL_FLOW);
  });
});
