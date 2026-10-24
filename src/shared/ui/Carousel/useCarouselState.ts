import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { useLanguage } from '@/shared/i18n';
import { usePrefersReducedMotion } from '@/shared/lib';
import type { CarouselState } from './carouselContext';

const SWIPE_DISTANCE_PX = 40;

type UseCarouselStateOptions = {
  count: number;
  autoAdvanceMs: number | undefined;
};

type Point = { x: number; y: number };

// Keyboard focus pauses the slideshow; a tap that merely leaves focus on a button must not.
function isKeyboardFocus(target: EventTarget): boolean {
  return target instanceof Element && target.matches(':focus-visible');
}

export function useCarouselState({ count, autoAdvanceMs }: UseCarouselStateOptions): CarouselState {
  const reducedMotion = usePrefersReducedMotion();
  const { direction } = useLanguage();
  const [active, setActive] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [focused, setFocused] = useState(false);
  const swipeStart = useRef<Point | null>(null);

  const next = useCallback(() => {
    setActive((current) => (current + 1) % count);
  }, [count]);

  const previous = useCallback(() => {
    setActive((current) => (current - 1 + count) % count);
  }, [count]);

  const canAutoAdvance = autoAdvanceMs !== undefined && count > 1 && !reducedMotion;
  const running = canAutoAdvance && !userPaused && !pressed && !focused;

  // The timer restarts on every slide change, so a manual change never cuts the next slide short.
  useEffect(() => {
    if (!running) return;
    const timer = setTimeout(next, autoAdvanceMs);
    return () => {
      clearTimeout(timer);
    };
  }, [running, active, next, autoAdvanceMs]);

  // The finger or pointer may lift anywhere, so the release is listened for on the window.
  useEffect(() => {
    if (!pressed) return;
    const release = (event: globalThis.PointerEvent) => {
      setPressed(false);
      const start = swipeStart.current;
      swipeStart.current = null;
      if (!start || event.type === 'pointercancel') return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      if (Math.abs(dx) < SWIPE_DISTANCE_PX || Math.abs(dx) < Math.abs(dy)) return;
      // Swiping follows the reading direction: the next slide arrives from the end side.
      const towardEnd = direction === 'ltr' ? dx < 0 : dx > 0;
      if (towardEnd) next();
      else previous();
    };
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    return () => {
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
    };
  }, [pressed, direction, next, previous]);

  return {
    count,
    active,
    goTo: setActive,
    next,
    previous,
    canAutoAdvance,
    running,
    userPaused,
    toggleUserPaused: () => {
      setUserPaused((current) => !current);
    },
    holdHandlers: {
      onPointerDown: () => {
        setPressed(true);
      },
      onFocus: (event) => {
        if (isKeyboardFocus(event.target)) setFocused(true);
      },
      onBlur: (event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      },
    },
    startSwipe: (event: PointerEvent<HTMLElement>) => {
      swipeStart.current = { x: event.clientX, y: event.clientY };
    },
  };
}
