import { act, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import {
  Carousel,
  CarouselArrow,
  CarouselDashes,
  CarouselPauseButton,
  CarouselSlide,
  CarouselViewport,
} from './Carousel';

const TITLES = ['First', 'Second', 'Third'];

export const INTERVAL = 3000;

export function renderCarousel(autoAdvanceMs?: number) {
  return render(
    <Carousel count={TITLES.length} autoAdvanceMs={autoAdvanceMs}>
      <CarouselViewport label="Categories">
        {TITLES.map((title, index) => (
          <CarouselSlide key={title} index={index}>
            {title}
          </CarouselSlide>
        ))}
      </CarouselViewport>
      <CarouselArrow side="left" />
      <CarouselArrow side="right" />
      <CarouselDashes />
      <CarouselPauseButton />
    </Carousel>,
  );
}

export function dash(slide: number) {
  return screen.getByRole('button', { name: `Slide ${slide} of 3` });
}

/** Index of the dash marked as current, or -1. */
export function currentSlide() {
  return screen
    .getAllByRole('button', { name: /^Slide \d of 3$/ })
    .findIndex((button) => button.getAttribute('aria-current') === 'true');
}

export function tick(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}
