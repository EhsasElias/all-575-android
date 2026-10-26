import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearTrace, getTraceSnapshot } from '@/shared/api/requestTrace';
import { CatalogImage } from './CatalogImage';

const SRC = 'http://192.168.8.104:8000/images/all575/category-art/clothing.png?v=2';

afterEach(() => {
  vi.unstubAllEnvs();
  clearTrace();
});

describe('CatalogImage', () => {
  it('shows the picture, and a placeholder when there is none', () => {
    const { rerender } = render(<CatalogImage src={SRC} alt="Clothing" size={96} />);
    expect(screen.getByRole('img', { name: 'Clothing' })).toHaveAttribute('src', SRC);

    rerender(<CatalogImage src={null} alt="Clothing" size={96} />);
    expect(screen.queryByRole('img', { name: 'Clothing' })).not.toBeInTheDocument();
  });

  it('swaps in the placeholder when the picture cannot be loaded', () => {
    render(<CatalogImage src={SRC} alt="Clothing" size={96} />);

    fireEvent.error(screen.getByRole('img', { name: 'Clothing' }));

    expect(screen.queryByRole('img', { name: 'Clothing' })).not.toBeInTheDocument();
  });

  it('lists the failed picture, without its query, in a test build', () => {
    vi.stubEnv('VITE_TEST_PANEL', 'true');
    render(<CatalogImage src={SRC} alt="Clothing" size={96} />);

    fireEvent.error(screen.getByRole('img', { name: 'Clothing' }));

    expect(getTraceSnapshot()).toMatchObject([
      {
        method: 'IMG',
        path: 'http://192.168.8.104:8000/images/all575/category-art/clothing.png',
        stage: 'failed',
      },
    ]);
  });

  it('keeps no trace in a normal build', () => {
    vi.stubEnv('VITE_TEST_PANEL', '');
    render(<CatalogImage src={SRC} alt="Clothing" size={96} />);

    fireEvent.error(screen.getByRole('img', { name: 'Clothing' }));

    expect(getTraceSnapshot()).toEqual([]);
  });
});
