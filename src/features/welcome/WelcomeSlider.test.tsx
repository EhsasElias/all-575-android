import { act, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { setReducedMotion } from '@/test/browserStubs';
import { renderApp } from '@/test/render';

const dash = (n: number) => screen.getByRole('button', { name: `Slide ${n} of 3` });
const currentSlide = () =>
  [1, 2, 3].filter((n) => dash(n).getAttribute('aria-current') === 'true').map((n) => n - 1)[0];
const advance = (ms: number) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

describe('Welcome slider card', () => {
  it('has three slides, each with its own picture and tint', async () => {
    await renderApp({ route: '/welcome', language: 'en' });

    const fruit = screen.getByAltText('Fruit & vegetables');
    const household = screen.getByAltText('Household essentials');
    const clothing = screen.getByAltText('Clothing');
    expect(fruit).toHaveAttribute('src', '/images/welcome/welcome-fruit.webp');
    expect(household).toHaveAttribute('src', '/images/welcome/welcome-household.webp');
    expect(clothing).toHaveAttribute('src', '/images/welcome/welcome-clothing.webp');
    expect(fruit.parentElement).toHaveStyle({ backgroundColor: '#edf1e0' });
    expect(household.parentElement).toHaveStyle({ backgroundColor: '#e4f1e5' });
    expect(clothing.parentElement).toHaveStyle({ backgroundColor: '#e7f1f5' });
  });

  it('sets the picture size up front so nothing shifts while it loads', async () => {
    await renderApp({ route: '/welcome', language: 'en' });

    expect(screen.getByAltText('Fruit & vegetables')).toHaveAttribute('width', '608');
    expect(screen.getByAltText('Fruit & vegetables')).toHaveAttribute('height', '616');
  });

  it('names the current category under the card and cross-fades the others out', async () => {
    const user = userEvent.setup();
    await renderApp({ route: '/welcome', language: 'en' });
    const label = (text: string) => screen.getAllByText(text).find((e) => e.tagName === 'SPAN');

    expect(label('Fruit & vegetables')).toHaveAttribute('data-active', 'true');
    expect(label('Clothing')).toHaveAttribute('data-active', 'false');

    await user.click(dash(3));

    expect(label('Clothing')).toHaveAttribute('data-active', 'true');
    expect(label('Fruit & vegetables')).toHaveAttribute('data-active', 'false');
  });

  it('shows the Arabic category names', async () => {
    await renderApp({ route: '/welcome', language: 'ar' });

    for (const name of ['خضار وفواكه', 'منظفات', 'ملابس']) {
      expect(screen.getAllByText(name).length).toBeGreaterThan(0);
    }
  });
});

describe('Welcome slideshow', () => {
  it('has three progress dashes that are real buttons', async () => {
    await renderApp({ route: '/welcome' });

    expect(screen.getAllByRole('button', { name: /^Slide \d of 3$/ })).toHaveLength(3);
    expect(screen.getByRole('group', { name: 'Shop by category' })).toBeInTheDocument();
  });

  it('advances every four seconds and loops back to the first slide without playback controls', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await renderApp({ route: '/welcome' });
    expect(currentSlide()).toBe(0);
    advance(3000);
    expect(currentSlide()).toBe(0);
    advance(1000);
    expect(currentSlide()).toBe(1);
    advance(4000);
    expect(currentSlide()).toBe(2);
    advance(4000);
    expect(currentSlide()).toBe(0);
    expect(screen.queryByRole('button', { name: /slideshow/ })).not.toBeInTheDocument();
  });

  it('restarts the interval when the customer chooses a slide', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await renderApp({ route: '/welcome' });
    advance(3000);
    fireEvent.click(dash(3));
    advance(3000);
    expect(currentSlide()).toBe(2);
    advance(1000);
    expect(currentSlide()).toBe(0);
  });

  it.each(['en', 'ar'] as const)(
    'follows a swipe in the reading direction (%s)',
    async (language) => {
      await renderApp({ route: '/welcome', language });
      const card = screen.getByRole('group', {
        name: language === 'ar' ? 'تسوّق حسب الفئة' : 'Shop by category',
      });

      fireEvent.pointerDown(card, { clientX: 200, clientY: 100 });
      fireEvent.pointerUp(window, { clientX: language === 'ar' ? 300 : 100, clientY: 100 });

      expect(
        screen.getByRole('button', { name: language === 'ar' ? 'الشريحة 2 من 3' : 'Slide 2 of 3' }),
      ).toHaveAttribute('aria-current', 'true');
    },
  );

  it('does not move or offer a pause button when the user prefers reduced motion', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    setReducedMotion(true);
    await renderApp({ route: '/welcome' });

    advance(60_000);

    expect(currentSlide()).toBe(0);
    expect(screen.queryByRole('button', { name: /slideshow/ })).not.toBeInTheDocument();
  });
});
