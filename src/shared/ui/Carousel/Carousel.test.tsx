import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18next from 'i18next';
import { describe, expect, it, vi } from 'vitest';
import { setReducedMotion } from '@/test/browserStubs';
import { INTERVAL, currentSlide, dash, renderCarousel, tick } from './carouselTestUtils';

function swipe(from: number, to: number, verticalShift = 0) {
  const viewport = screen.getByRole('group', { name: 'Categories' });
  fireEvent.pointerDown(viewport, { clientX: from, clientY: 100 });
  fireEvent.pointerUp(window, { clientX: to, clientY: 100 + verticalShift });
}

describe('Carousel structure', () => {
  it('is a named carousel with one group per slide', () => {
    renderCarousel();

    const viewport = screen.getByRole('group', { name: 'Categories' });
    expect(viewport).toHaveAttribute('aria-roledescription', 'carousel');
    const slides = screen
      .getAllByRole('group', { hidden: true })
      .filter((group) => group.getAttribute('aria-roledescription') === 'slide');
    expect(slides.map((slide) => slide.getAttribute('aria-label'))).toEqual([
      'Slide 1 of 3',
      'Slide 2 of 3',
      'Slide 3 of 3',
    ]);
  });

  it('exposes only the current slide to assistive technology', () => {
    renderCarousel();

    expect(screen.getByText('First')).toBeVisible();
    expect(screen.getByText('First').closest('[data-active]')).toHaveAttribute(
      'data-active',
      'true',
    );
    expect(screen.queryByText('Second', { exact: true })?.closest('[inert]')).not.toBeNull();
    expect(screen.queryByRole('group', { name: 'Slide 2 of 3' })).not.toBeInTheDocument();
  });

  it('shows one progress dash per slide, as real buttons', () => {
    renderCarousel();

    expect(screen.getAllByRole('button', { name: /^Slide \d of 3$/ })).toHaveLength(3);
    expect(dash(1)).toHaveAttribute('aria-current', 'true');
    expect(dash(2)).not.toHaveAttribute('aria-current');
  });
});

describe('Carousel navigation', () => {
  it('goes to a slide when its dash is pressed', async () => {
    renderCarousel();

    await userEvent.setup().click(dash(3));

    expect(currentSlide()).toBe(2);
    expect(screen.getByText('Third').closest('[data-active]')).toHaveAttribute(
      'data-active',
      'true',
    );
  });

  it('moves with the arrows in left-to-right layouts: right is next, left is previous', async () => {
    const user = userEvent.setup();
    renderCarousel();

    await user.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(currentSlide()).toBe(1);

    await user.click(screen.getByRole('button', { name: 'Previous slide' }));
    await user.click(screen.getByRole('button', { name: 'Previous slide' }));
    expect(currentSlide()).toBe(2);
  });

  it('keeps the arrows where they are but swaps their meaning in right-to-left layouts', async () => {
    await i18next.changeLanguage('ar');
    const user = userEvent.setup();
    renderCarousel();
    const [left, right] = screen.getAllByRole('button', { name: /^الشريحة (التالية|السابقة)$/ });

    expect(left).toHaveAccessibleName('الشريحة التالية');
    expect(right).toHaveAccessibleName('الشريحة السابقة');
    expect(left?.querySelector('path')).toHaveAttribute('d', 'm14.5 6-6 6 6 6');
    expect(right?.querySelector('path')).toHaveAttribute('d', 'm9.5 6 6 6-6 6');

    await user.click(left ?? document.body);
    expect(screen.getByRole('button', { name: 'الشريحة 2 من 3' })).toHaveAttribute(
      'aria-current',
      'true',
    );
  });
});

