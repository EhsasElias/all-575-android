import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { CheckoutBar } from './CheckoutBar';

describe('CheckoutBar', () => {
  it('prevents proceeding when one or more cart items are unavailable', () => {
    render(<MemoryRouter><CheckoutBar canCheckout={false} /></MemoryRouter>);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('links to checkout only when all items are available', () => {
    render(<MemoryRouter><CheckoutBar canCheckout /></MemoryRouter>);

    expect(screen.getByRole('link')).toHaveAttribute('href', '/checkout');
  });
});
