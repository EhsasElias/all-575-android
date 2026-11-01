import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/lib', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/lib')>()),
  isTestServerEnabled: () => false,
}));
import { installFakeApi } from '@/test/fakeApi';
import { renderApp } from '@/test/render';

describe('A build that is not a test build', () => {
  it('has no server screen and no test bar', async () => {
    installFakeApi();

    await renderApp({ route: '/test-server', seenWelcome: true });

    expect(await screen.findByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
    expect(screen.queryByText('Test build')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Change server' })).not.toBeInTheDocument();
  });
});
