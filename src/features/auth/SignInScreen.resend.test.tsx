import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { installFakeApi } from '@/test/fakeApi';
import { renderApp } from '@/test/render';
import { forgetFlow } from './signInMemory';
import { requestCode } from './testActions';
import { CHALLENGE_ID, CODE, businessRefusal, issuedChallenge, verifiedLogin } from './testData';

const SECOND_CHALLENGE_ID = '01m5qen43309c0q2mykgh76jk8';

function advance(milliseconds: number) {
  act(() => {
    vi.advanceTimersByTime(milliseconds);
  });
}

function setupUser() {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  return userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
}

beforeEach(forgetFlow);

describe('Sign in: asking for a new code', () => {
  it('counts down in view, then offers a new code and starts the count again', async () => {
    const user = setupUser();
    let requests = 0;
    const api = installFakeApi({
      'POST /auth/otp/request': () => {
        requests += 1;
        return {
          status: 202,
          body: {
            data: {
              challenge_id: requests === 1 ? CHALLENGE_ID : SECOND_CHALLENGE_ID,
              expires_in: 300,
              resend_after: 60,
            },
          },
        };
      },
    });
    await renderApp({ route: '/sign-in', seenWelcome: true });
    await requestCode(user);

    expect(screen.getByText(/You can ask for a new code in 1:00/)).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Send a new code' })).not.toBeInTheDocument();

    advance(30_000);
    expect(screen.getByText(/You can ask for a new code in 0:30/)).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Send a new code' })).not.toBeInTheDocument();

    advance(31_000);
    const resend = await screen.findByRole('button', { name: 'Send a new code' });
    expect(screen.queryByText(/You can ask for a new code in/)).not.toBeInTheDocument();

    await user.type(screen.getByLabelText('6-digit code'), '123');
    await user.click(resend);

    expect(await screen.findByText('We sent you a new code.')).toBeVisible();
    expect(api.requests().filter((call) => call === 'POST /auth/otp/request')).toHaveLength(2);
    expect(screen.getByLabelText('6-digit code')).toHaveValue('');
    expect(screen.getByLabelText('6-digit code')).toHaveFocus();
    expect(screen.getByText(/You can ask for a new code in 1:00/)).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Send a new code' })).not.toBeInTheDocument();
  });

  it('checks the code against the newest challenge only', async () => {
    const user = setupUser();
    let requests = 0;
    const api = installFakeApi({
      'POST /auth/otp/request': () => {
        requests += 1;
        return {
          status: 202,
          body: {
            data: {
              challenge_id: requests === 1 ? CHALLENGE_ID : SECOND_CHALLENGE_ID,
              expires_in: 300,
              resend_after: 60,
            },
          },
        };
      },
      'POST /auth/otp/verify': verifiedLogin(),
    });
    await renderApp({ route: '/sign-in?next=%2Faccount', seenWelcome: true });
    await requestCode(user);
    advance(61_000);
    await user.click(await screen.findByRole('button', { name: 'Send a new code' }));
    await screen.findByText('We sent you a new code.');

    await user.type(screen.getByLabelText('6-digit code'), CODE);
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(api.requests()).toContain('POST /auth/otp/verify');
    });
    const verify = api.calls().find((call) => call.path === '/auth/otp/verify');
    expect(verify?.body).toMatchObject({ challenge_id: SECOND_CHALLENGE_ID });
  });

  it('explains a refused resend without losing the code step', async () => {
    const user = setupUser();
    let requests = 0;
    installFakeApi({
      'POST /auth/otp/request': () => {
        requests += 1;
        return requests === 1
          ? issuedChallenge
          : businessRefusal('otp_cooldown', 429, { retry_after: 12 });
      },
    });
    await renderApp({ route: '/sign-in', seenWelcome: true });
    await requestCode(user);
    advance(61_000);

    await user.click(await screen.findByRole('button', { name: 'Send a new code' }));

    expect(
      await screen.findByText('A code was sent a moment ago. You can ask for a new one in 0:12.'),
    ).toBeVisible();
    expect(screen.getByLabelText('6-digit code')).toBeVisible();
  });

  it('counts down in Arabic with Latin digits', async () => {
    const user = setupUser();
    installFakeApi({ 'POST /auth/otp/request': issuedChallenge });
    await renderApp({ route: '/sign-in', seenWelcome: true, language: 'ar' });

    await user.click(screen.getByRole('button', { name: 'استخدم رقم الجوال بدلًا من ذلك' }));
    await user.type(screen.getByLabelText('رقم الجوال'), '0512345678');
    await user.click(screen.getByRole('button', { name: 'إرسال الرمز' }));

    expect(await screen.findByText(/يمكنك طلب رمز جديد بعد 1:00/)).toBeVisible();
    advance(61_000);
    expect(await screen.findByRole('button', { name: 'إرسال رمز جديد' })).toBeVisible();
  });
});

