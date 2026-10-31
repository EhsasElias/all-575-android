import type { Payment } from './payment';

// Kept in memory only: the provider's page is a one-time session, so it must not reach storage, logs or the URL.
const redirectUrls = new Map<string, string>();

/** Only a secure web address may be opened for the customer, never `javascript:` or an app-internal scheme. */
export function safeProviderUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' && url.username === '' && url.password === ''
      ? url.href
      : null;
  } catch {
    return null;
  }
}

/** The server shows the provider session only once, in the answer that creates the charge: keep the page to open. */
export function rememberPaymentAction(payment: Payment): void {
  const url = safeProviderUrl(payment.action?.redirect_url);
  if (url) redirectUrls.set(payment.id, url);
}

export function recallRedirectUrl(paymentId: string | null): string | null {
  return paymentId === null ? null : (redirectUrls.get(paymentId) ?? null);
}

export function forgetPaymentActions(): void {
  redirectUrls.clear();
}
