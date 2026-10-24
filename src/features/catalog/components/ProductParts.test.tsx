import { render, screen } from '@testing-library/react';
import i18next from 'i18next';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { biscuits, makeProduct, notebook, socks } from '../testData';
import { AvailabilityBadge } from './AvailabilityBadge';
import { ProductCard } from './ProductCard';
import { ProductGrid } from './ProductGrid';
import { RatingSummary, StarRating } from './StarRating';

const inRouter = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('AvailabilityBadge', () => {
  it.each([
    ['in_stock', 'In stock', 'متوفر'],
    ['low_stock', 'Only a few left', 'كمية محدودة'],
    ['out_of_stock', 'Out of stock', 'غير متوفر'],
    ['unknown', 'Availability unknown', 'التوفر غير معروف'],
  ] as const)(
    'says %s in words and with an icon, in both languages',
    async (availability, en, ar) => {
      const { container } = render(<AvailabilityBadge availability={availability} />);

      expect(screen.getByText(en)).toBeVisible();
      expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');

      await i18next.changeLanguage('ar');
      expect(await screen.findByText(ar)).toBeVisible();
    },
  );

  it('uses a different icon for each state, so it never relies on color alone', () => {
    const shapes = (['in_stock', 'low_stock', 'out_of_stock', 'unknown'] as const).map(
      (availability) => {
        const { container, unmount } = render(<AvailabilityBadge availability={availability} />);
        const shape = container.querySelector('svg')?.innerHTML;
        unmount();
        return shape;
      },
    );

    expect(new Set(shapes).size).toBe(4);
  });
});

describe('StarRating', () => {
  it('has a text alternative with the rating out of five', () => {
    render(<StarRating value={4.5} />);

    expect(screen.getByRole('img', { name: 'Rated 4.5 out of 5' })).toBeVisible();
  });

  it('fills the rounded number of stars', () => {
    const { container } = render(<StarRating value={3.4} />);

    expect(container.querySelectorAll('svg')).toHaveLength(5);
    expect(container.querySelectorAll('svg[class*="filled"]')).toHaveLength(3);
  });

  it('stays between zero and five stars', () => {
    expect(
      render(<StarRating value={9} />).container.querySelectorAll('[class*="filled"]'),
    ).toHaveLength(5);
    expect(
      render(<StarRating value={-2} />).container.querySelectorAll('[class*="filled"]'),
    ).toHaveLength(0);
  });
});

describe('RatingSummary', () => {
  it('shows the average and the count, with the count also in words', () => {
    render(<RatingSummary average={4.25} count={1200} />);

    expect(screen.getByText('4.3 (1,200)')).toBeVisible();
    expect(screen.getByText('Number of ratings: 1,200')).toBeInTheDocument();
  });

  it('says there are no ratings yet, or nothing at all in the compact form', () => {
    const full = render(<RatingSummary average={0} count={0} />);
    expect(screen.getByText('No ratings yet')).toBeVisible();
    full.unmount();

    const compact = render(<RatingSummary average={0} count={0} compact />);
    expect(compact.container).toBeEmptyDOMElement();
  });

  it('reads the whole rating in the compact form', () => {
    render(<RatingSummary average={4.5} count={12} compact />);

    expect(screen.getByText('Rated 4.5 out of 5. Number of ratings: 12')).toBeInTheDocument();
  });
});

describe('ProductCard', () => {
  it('links to the product by name, with its price and seller', () => {
    inRouter(<ProductCard product={socks} />);

    expect(screen.getByRole('link', { name: 'Socks' })).toHaveAttribute(
      'href',
      '/products/demo-clothing-1',
    );
    expect(screen.getByText(/^5\.75\s+SAR$/)).toBeVisible();
    expect(screen.getByText('Home Store')).toBeVisible();
  });

  it('shows the availability it was given', () => {
    inRouter(<ProductCard product={makeProduct({ availability: 'out_of_stock' })} />);

    expect(screen.getByText('Out of stock')).toBeVisible();
  });

  it('can leave out "unknown" availability, but never hides a real one', () => {
    const { unmount } = inRouter(<ProductCard product={biscuits} hideUnknownAvailability />);
    expect(screen.queryByText('Availability unknown')).not.toBeInTheDocument();
    unmount();

    inRouter(
      <ProductCard product={makeProduct({ availability: 'low_stock' })} hideUnknownAvailability />,
    );
    expect(screen.getByText('Only a few left')).toBeVisible();
  });

  it('uses a placeholder, not an image, when the product has no picture', () => {
    const { container } = inRouter(<ProductCard product={notebook} />);

    expect(container.querySelector('img')).toBeNull();
  });

  it('falls back to a placeholder when the picture cannot be loaded', async () => {
    const { container } = inRouter(<ProductCard product={biscuits} />);

    container.querySelector('img')?.dispatchEvent(new Event('error'));

    expect(await screen.findByRole('link', { name: 'Biscuits' })).toBeVisible();
    await expect.poll(() => container.querySelector('img')).toBeNull();
  });

  it('shows the name in the other language only when the chosen one is empty', async () => {
    inRouter(<ProductCard product={makeProduct({ name: { ar: '', en: 'Biscuits' } })} />);
    await i18next.changeLanguage('ar');

    expect(await screen.findByRole('link', { name: 'Biscuits' })).toBeVisible();
  });
});

describe('ProductGrid', () => {
  it('lists every product and loads only the first row of pictures eagerly', () => {
    const products = [1, 2, 3, 4].map((id) =>
      makeProduct({ id, slug: `p${id}`, name: { ar: `م${id}`, en: `P${id}` } }),
    );
    const { container } = inRouter(<ProductGrid products={products} />);

    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    expect(
      [...container.querySelectorAll('img')].map((image) => image.getAttribute('loading')),
    ).toEqual(['eager', 'eager', 'eager', 'lazy']);
  });
});
