import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TestBuildBanner } from './TestBuildBanner';

describe('A build that is not a test build', () => {
  it('does not register the server route or display the test bar', async () => {
    vi.stubEnv('VITE_TEST_PANEL', 'false');
    vi.resetModules();

    // Routes are assembled at module initialization, as in a fresh production build.
    const { testServerRoutes } = await import('./routes');
    expect(testServerRoutes).toEqual([]);

    render(createElement(TestBuildBanner));
    expect(screen.queryByText('Test build')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Change server' })).not.toBeInTheDocument();
  });
});