describe('Sign in: changing the number', () => {
  it('goes back with the number filled in, and sends the code to the new one', async () => {
    const user = userEvent.setup();
    const api = installFakeApi({ 'POST /auth/otp/request': issuedChallenge });
    await renderApp({ route: '/sign-in', seenWelcome: true });
    await requestCode(user);

    await user.click(screen.getByRole('button', { name: 'Change number' }));

    const field = screen.getByLabelText('Mobile number');
    expect(field).toHaveValue('0512345678');
    expect(field).toHaveFocus();
    await user.clear(field);
    await user.type(field, '0598765432');
    await user.click(screen.getByRole('button', { name: 'Send code' }));
    await screen.findByRole('heading', { level: 2, name: 'Enter your code' });

    expect(api.calls().map((call) => call.body)).toEqual([
      { channel: 'phone', destination: '0512345678' },
      { channel: 'phone', destination: '0598765432' },
    ]);
    expect(screen.getByText('0598765432')).toBeVisible();
  });

  it('goes back to the code already sent when the same number is asked for within the cooldown', async () => {
    const user = userEvent.setup();
    let requests = 0;
    const api = installFakeApi({
      'POST /auth/otp/request': () => {
        requests += 1;
        return requests === 1
          ? issuedChallenge
          : businessRefusal('otp_cooldown', 429, { retry_after: 50 });
      },
      'POST /auth/otp/verify': verifiedLogin(),
    });
    await renderApp({ route: '/sign-in?next=%2Faccount', seenWelcome: true });
    await requestCode(user);
    await user.click(screen.getByRole('button', { name: 'Change number' }));

    await user.click(screen.getByRole('button', { name: 'Send code' }));

    expect(await screen.findByLabelText('6-digit code')).toBeVisible();
    expect(
      await screen.findByText('We already sent you a code a moment ago. Enter it below.'),
    ).toBeVisible();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await user.type(screen.getByLabelText('6-digit code'), CODE);
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await waitFor(() => {
      expect(api.calls().filter((call) => call.path === '/auth/otp/verify')).toHaveLength(1);
    });
    expect(api.calls().find((call) => call.path === '/auth/otp/verify')?.body).toMatchObject({
      challenge_id: CHALLENGE_ID,
    });
  });
});

describe('Sign in: email instead of a mobile number', () => {
  it('switches the field, checks the address and sends the code by email', async () => {
    const user = userEvent.setup();
    const api = installFakeApi({ 'POST /auth/otp/request': issuedChallenge });
    await renderApp({ route: '/sign-in', seenWelcome: true });

    const field = screen.getByLabelText('Email address');
    expect(field).toHaveFocus();
    expect(field).toHaveAttribute('type', 'email');
    expect(field).toHaveAttribute('autocomplete', 'email');
    expect(screen.queryByLabelText('Mobile number')).not.toBeInTheDocument();

    await user.type(field, 'not-an-email');
    await user.click(screen.getByRole('button', { name: 'Send code' }));
    expect(
      screen.getByText('Enter a valid email address, for example name@example.com.'),
    ).toBeVisible();
    expect(api.requests()).toEqual([]);

    await user.clear(field);
    await user.type(field, ' Sara@Example.com ');
    await user.click(screen.getByRole('button', { name: 'Send code' }));

    expect(await screen.findByText('sara@example.com')).toBeVisible();
    expect(api.calls()[0]?.body).toEqual({ channel: 'email', destination: 'sara@example.com' });
    expect(screen.getByRole('button', { name: 'Change email' })).toBeVisible();
  });

  it('can switch back to the mobile number', async () => {
    const user = userEvent.setup();
    await renderApp({ route: '/sign-in', seenWelcome: true });
    await user.click(screen.getByRole('button', { name: 'Use mobile number instead' }));

    expect(screen.getByLabelText('Mobile number')).toHaveFocus();
  });
});
