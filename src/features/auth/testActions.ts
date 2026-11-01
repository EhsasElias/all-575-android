import { screen } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { CODE } from './testData';

/** Types a mobile number on the first step and asks for the code. Waits for the code step. */
export async function requestCode(user: UserEvent, phone = '0512345678') {
  const otpOption = await screen.findByRole('button', { name: 'Use one-time code (OTP)' });
  await user.click(otpOption);
  const switchToPhone = await screen.findByRole('button', { name: 'Use mobile number instead' });
  await user.click(switchToPhone);
  await user.type(await screen.findByLabelText('Mobile number'), phone);
  await user.click(screen.getByRole('button', { name: 'Send code' }));
  await screen.findByRole('heading', { level: 2, name: 'Enter your code' });
}

/** Types the code and presses Continue. */
export async function submitCode(user: UserEvent, code = CODE) {
  await user.type(screen.getByLabelText('6-digit code'), code);
  await user.click(screen.getByRole('button', { name: 'Continue' }));
}

/** Tells apart the first verify call (no consent) from the second (with the choices). */
export function hasConsents(body: unknown): boolean {
  return typeof body === 'object' && body !== null && 'consents' in body;
}
