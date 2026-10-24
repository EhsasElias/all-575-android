import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('shows a title, a message and the next step', () => {
    render(
      <EmptyState
        icon="cart"
        title="Your cart is empty"
        message="Add products to see them here."
        action={<button type="button">Start shopping</button>}
      />,
    );

    expect(
      screen.getByRole('heading', { level: 2, name: 'Your cart is empty' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Add products to see them here.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start shopping' })).toBeInTheDocument();
  });

  it('hides the decorative icon from screen readers', () => {
    const { container } = render(<EmptyState icon="cart" title="Empty" />);

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('can be the page heading', () => {
    render(<EmptyState icon="cart" title="Empty" headingLevel={1} />);

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});
