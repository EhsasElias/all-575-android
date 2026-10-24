import { screen, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { TOTAL_TEXT } from './testData';

/** Picks the 9:00 AM delivery time on Sunday, October 25 (slot 8). */
export async function chooseFirstSlot(user: UserEvent) {
  const sunday = await screen.findByRole('group', { name: 'Sunday, October 25' });
  await user.click(within(sunday).getByRole('radio', { name: '9:00 AM – 11:00 AM' }));
}

export async function payNow(user: UserEvent, total = TOTAL_TEXT) {
  await user.click(screen.getByRole('button', { name: `Pay ${total}` }));
}

/** A refusal exactly as the API sends it. */
export const refusal = (status: number, code: string, extra: Record<string, unknown> = {}) => ({
  status,
  body: { message: 'Server wording the app must never show.', code, ...extra },
});
