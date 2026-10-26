import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18next from 'i18next';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installFakeApi } from '@/test/fakeApi';
import { restartApp } from './restartApp';
import { TestBuildBanner } from './TestBuildBanner';
import { TestServerScreen } from './TestServerScreen';

vi.mock('./restartApp', () => ({ restartApp: vi.fn() }));

const STORED = 'all575.testServer';
const LAPTOP = 'http://192.168.1.23:8000/api/v1';

beforeEach(() => {
  vi.mocked(restartApp).mockClear();
  vi.stubEnv('VITE_TEST_PANEL', 'true');
});

afterEach(() => {
  window.localStorage.clear();
  vi.unstubAllEnvs();
});

function openScreen(routes: Parameters<typeof installFakeApi>[0] = {}) {
  const api = installFakeApi({ 'GET /store': { body: { data: {} } }, ...routes });
  render(
    <MemoryRouter initialEntries={['/test-server']}>
      <TestBuildBanner />
      <TestServerScreen />
    </MemoryRouter>,
  );
  return { user: userEvent.setup(), api };
}

async function typeAddress(user: ReturnType<typeof userEvent.setup>, label: string, text: string) {
  const field = screen.getByRole('textbox', { name: label });
  await user.clear(field);
  await user.type(field, text);
}

describe('Test build: the server address', () => {
  it('shows the bar and the way to this screen', () => {
    openScreen();

    expect(screen.getByRole('heading', { level: 1, name: 'Server address' })).toBeVisible();
    expect(screen.getByText('Test build')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Change server' })).toHaveAttribute(
      'href',
      '/test-server',
    );
  });

  it('checks that a server answers, using the address as typed plus the API path', async () => {
    const { user, api } = openScreen();

    await typeAddress(user, 'Server address', '192.168.1.23:8000');
    await user.click(screen.getByRole('button', { name: 'Check the connection' }));

    expect(await screen.findByText('Connected. This server answers.')).toBeVisible();
    const sent = api.fetchFn.mock.calls.map(([input, init]) => ({
      url: typeof input === 'string' ? input : '',
      headers: new Headers(init?.headers),
    }));
    expect(sent.map((call) => call.url)).toEqual([`${LAPTOP}/store`]);
    // It only asks whether the server answers: no sign-in token goes along.
    expect(sent[0]?.headers.has('Authorization')).toBe(false);
    expect(restartApp).not.toHaveBeenCalled();
  });

  it('says so when the server cannot be reached', async () => {
    const { user } = openScreen({ 'GET /store': 'offline' });

    await typeAddress(user, 'Server address', '192.168.1.99:8000');
    await user.click(screen.getByRole('button', { name: 'Check the connection' }));

    expect(await screen.findByText(/Could not reach this server/)).toBeVisible();
  });

  it('says so when the server answers with an error', async () => {
    const { user } = openScreen({ 'GET /store': { status: 502, body: {} } });

    await typeAddress(user, 'Server address', '192.168.1.99:8000');
    await user.click(screen.getByRole('button', { name: 'Check the connection' }));

    expect(await screen.findByText(/Could not reach this server/)).toBeVisible();
  });

  it('forgets a result as soon as the address is edited', async () => {
    const { user } = openScreen();

    await typeAddress(user, 'Server address', '192.168.1.23:8000');
    await user.click(screen.getByRole('button', { name: 'Check the connection' }));
    await screen.findByText('Connected. This server answers.');
    await user.type(screen.getByRole('textbox', { name: 'Server address' }), '1');

    expect(screen.queryByText('Connected. This server answers.')).not.toBeInTheDocument();
  });

  it('refuses something that is not a web address, and neither checks nor restarts', async () => {
    const { user, api } = openScreen();

    await typeAddress(user, 'Server address', 'not a url');
    await user.click(screen.getByRole('button', { name: 'Check the connection' }));
    await user.click(screen.getByRole('button', { name: 'Save and restart' }));

    expect(await screen.findByText(/This is not a web address/)).toBeVisible();
    expect(api.requests()).toEqual([]);
    expect(window.localStorage.getItem(STORED)).toBeNull();
    expect(restartApp).not.toHaveBeenCalled();
  });

  it('saves the address and restarts, so every request goes to the new server', async () => {
    const { user } = openScreen();

    await typeAddress(user, 'Server address', '192.168.1.23:8000');
    await user.click(screen.getByRole('button', { name: 'Save and restart' }));

    expect(window.localStorage.getItem(STORED)).toBe(LAPTOP);
    expect(restartApp).toHaveBeenCalledTimes(1);
  });

  it('does not restart when the device will not keep the address', async () => {
    const { user } = openScreen();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('full');
    });

    await typeAddress(user, 'Server address', '192.168.1.23:8000');
    await user.click(screen.getByRole('button', { name: 'Save and restart' }));

    expect(await screen.findByText('This device would not keep the address.')).toBeVisible();
    expect(restartApp).not.toHaveBeenCalled();
  });

  it('goes back to the built-in address', async () => {
    window.localStorage.setItem(STORED, LAPTOP);
    const { user } = openScreen();

    await user.click(screen.getByRole('button', { name: 'Use the built-in address' }));

    expect(window.localStorage.getItem(STORED)).toBeNull();
    expect(restartApp).toHaveBeenCalledTimes(1);
  });

  it('works in Arabic, with the address kept left to right', async () => {
    await i18next.changeLanguage('ar');
    openScreen();

    expect(screen.getByRole('heading', { level: 1, name: 'عنوان الخادم' })).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'عنوان الخادم' })).toHaveAttribute('dir', 'ltr');
    expect(screen.getByRole('button', { name: 'احفظ وأعد التشغيل' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'تغيير الخادم' })).toBeVisible();
  });
});

describe('The bar outside a test build', () => {
  it('is not shown', () => {
    vi.stubEnv('VITE_TEST_PANEL', '');

    render(
      <MemoryRouter>
        <TestBuildBanner />
      </MemoryRouter>,
    );

    expect(screen.queryByText('Test build')).not.toBeInTheDocument();
  });
});

describe('The route', () => {
  it('exists in a test build and only there', async () => {
    vi.stubEnv('VITE_TEST_PANEL', 'true');
    vi.resetModules();
    const inTestBuild = (await import('./routes')).testServerRoutes;

    vi.stubEnv('VITE_TEST_PANEL', '');
    vi.resetModules();
    const elsewhere = (await import('./routes')).testServerRoutes;

    expect(inTestBuild.map((route) => route.path)).toEqual(['/test-server']);
    expect(elsewhere).toEqual([]);
  });
});
