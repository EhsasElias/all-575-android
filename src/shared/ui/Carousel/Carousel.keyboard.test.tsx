import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { INTERVAL, currentSlide, renderCarousel, tick } from './carouselTestUtils';

// Kept apart from the other tests, and in this order: once user-event has typed, jsdom no longer
// reports :focus-visible for later focus changes, so the focus test has to run first.
describe('Carousel keyboard use', () => {
  it('pauses auto-advance while a control has keyboard focus, and resumes after', async () => {
    // user-event waits on real time between steps, so the fake clock must keep moving.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: (ms) => vi.advanceTimersByTime(ms) });
    renderCarousel(INTERVAL);

    await user.tab();
    expect(screen.getByRole('button', { name: 'Previous slide' })).toHaveFocus();
    tick(20_000);
    expect(currentSlide()).toBe(0);

    await user.tab({ shift: true });
    tick(INTERVAL);
    expect(currentSlide()).toBe(1);
  });

  it('reaches the arrows, the dashes and the pause button in order', async () => {
    const user = userEvent.setup();
    renderCarousel();

    await user.tab();
    expect(screen.getByRole('button', { name: 'Previous slide' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Next slide' })).toHaveFocus();
    await user.tab();
    await user.keyboard('{Enter}');
    expect(currentSlide()).toBe(0);
    await user.tab();
    await user.keyboard(' ');

    expect(currentSlide()).toBe(1);
  });
});
