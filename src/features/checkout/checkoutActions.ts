import { screen } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { TOTAL_TEXT } from './testData';

/** Picks the 9:00 AM delivery time on Sunday, October 25 (slot 8). */
export async function chooseFirstSlot(user: UserEvent) {
  const calendar = await screen.findByRole('group', { name: 'Choose delivery date' });
  const sunday = await import('@testing-library/react').then(({ within }) => within(calendar).findByRole('button', { name: '2026-10-25' }));
  if (sunday.getAttribute('aria-pressed') !== 'true') await user.click(sunday);
  await user.click(await screen.findByRole('radio', { name: '9:00 AM – 11:00 AM' }));
}

export async function payNow(user: UserEvent, total = TOTAL_TEXT) {
  await user.click(screen.getByRole('button', { name: `Pay ${total}` }));
}

/** A refusal exactly as the API sends it. */
export const refusal = (status: number, code: string, extra: Record<string, unknown> = {}) => ({
  status,
  body: { message: 'Server wording the app must never show.', code, ...extra },
});
