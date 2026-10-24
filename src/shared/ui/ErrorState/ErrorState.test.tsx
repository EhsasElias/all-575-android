import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ErrorState } from './ErrorState';

describe('ErrorState', () => {
  it('says what happened and offers a retry', async () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument();
    expect(screen.getByText(/Check your connection/)).toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows a custom title and message', () => {
    render(<ErrorState onRetry={vi.fn()} title="No connection" message="Reconnect and retry." />);

    expect(screen.getByRole('heading', { name: 'No connection' })).toBeInTheDocument();
    expect(screen.getByText('Reconnect and retry.')).toBeInTheDocument();
  });

  it('uses the heading level it is given', () => {
    render(<ErrorState onRetry={vi.fn()} headingLevel={1} />);

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});
