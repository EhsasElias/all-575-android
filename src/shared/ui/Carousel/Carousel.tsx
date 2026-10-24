import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/shared/i18n';
import { cx } from '@/shared/lib';
import { Icon } from '../Icon/Icon';
import { CarouselContext, useCarousel } from './carouselContext';
import styles from './Carousel.module.css';
import { useCarouselState } from './useCarouselState';

type CarouselProps = {
  count: number;
  /** Time each slide stays on screen. Leave out for a carousel that never moves on its own. */
  autoAdvanceMs?: number | undefined;
  className?: string | undefined;
  children: ReactNode;
};

/**
 * Holds the state of a slideshow. The parts (viewport, arrows, dashes, pause button) can sit
 * anywhere inside it; pressing or focusing any of them pauses the automatic advance.
 */
export function Carousel({ count, autoAdvanceMs, className, children }: CarouselProps) {
  const state = useCarouselState({ count, autoAdvanceMs });

  return (
    <CarouselContext value={state}>
      <div className={className} {...state.holdHandlers}>
        {children}
      </div>
    </CarouselContext>
  );
}

type CarouselViewportProps = {
  /** Names the carousel for assistive technology. */
  label: string;
  className?: string | undefined;
  children: ReactNode;
};

/** The frame that shows one slide at a time and turns horizontal swipes into slide changes. */
export function CarouselViewport({ label, className, children }: CarouselViewportProps) {
  const { running, startSwipe } = useCarousel();

  // Slides never announce themselves while moving on their own; they do once paused.
  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
      aria-live={running ? 'off' : 'polite'}
      className={cx(styles.viewport, className)}
      onPointerDown={startSwipe}
    >
      {children}
    </div>
  );
}

type CarouselSlideProps = {
  index: number;
  className?: string | undefined;
  children: ReactNode;
};

/** One slide. Slides are stacked and cross-fade; only the current one is exposed to assistive tech. */
export function CarouselSlide({ index, className, children }: CarouselSlideProps) {
  const { t } = useTranslation();
  const { active, count } = useCarousel();
  const isActive = index === active;

  return (
    <div
      role="group"
      aria-roledescription="slide"
      aria-label={t('carousel.slide', { current: index + 1, total: count })}
      aria-hidden={!isActive}
      inert={!isActive}
      data-active={isActive}
      className={cx(styles.slide, className)}
    >
      {children}
    </div>
  );
}

type CarouselArrowProps = {
  /** Where the arrow sits on screen. Which way it moves depends on the reading direction. */
  side: 'left' | 'right';
  className?: string | undefined;
};

export function CarouselArrow({ side, className }: CarouselArrowProps) {
  const { t } = useTranslation();
  const { direction } = useLanguage();
  const { next, previous } = useCarousel();
  // The glyphs stay where they are (‹ on the left, › on the right); the end side is "next".
  const movesForward = (side === 'right') === (direction === 'ltr');

  return (
    <button
      type="button"
      className={cx(styles.arrow, className)}
      aria-label={movesForward ? t('carousel.next') : t('carousel.previous')}
      onClick={movesForward ? next : previous}
    >
      <span className={styles.arrowFace}>
        <Icon name={side === 'left' ? 'chevron-left' : 'chevron-right'} size={18} />
      </span>
    </button>
  );
}

/** Progress dashes: one real button per slide. */
export function CarouselDashes({ className }: { className?: string | undefined }) {
  const { t } = useTranslation();
  const { count, active, goTo } = useCarousel();

  return (
    <div role="group" aria-label={t('carousel.slides')} className={cx(styles.dashes, className)}>
      {Array.from({ length: count }, (_, index) => (
        <button
          key={index}
          type="button"
          className={styles.dash}
          aria-label={t('carousel.slide', { current: index + 1, total: count })}
          aria-current={index === active ? 'true' : undefined}
          onClick={() => {
            goTo(index);
          }}
        >
          <span className={styles.dashMark} />
        </button>
      ))}
    </div>
  );
}

export function CarouselPauseButton({ className }: { className?: string | undefined }) {
  const { t } = useTranslation();
  const { canAutoAdvance, userPaused, toggleUserPaused } = useCarousel();
  if (!canAutoAdvance) return null;

  return (
    <button
      type="button"
      className={cx(styles.pause, className)}
      aria-label={userPaused ? t('carousel.play') : t('carousel.pause')}
      onClick={toggleUserPaused}
    >
      <span className={styles.pauseFace}>
        <Icon name={userPaused ? 'play' : 'pause'} size={16} />
      </span>
    </button>
  );
}
