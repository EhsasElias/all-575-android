import { INITIAL_FLOW, dropExpired, type FlowState } from './signInFlow';

/**
 * The sign-in in progress, kept in memory only (never in web storage: it holds a one-time code).
 * It lets a customer open the Terms from the consent step and come back to the same place instead of
 * asking for a new code. It is gone when the app closes, and a code is never offered after it expires.
 */
let remembered: FlowState | null = null;

export function rememberFlow(state: FlowState): void {
  remembered = state;
}

export function forgetFlow(): void {
  remembered = null;
}

export function recallFlow(now: number = Date.now()): FlowState {
  return remembered === null ? INITIAL_FLOW : dropExpired(remembered, now);
}
