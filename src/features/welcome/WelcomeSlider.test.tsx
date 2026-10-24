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

  it('puts a colored sparkle badge on the physical top-left corner, in both languages', async () => {
    await renderApp({ route: '/welcome', language: 'ar' });

    const layer = screen.getByAltText('خضار وفواكه').parentElement;
    const badge = screen.getByAltText('خضار وفواكه').nextElementSibling;
    expect(layer).toHaveAttribute('dir', 'ltr');
    expect(badge).toHaveStyle({ backgroundColor: '#da2842' });
    expect(badge?.querySelector('svg')).toBeInTheDocument();
    expect(screen.getByAltText('منظفات').nextElementSibling).toHaveStyle({
      backgroundColor: '#008d48',
    });
    expect(screen.getByAltText('ملابس').nextElementSibling).toHaveStyle({
      backgroundColor: '#02a8b7',
    });
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

describe('Welcome slider arrows', () => {
  it('in English the right arrow is next and the left arrow is previous', async () => {
    const user = userEvent.setup();
    await renderApp({ route: '/welcome', language: 'en' });
    const [left, right] = [
      screen.getByRole('button', { name: 'Previous slide' }),
      screen.getByRole('button', { name: 'Next slide' }),
    ];

    expect(left.compareDocumentPosition(right) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(left.querySelector('path')).toHaveAttribute('d', 'm14.5 6-6 6 6 6');
    expect(right.querySelector('path')).toHaveAttribute('d', 'm9.5 6 6 6-6 6');

    await user.click(right);
    expect(currentSlide()).toBe(1);
    await user.click(left);
    expect(currentSlide()).toBe(0);
  });

  it('in Arabic the left arrow is next and the right arrow is previous, with the same glyphs', async () => {
    const user = userEvent.setup();
    await renderApp({ route: '/welcome', language: 'ar' });
    const next = screen.getByRole('button', { name: 'الشريحة التالية' });
    const previous = screen.getByRole('button', { name: 'الشريحة السابقة' });

    expect(next.compareDocumentPosition(previous) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(next.querySelector('path')).toHaveAttribute('d', 'm14.5 6-6 6 6 6');
    expect(previous.querySelector('path')).toHaveAttribute('d', 'm9.5 6 6 6-6 6');

    await user.click(next);
    expect(screen.getByRole('button', { name: 'الشريحة 2 من 3' })).toHaveAttribute(
      'aria-current',
      'true',
    );
  });

  it('keeps the arrows in a left-to-right frame so they stay on the card edges', async () => {
    await renderApp({ route: '/welcome', language: 'ar' });

    expect(screen.getByRole('button', { name: 'الشريحة التالية' }).parentElement).toHaveAttribute(
      'dir',
      'ltr',
    );
  });
});

describe('Welcome slideshow', () => {
  it('has three progress dashes that are real buttons', async () => {
    await renderApp({ route: '/welcome' });

    expect(screen.getAllByRole('button', { name: /^Slide \d of 3$/ })).toHaveLength(3);
    expect(screen.getByRole('group', { name: 'Shop by category' })).toBeInTheDocument();
  });

  it('advances by itself, and the pause button stops it', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await renderApp({ route: '/welcome' });
    expect(currentSlide()).toBe(0);

    advance(4500);
    expect(currentSlide()).toBe(1);

    fireEvent.click(screen.getByRole('button', { name: 'Pause slideshow' }));
    advance(30_000);
    expect(currentSlide()).toBe(1);
    expect(screen.getByRole('button', { name: 'Play slideshow' })).toBeInTheDocument();
  });

  it('pauses while the card is pressed', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await renderApp({ route: '/welcome' });

    fireEvent.pointerDown(screen.getByRole('group', { name: 'Shop by category' }));
    advance(30_000);
    expect(currentSlide()).toBe(0);

    fireEvent.pointerUp(window);
    advance(4500);
    expect(currentSlide()).toBe(1);
  });

  it('follows a swipe in the reading direction', async () => {
    await renderApp({ route: '/welcome', language: 'en' });
    const card = screen.getByRole('group', { name: 'Shop by category' });

    fireEvent.pointerDown(card, { clientX: 250, clientY: 100 });
    fireEvent.pointerUp(window, { clientX: 100, clientY: 100 });

    expect(currentSlide()).toBe(1);
  });

  it('does not move or offer a pause button when the user prefers reduced motion', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    setReducedMotion(true);
    await renderApp({ route: '/welcome' });

    advance(60_000);

    expect(currentSlide()).toBe(0);
    expect(screen.queryByRole('button', { name: /slideshow/ })).not.toBeInTheDocument();
  });
});
