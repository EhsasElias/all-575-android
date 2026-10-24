import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderApp } from '@/test/render';
import { installProductApi } from '../testApi';
import { makeProductDetail, makeVariant, sizedProduct } from '../testData';

// The shared test setup has already loaded the app, so the cart module is cached; clear the cache for this file.
vi.hoisted(() => {
  vi.resetModules();
});

vi.mock('@/features/cart', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  AddToCart: (await import('../testCartMock')).FakeAddToCart,
}));

function renderProduct() {
  return renderApp({ route: '/products/demo-food-1', seenWelcome: true });
}

const addToCart = () => screen.getByTestId('add-to-cart');

describe('Availability on the product page', () => {
  it('asks the customer to choose an area while availability is unknown', async () => {
    installProductApi();
    await renderProduct();

    expect(await screen.findByText('Availability unknown')).toBeVisible();
    expect(
      screen.getByText('Choose your area to see if this is available for delivery.'),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Choose your delivery area' })).toBeVisible();
  });

  it.each([
    ['in_stock', 'In stock'],
    ['low_stock', 'Only a few left'],
    ['out_of_stock', 'Out of stock'],
  ] as const)('shows %s as "%s"', async (availability, label) => {
    installProductApi(makeProductDetail({ variants: [makeVariant({ availability })] }));
    await renderProduct();

    expect(await screen.findByText(label)).toBeVisible();
    expect(
      screen.queryByText('Choose your area to see if this is available for delivery.'),
    ).not.toBeInTheDocument();
  });
});

describe('Variants', () => {
  it('shows a picker with every variant, and labels the ones that are not fully available', async () => {
    installProductApi(sizedProduct);
    await renderProduct();

    const picker = await screen.findByRole('group', { name: 'Choose an option' });
    expect(within(picker).getAllByRole('radio')).toHaveLength(3);
    expect(within(picker).getByRole('radio', { name: /Small/ })).toBeVisible();
    expect(within(picker).getByText('Out of stock')).toBeVisible();
    expect(within(picker).getByText('Only a few left')).toBeVisible();
  });

  it('starts on the first variant that can be bought', async () => {
    installProductApi(sizedProduct);
    await renderProduct();

    await screen.findByRole('group', { name: 'Choose an option' });
    expect(screen.getByRole('radio', { name: /Medium/ })).toBeChecked();
    expect(addToCart()).toHaveAttribute('data-variant-id', '11');
  });

  it('gives the cart the variant the customer picks, and shows its availability', async () => {
    installProductApi(sizedProduct);
    const user = userEvent.setup();
    await renderProduct();
    await screen.findByRole('group', { name: 'Choose an option' });

    await user.click(screen.getByRole('radio', { name: /Large/ }));
    expect(addToCart()).toHaveAttribute('data-variant-id', '12');
    expect(screen.getByRole('radio', { name: /Large/ })).toBeChecked();

    // An unavailable variant can be looked at; the badge says what is wrong.
    await user.click(screen.getByRole('radio', { name: /Small/ }));
    expect(addToCart()).toHaveAttribute('data-variant-id', '10');
    expect(screen.getAllByText('Out of stock').length).toBeGreaterThanOrEqual(2);
  });

  it('can be chosen with the keyboard', async () => {
    installProductApi(sizedProduct);
    const user = userEvent.setup();
    await renderProduct();
    await screen.findByRole('group', { name: 'Choose an option' });

    screen.getByRole('radio', { name: /Medium/ }).focus();
    await user.keyboard('{ArrowDown}');

    expect(screen.getByRole('radio', { name: /Large/ })).toBeChecked();
    expect(addToCart()).toHaveAttribute('data-variant-id', '12');
  });

  it('names a variant that has no name by its code', async () => {
    installProductApi(
      makeProductDetail({
        variants: [makeVariant({ id: 1, sku: 'A-1' }), makeVariant({ id: 2, sku: 'A-2' })],
      }),
    );
    await renderProduct();

    expect(await screen.findByRole('radio', { name: 'A-1' })).toBeVisible();
    expect(screen.getByRole('radio', { name: 'A-2' })).toBeVisible();
  });
});
