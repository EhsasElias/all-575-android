import { createContext, useContext, type FocusEvent, type PointerEvent } from 'react';

export type CarouselState = {
  count: number;
  /** Index of the slide on screen. */
  active: number;
  goTo: (index: number) => void;
  next: () => void;
  previous: () => void;
  /** Auto-advance exists: an interval was given, there are several slides, motion is allowed. */
  canAutoAdvance: boolean;
  /** Auto-advance is ticking right now. */
  running: boolean;
  userPaused: boolean;
  toggleUserPaused: () => void;
  holdHandlers: {
    onPointerDown: () => void;
    onFocus: (event: FocusEvent<HTMLElement>) => void;
    onBlur: (event: FocusEvent<HTMLElement>) => void;
  };
  startSwipe: (event: PointerEvent<HTMLElement>) => void;
};

export const CarouselContext = createContext<CarouselState | null>(null);

/** Reads the carousel the component is rendered in, for example to show the current slide's name. */
export function useCarousel(): CarouselState {
  const state = useContext(CarouselContext);
  if (!state) throw new Error('useCarousel must be used inside <Carousel>');
  return state;
}
