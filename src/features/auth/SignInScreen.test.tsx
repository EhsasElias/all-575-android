import { Capacitor } from '@capacitor/core';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { tokenStore } from '@/shared/api';
import { installFakeApi } from '@/test/fakeApi';
import { testUser } from '@/test/fixtures';
import { renderApp } from '@/test/render';
import { forgetFlow } from './signInMemory';
import { requestCode, submitCode } from './testActions';
import { CHALLENGE_ID, CODE, TOKEN, issuedChallenge, verifiedLogin } from './testData';

const returningCustomerApi = () =>
  installFakeApi({
    'POST /auth/otp/request': issuedChallenge,
    'POST /auth/otp/verify': verifiedLogin(),
  });

beforeEach(forgetFlow);

describe('Sign in: a returning customer', () => {
  it('asks for a code, checks it, signs in and goes to the page they came from', async () => {
    const user = userEvent.setup();
    const api = returningCustomerApi();
    const { router } = await renderApp({ route: '/sign-in?next=%2Faccount', seenWelcome: true });

    expect(screen.getByRole('heading', { level: 1, name: 'Sign in' })).toBeInTheDocument();
    await requestCode(user);
    await submitCode(user);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/account');
    });
    const sent = api.calls().filter((call) => call.path.startsWith('/auth'));
    expect(sent.map((call) => [call.method, call.path, call.body])).toEqual([
      ['POST', '/auth/otp/request', { channel: 'phone', destination: '0512345678' }],
      [
        'POST',
        '/auth/otp/verify',
        { challenge_id: CHALLENGE_ID, code: CODE, device_name: 'Web browser' },
      ],
    ]);
    expect(await tokenStore.get()).toBe(TOKEN);
    expect(await screen.findByText('You are signed in. Welcome back!')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 1, name: 'Account' })).toBeInTheDocument();
  });

  it('goes home when there is no page to return to', async () => {
    const user = userEvent.setup();
    returningCustomerApi();
    const { router } = await renderApp({ route: '/sign-in', seenWelcome: true });

    await requestCode(user);
    await submitCode(user);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/home');
    });
  });

  it.each([
    ['https://evil.example/steal', 'another site'],
    ['//evil.example', 'a protocol-relative link'],
    ['/sign-in', 'the sign-in screen itself'],
    ['/sign-in?next=%2Fsign-in', 'the sign-in screen with a query'],
  ])('ignores a next page that is %s', async (next) => {
    const user = userEvent.setup();
    returningCustomerApi();
    const { router } = await renderApp({
      route: `/sign-in?next=${encodeURIComponent(next)}`,
      seenWelcome: true,
    });

    await requestCode(user);
    await submitCode(user);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/home');
    });
  });

  it('names the device "Android app" in the native app', async () => {
    vi.spyOn(Capacitor, 'getPlatform').mockReturnValue('android');
    const user = userEvent.setup();
    const api = returningCustomerApi();
    await renderApp({ route: '/sign-in', seenWelcome: true });

    await requestCode(user);
    await submitCode(user);

    await screen.findByText('You are signed in. Welcome back!');
    const verify = api.calls().find((call) => call.path === '/auth/otp/verify');
    expect(verify?.body).toMatchObject({ device_name: 'Android app' });
  });

  it('accepts a code pasted with a space in it', async () => {
    const user = userEvent.setup();
    const api = returningCustomerApi();
    await renderApp({ route: '/sign-in', seenWelcome: true });
    await requestCode(user);

    await user.click(screen.getByLabelText('6-digit code'));
    await user.paste('123 456');
    expect(screen.getByLabelText('6-digit code')).toHaveValue('123456');
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await screen.findByText('You are signed in. Welcome back!');
    expect(api.calls().find((call) => call.path === '/auth/otp/verify')?.body).toMatchObject({
      code: '123456',
    });
  });
});

describe('Sign in: the code step', () => {
  it('shows where the code went and makes the code field ready to type in', async () => {
    const user = userEvent.setup();
    returningCustomerApi();
    await renderApp({ route: '/sign-in', seenWelcome: true });

    await requestCode(user, '+966 51 234 5678');

    const field = screen.getByLabelText('6-digit code');
    expect(field).toHaveFocus();
    expect(field).toHaveAttribute('inputmode', 'numeric');
    expect(field).toHaveAttribute('autocomplete', 'one-time-code');
    expect(screen.getByText('We sent a 6-digit code to:')).toBeInTheDocument();
    expect(screen.getByText('+966512345678')).toBeInTheDocument();
  });

  it('keeps the mobile number field labelled, with its hint, before anything is typed', async () => {
    await renderApp({ route: '/sign-in', seenWelcome: true });

    const field = screen.getByLabelText('Mobile number');
    expect(field).toHaveAttribute('type', 'tel');
    expect(field).toHaveAttribute('autocomplete', 'tel');
    expect(field).toHaveAccessibleDescription('A Saudi mobile number, for example 0512345678.');
    expect(field).not.toHaveAttribute('placeholder');
  });
});

describe('Sign in: someone who is already signed in', () => {
  it('is sent on to the page they asked for', async () => {
    installFakeApi({ 'GET /me': { body: { data: testUser } } });
    const { router } = await renderApp({
      route: '/sign-in?next=%2Faccount',
      signedIn: true,
      seenWelcome: true,
    });

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/account');
    });
    expect(screen.queryByLabelText('Mobile number')).not.toBeInTheDocument();
  });

  it('is sent home without a next page', async () => {
    installFakeApi({ 'GET /me': { body: { data: testUser } } });
    const { router } = await renderApp({ route: '/sign-in', signedIn: true, seenWelcome: true });

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/home');
    });
  });
});

describe('Sign in: Arabic', () => {
  it('reads right to left and signs in with Arabic text', async () => {
    const user = userEvent.setup();
    const api = returningCustomerApi();
    const { router } = await renderApp({
      route: '/sign-in?next=%2Faccount',
      seenWelcome: true,
      language: 'ar',
    });

    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    expect(screen.getByRole('heading', { level: 1, name: 'تسجيل الدخول' })).toBeInTheDocument();
    expect(document.title).toBe('تسجيل الدخول · الكل بـ 5.75');

    await user.type(screen.getByLabelText('رقم الجوال'), '٠٥١٢٣٤٥٦٧٨');
    await user.click(screen.getByRole('button', { name: 'إرسال الرمز' }));
    await user.type(await screen.findByLabelText('رمز التحقق (6 أرقام)'), '١٢٣٤٥٦');
    await user.click(screen.getByRole('button', { name: 'متابعة' }));

    expect(await screen.findByText('تم تسجيل دخولك. أهلًا بعودتك!')).toBeInTheDocument();
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/account');
    });
    expect(api.calls()[0]?.body).toEqual({ channel: 'phone', destination: '0512345678' });
    expect(api.calls()[1]?.body).toMatchObject({ code: '123456' });
  });

  it('shows no English on the first step', async () => {
    await renderApp({ route: '/sign-in', seenWelcome: true, language: 'ar' });

    const main = screen.getByRole('main');
    expect(within(main).queryByText('Sign in')).not.toBeInTheDocument();
    expect(within(main).queryByText('Send code')).not.toBeInTheDocument();
  });
});
