import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ToastProvider } from './ToastProvider';
import { useToast, type ToastOptions } from './toastContext';

function Trigger({ options }: { options: ToastOptions }) {
  const { showToast } = useToast();
  return (
    <button
      type="button"
      onClick={() => {
        showToast(options);
      }}
    >
      Notify
    </button>
  );
}

function renderToast(options: ToastOptions) {
  return render(
    <ToastProvider>
      <Trigger options={options} />
    </ToastProvider>,
  );
}

describe('Toast', () => {
  it('has a polite live region that is present before any toast', () => {
    renderToast({ message: 'Saved' });

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('shows a message inside the live region', async () => {
    renderToast({ message: 'Added to cart', variant: 'success' });

    await userEvent.setup().click(screen.getByRole('button', { name: 'Notify' }));

    expect(screen.getByRole('status')).toHaveTextContent('Added to cart');
  });

  it('can be dismissed with its button', async () => {
    const user = userEvent.setup();
    renderToast({ message: 'Added to cart' });
    await user.click(screen.getByRole('button', { name: 'Notify' }));

    await user.click(screen.getByRole('button', { name: 'Dismiss' }));

    expect(screen.queryByText('Added to cart')).not.toBeInTheDocument();
  });

  it('goes away on its own after its duration', () => {
    vi.useFakeTimers();
    renderToast({ message: 'Added to cart', durationMs: 3000 });
    act(() => {
      screen.getByRole('button', { name: 'Notify' }).click();
    });
    expect(screen.getByText('Added to cart')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2999);
    });
    expect(screen.getByText('Added to cart')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.queryByText('Added to cart')).not.toBeInTheDocument();
  });

  it('waits while the pointer is on it', () => {
    vi.useFakeTimers();
    renderToast({ message: 'Added to cart', durationMs: 3000 });
    act(() => {
      screen.getByRole('button', { name: 'Notify' }).click();
    });
    const message = screen.getByText('Added to cart');
    const toast = message.parentElement;
    if (!toast) throw new Error('Toast container missing');

    act(() => {
      toast.dispatchEvent(new MouseEvent('mouseenter'));
    });
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(screen.getByText('Added to cart')).toBeInTheDocument();

    act(() => {
      toast.dispatchEvent(new MouseEvent('mouseleave'));
    });
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.queryByText('Added to cart')).not.toBeInTheDocument();
  });

  it('does not restart older toasts when a new one arrives', () => {
    vi.useFakeTimers();
    renderToast({ message: 'Hello', durationMs: 3000 });
    const notify = screen.getByRole('button', { name: 'Notify' });
    act(() => {
      notify.click();
    });
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    act(() => {
      notify.click();
    });
    expect(screen.getAllByText('Hello')).toHaveLength(2);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // The first toast expires on its own schedule; the second is untouched.
    expect(screen.getAllByText('Hello')).toHaveLength(1);
  });

  it('refuses to be used outside its provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => render(<Trigger options={{ message: 'x' }} />)).toThrow(/ToastProvider/);

    spy.mockRestore();
  });
});
