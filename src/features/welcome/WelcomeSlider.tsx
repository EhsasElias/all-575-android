import { useTranslation } from 'react-i18next';
import { CarouselArrow, CarouselSlide, CarouselViewport, Icon, useCarousel } from '@/shared/ui';
import { SLIDE_IMAGE_SIZE, WELCOME_SLIDES } from './welcomeSlides';
import styles from './WelcomeSlider.module.css';

/** The picture card with its corner badge and the two arrows on its edges. */
export function WelcomeSlider() {
  const { t } = useTranslation('welcome');

  return (
    <div className={styles.stage}>
      <CarouselViewport label={t('carouselLabel')} className={styles.card}>
        {WELCOME_SLIDES.map((slide, index) => (
          <CarouselSlide key={slide.id} index={index} className={styles.slide}>
            {/* Left-to-right inside, so the badge hugs the physical top-left corner in Arabic too. */}
            <div dir="ltr" className={styles.layer} style={{ backgroundColor: slide.tint }}>
              <img
                className={styles.image}
                src={slide.image}
                alt={t(`slides.${slide.id}`)}
                width={SLIDE_IMAGE_SIZE.width}
                height={SLIDE_IMAGE_SIZE.height}
                draggable={false}
              />
              <span className={styles.badge} style={{ backgroundColor: slide.badge }}>
                <Icon name="sparkle" size={22} />
              </span>
            </div>
          </CarouselSlide>
        ))}
      </CarouselViewport>
      <div dir="ltr" className={styles.arrows}>
        <CarouselArrow side="left" className={styles.arrowLeft} />
        <CarouselArrow side="right" className={styles.arrowRight} />
      </div>
    </div>
  );
}

/** The category name under the card, cross-fading with the slide. */
export function WelcomeCaption() {
  const { t } = useTranslation('welcome');
  const { active } = useCarousel();

  // The picture's own description already names the category for assistive technology.
  return (
    <p className={styles.caption} aria-hidden="true">
      {WELCOME_SLIDES.map((slide, index) => (
        <span key={slide.id} className={styles.captionItem} data-active={index === active}>
          {t(`slides.${slide.id}`)}
        </span>
      ))}
    </p>
  );
}
