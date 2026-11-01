import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { installFakeApi, type FakeRoutes } from '@/test/fakeApi';
import { renderApp } from '@/test/render';
import { forgetFlow } from './signInMemory';
import { requestCode, submitCode } from './testActions';
import { CODE, businessRefusal, issuedChallenge } from './testData';

type Reply = FakeRoutes[string];

const RAW_SERVER_TEXT = 'Server wording that must never be shown';

beforeEach(() => {
  forgetFlow();
  vi.stubEnv('VITE_FIREBASE_AUTH_ENABLED', 'true');
});

async function openCodeStep(verifyReply: Reply) {
  const user = userEvent.setup();
  const api = installFakeApi({
    'POST /auth/otp/request': issuedChallenge,
    'POST /auth/otp/verify': verifyReply,
  });
  await renderApp({ route: '/sign-in', seenWelcome: true });
  await requestCode(user);
  return { user, api };
}

describe('Sign in: a wrong code', () => {
  it('says how many attempts are left, next to the field, and gets the field ready again', async () => {
    const { user } = await openCodeStep(
      businessRefusal('otp_invalid', 422, { attempts_remaining: 3 }),
    );

    await submitCode(user, '999999');

    const field = screen.getByLabelText('6-digit code');
    expect(await screen.findByText('That code is not correct. Attempts left: 3.')).toBeVisible();
    expect(field).toHaveAccessibleDescription(expect.stringContaining('Attempts left: 3'));
    expect(field).toBeInvalid();
    expect(field).toHaveFocus();
    expect(screen.queryByText(RAW_SERVER_TEXT)).not.toBeInTheDocument();
  });

  it('lets the customer try again with another code', async () => {
    let attempts = 0;
    const { user, api } = await openCodeStep(() => {
      attempts += 1;
      return businessRefusal('otp_invalid', 422, { attempts_remaining: 5 - attempts });
    });

    await submitCode(user, '111111');
    await screen.findByText('That code is not correct. Attempts left: 4.');
    await user.keyboard('222222');
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByText('That code is not correct. Attempts left: 3.')).toBeVisible();
    const sent = api.calls().filter((call) => call.path === '/auth/otp/verify');
    expect(sent.map((call) => call.body)).toMatchObject([{ code: '111111' }, { code: '222222' }]);
  });

  it('does not send a code that is not six digits', async () => {
    const { user, api } = await openCodeStep(businessRefusal('otp_invalid', 422));

    await user.type(screen.getByLabelText('6-digit code'), '12345');
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByText('Enter the 6-digit code.')).toBeVisible();
    expect(screen.getByLabelText('6-digit code')).toHaveFocus();
    expect(api.requests()).not.toContain('POST /auth/otp/verify');
  });

  it('keeps only digits in the field', async () => {
    const { user } = await openCodeStep(businessRefusal('otp_invalid', 422));

    await user.type(screen.getByLabelText('6-digit code'), '1a2-3 4x5y6789');

    expect(screen.getByLabelText('6-digit code')).toHaveValue('123456');
  });
});