describe('Carousel swiping follows the reading direction', () => {
  it('goes to the next slide when swiping left, and back when swiping right (LTR)', () => {
    renderCarousel();

    swipe(200, 100);
    expect(currentSlide()).toBe(1);

    swipe(100, 200);
    expect(currentSlide()).toBe(0);
  });

  it('reverses in right-to-left layouts: swiping right is next', async () => {
    await i18next.changeLanguage('ar');
    renderCarousel();

    swipe(100, 200);
    expect(screen.getByRole('button', { name: 'الشريحة 2 من 3' })).toHaveAttribute(
      'aria-current',
      'true',
    );

    swipe(200, 100);
    expect(screen.getByRole('button', { name: 'الشريحة 1 من 3' })).toHaveAttribute(
      'aria-current',
      'true',
    );
  });

  it('ignores short drags and mostly vertical ones', () => {
    renderCarousel();

    swipe(200, 180);
    swipe(200, 100, 200);

    expect(currentSlide()).toBe(0);
  });

  it('ignores a cancelled gesture', () => {
    renderCarousel();
    const viewport = screen.getByRole('group', { name: 'Categories' });

    fireEvent.pointerDown(viewport, { clientX: 200, clientY: 100 });
    fireEvent.pointerCancel(window, { clientX: 100, clientY: 100 });

    expect(currentSlide()).toBe(0);
  });
});

describe('Carousel auto-advance', () => {
  it('moves to the next slide after the interval and wraps around', () => {
    vi.useFakeTimers();
    renderCarousel(INTERVAL);

    tick(INTERVAL - 1);
    expect(currentSlide()).toBe(0);
    tick(1);
    expect(currentSlide()).toBe(1);
    tick(INTERVAL);
    expect(currentSlide()).toBe(2);
    tick(INTERVAL);
    expect(currentSlide()).toBe(0);
  });

  it('can be paused and resumed with the pause button', () => {
    vi.useFakeTimers();
    renderCarousel(INTERVAL);

    fireEvent.click(screen.getByRole('button', { name: 'Pause slideshow' }));
    tick(20_000);
    expect(currentSlide()).toBe(0);

    fireEvent.click(screen.getByRole('button', { name: 'Play slideshow' }));
    tick(INTERVAL);
    expect(currentSlide()).toBe(1);
  });

  it('announces slide changes only while it is not moving by itself', () => {
    vi.useFakeTimers();
    renderCarousel(INTERVAL);
    const viewport = screen.getByRole('group', { name: 'Categories' });

    expect(viewport).toHaveAttribute('aria-live', 'off');
    fireEvent.click(screen.getByRole('button', { name: 'Pause slideshow' }));

    expect(viewport).toHaveAttribute('aria-live', 'polite');
  });

  it('pauses while a finger or pointer is pressed, and resumes on release', () => {
    vi.useFakeTimers();
    renderCarousel(INTERVAL);

    fireEvent.pointerDown(screen.getByRole('button', { name: 'Slide 2 of 3' }));
    tick(20_000);
    expect(currentSlide()).toBe(0);

    fireEvent.pointerUp(window);
    tick(INTERVAL);
    expect(currentSlide()).toBe(1);
  });

  it('restarts the interval after a manual change instead of cutting it short', () => {
    vi.useFakeTimers();
    renderCarousel(INTERVAL);

    tick(2000);
    fireEvent.click(dash(3));
    tick(1500);

    expect(currentSlide()).toBe(2);
  });

  it('never moves by itself without an interval, and offers nothing to pause', () => {
    vi.useFakeTimers();
    renderCarousel();

    tick(60_000);

    expect(currentSlide()).toBe(0);
    expect(screen.queryByRole('button', { name: /slideshow/ })).not.toBeInTheDocument();
  });
});

describe('Carousel with reduced motion', () => {
  it('does not auto-advance and offers nothing to pause', () => {
    vi.useFakeTimers();
    setReducedMotion(true);
    renderCarousel(INTERVAL);

    tick(60_000);

    expect(currentSlide()).toBe(0);
    expect(screen.queryByRole('button', { name: /slideshow/ })).not.toBeInTheDocument();
  });

  it('still lets people move by hand', () => {
    setReducedMotion(true);
    renderCarousel(INTERVAL);

    fireEvent.click(screen.getByRole('button', { name: 'Next slide' }));

    expect(currentSlide()).toBe(1);
  });

  it('stops auto-advance when the preference turns on while running', () => {
    vi.useFakeTimers();
    renderCarousel(INTERVAL);

    setReducedMotion(true);
    tick(60_000);

    expect(currentSlide()).toBe(0);
    expect(screen.queryByRole('button', { name: /slideshow/ })).not.toBeInTheDocument();
  });
});
