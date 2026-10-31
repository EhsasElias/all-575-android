/**
 * A signup preference is provisional until a verified email signs in and
 * explicitly confirms it on the server consent screen.
 * Only a non-sensitive preference and the entered email are stored, in this tab.
 */
const KEY = 'market575.signup.marketing.draft';

type MarketingDraft = { email: string; marketing: boolean };

export function saveMarketingDraft(email: string, marketing: boolean): void {
  try {
    const draft: MarketingDraft = { email: email.trim().toLowerCase(), marketing };
    window.sessionStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    // Browsers may block storage. The final consent screen remains available.
  }
}

export function readMarketingDraft(email: string): boolean {
  try {
    const stored = window.sessionStorage.getItem(KEY);
    if (!stored) return false;
    const draft: unknown = JSON.parse(stored);
    if (typeof draft !== 'object' || draft === null || !('email' in draft)) return false;
    if (!('marketing' in draft)) return false;
    return draft.email === email.trim().toLowerCase() && draft.marketing === true;
  } catch {
    return false;
  }
}

export function clearMarketingDraft(email: string): void {
  try {
    const stored = window.sessionStorage.getItem(KEY);
    if (!stored) return;
    const draft: unknown = JSON.parse(stored);
    if (typeof draft === 'object' && draft !== null && 'email' in draft) {
      if (draft.email === email.trim().toLowerCase()) window.sessionStorage.removeItem(KEY);
    }
  } catch {
    // The backend has already recorded the verified preference.
  }
}