describe('Sign in: a code that cannot be used', () => {
  it('asks for a new code when it expired, and stops the Continue button', async () => {
    const { user } = await openCodeStep(businessRefusal('otp_expired', 422));

    await submitCode(user);

    expect(
      await screen.findByText('This code has expired. Send a new code to continue.'),
    ).toBeVisible();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
    expect(screen.queryByText(RAW_SERVER_TEXT)).not.toBeInTheDocument();
  });

  it('asks for a new code after too many wrong ones', async () => {
    const { user } = await openCodeStep(businessRefusal('otp_locked', 429, { retry_after: 60 }));

    await submitCode(user);

    expect(
      await screen.findByText('Too many wrong codes. Send a new code to continue.'),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
  });
});

describe('Sign in: other refusals when checking the code', () => {
  it('tells an inactive account it cannot sign in', async () => {
    const { user } = await openCodeStep(businessRefusal('account_inactive', 403));

    await submitCode(user);

    expect(
      await screen.findByText(
        'This account is not active, so you cannot sign in. Please contact customer support.',
      ),
    ).toBeVisible();
    expect(screen.queryByText(RAW_SERVER_TEXT)).not.toBeInTheDocument();
  });

  it('tells the customer how long to wait after too many requests', async () => {
    const { user } = await openCodeStep({
      status: 429,
      headers: { 'Retry-After': '90' },
      body: { message: 'Too Many Attempts.' },
    });

    await submitCode(user);

    expect(await screen.findByText('Too many attempts. Wait 1:30 and try again.')).toBeVisible();
  });

  it('still helps when the wait is not known', async () => {
    const { user } = await openCodeStep({ status: 429, body: { message: 'Too Many Attempts.' } });

    await submitCode(user);

    expect(
      await screen.findByText('Too many attempts. Wait a little and try again.'),
    ).toBeVisible();
  });

  it('says so when the network is down, and keeps the code that was typed', async () => {
    const { user } = await openCodeStep('offline');

    await submitCode(user);

    expect(
      await screen.findByText(
        'We could not reach the server. Check your connection and try again.',
      ),
    ).toBeVisible();
    expect(screen.getByLabelText('6-digit code')).toHaveValue(CODE);
  });

  it('shows a plain message for a server error, never the server text', async () => {
    const { user } = await openCodeStep({ status: 500, body: { message: RAW_SERVER_TEXT } });

    await submitCode(user);

    expect(await screen.findByText('Something went wrong. Please try again.')).toBeVisible();
    expect(screen.queryByText(RAW_SERVER_TEXT)).not.toBeInTheDocument();
  });
});

describe('Sign in: asking for the code', () => {
  async function openFirstStep(requestReply: Reply) {
    const user = userEvent.setup();
    const api = installFakeApi({ 'POST /auth/otp/request': requestReply });
    await renderApp({ route: '/sign-in', seenWelcome: true });
    await user.click(await screen.findByRole('button', { name: 'Use one-time code (OTP)' }));
    await user.click(await screen.findByRole('button', { name: 'Use mobile number instead' }));
    return { user, api };
  }

  it('asks for the number before sending anything', async () => {
    const { user, api } = await openFirstStep(issuedChallenge);

    await user.click(screen.getByRole('button', { name: 'Send code' }));

    expect(screen.getByText('Enter your mobile number.')).toBeVisible();
    expect(screen.getByLabelText('Mobile number')).toHaveFocus();
    expect(screen.getByLabelText('Mobile number')).toBeInvalid();
    expect(api.requests().filter((request) => request === 'POST /auth/otp/request')).toEqual([]);
  });

  it.each(['0112345678', '05123', '+971512345678', 'hello'])(
    'rejects %s as a mobile number before sending anything',
    async (typed) => {
      const { user, api } = await openFirstStep(issuedChallenge);

      await user.type(screen.getByLabelText('Mobile number'), typed);
      await user.click(screen.getByRole('button', { name: 'Send code' }));

      expect(
        screen.getByText('Enter a Saudi mobile number, for example 0512345678.'),
      ).toBeVisible();
      expect(screen.getByLabelText('Mobile number')).toHaveFocus();
      expect(api.requests().filter((request) => request === 'POST /auth/otp/request')).toEqual([]);
    },
  );

  it('clears the message once the customer starts typing again', async () => {
    const { user } = await openFirstStep(issuedChallenge);
    await user.click(screen.getByRole('button', { name: 'Send code' }));

    await user.type(screen.getByLabelText('Mobile number'), '0');

    expect(screen.queryByText('Enter your mobile number.')).not.toBeInTheDocument();
  });

  it('shows the field error next to the field when the server rejects the number', async () => {
    const { user } = await openFirstStep({
      status: 422,
      body: { message: RAW_SERVER_TEXT, errors: { destination: [RAW_SERVER_TEXT] } },
    });

    await user.type(screen.getByLabelText('Mobile number'), '0512345678');
    await user.click(screen.getByRole('button', { name: 'Send code' }));

    const field = screen.getByLabelText('Mobile number');
    expect(
      await screen.findByText('Enter a Saudi mobile number, for example 0512345678.'),
    ).toBeVisible();
    expect(field).toBeInvalid();
    expect(field).toHaveFocus();
    expect(screen.queryByText(RAW_SERVER_TEXT)).not.toBeInTheDocument();
  });

  it('tells the customer to wait when too many codes were asked for', async () => {
    const { user } = await openFirstStep({
      status: 429,
      headers: { 'Retry-After': '25' },
      body: { message: 'Too Many Attempts.' },
    });

    await user.type(screen.getByLabelText('Mobile number'), '0512345678');
    await user.click(screen.getByRole('button', { name: 'Send code' }));

    expect(await screen.findByText('Too many attempts. Wait 0:25 and try again.')).toBeVisible();
    expect(screen.getByLabelText('Mobile number')).toHaveValue('0512345678');
  });

  it('says how long to wait when a code was just sent to another number', async () => {
    const { user } = await openFirstStep(businessRefusal('otp_cooldown', 429, { retry_after: 45 }));

    await user.type(screen.getByLabelText('Mobile number'), '0512345678');
    await user.click(screen.getByRole('button', { name: 'Send code' }));

    expect(
      await screen.findByText('A code was sent a moment ago. You can ask for a new one in 0:45.'),
    ).toBeVisible();
  });

  it('shows a message when the network is down, and keeps what was typed', async () => {
    const { user } = await openFirstStep('offline');

    await user.type(screen.getByLabelText('Mobile number'), '0512345678');
    await user.click(screen.getByRole('button', { name: 'Send code' }));

    expect(
      await screen.findByText(
        'We could not reach the server. Check your connection and try again.',
      ),
    ).toBeVisible();
    expect(screen.getByLabelText('Mobile number')).toHaveValue('0512345678');
  });
});
