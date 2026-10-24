import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';
import { ButtonLink } from './ButtonLink';

describe('Button', () => {
  it('is a real button that does not submit forms unless asked to', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('type', 'button');
  });

  it('calls onClick', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);

    await userEvent.setup().click(screen.getByRole('button', { name: 'Save' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('can be used with the keyboard', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={onClick}>Save</Button>);

    await user.tab();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');

    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('ignores clicks when disabled', async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Save
      </Button>,
    );

    await userEvent.setup().click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('shows it is busy while loading, ignores clicks, and stays focusable', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <Button loading onClick={onClick}>
        Pay
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Pay' });

    await user.click(button);

    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).not.toBeDisabled();
    expect(button).toHaveFocus();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('does not submit a form while loading', async () => {
    const onSubmit = vi.fn((event: { preventDefault: () => void }) => {
      event.preventDefault();
    });
    render(
      <form onSubmit={onSubmit}>
        <Button type="submit" loading>
          Pay
        </Button>
      </form>,
    );

    await userEvent.setup().click(screen.getByRole('button', { name: 'Pay' }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits a form when idle', async () => {
    const onSubmit = vi.fn((event: { preventDefault: () => void }) => {
      event.preventDefault();
    });
    render(
      <form onSubmit={onSubmit}>
        <Button type="submit">Pay</Button>
      </form>,
    );

    await userEvent.setup().click(screen.getByRole('button', { name: 'Pay' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});

describe('ButtonLink', () => {
  it('is a real link to the destination', () => {
    render(
      <MemoryRouter>
        <ButtonLink to="/cart" variant="secondary">
          Go to cart
        </ButtonLink>
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Go to cart' })).toHaveAttribute('href', '/cart');
  });
});
