import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { routePaths } from '@/shared/lib';
import { Button, Carousel, CarouselDashes, CarouselPauseButton } from '@/shared/ui';
import { useStartShopping } from './useStartShopping';
import { markWelcomeSeen } from './welcomeSeen';
import { SLIDE_DURATION_MS, WELCOME_SLIDES } from './welcomeSlides';
import { PricePill } from './PricePill';
import { WelcomeCaption, WelcomeSlider } from './WelcomeSlider';
import { WelcomeHeader } from './WelcomeHeader';
import styles from './WelcomeScreen.module.css';

export function WelcomeScreen() {
  const { t } = useTranslation('welcome');
  const startShopping = useStartShopping();

  return (
    <main id="main-content" tabIndex={-1} className={styles.screen}>
      <WelcomeHeader onStartShopping={startShopping} />
      <PricePill />

      <Carousel
        count={WELCOME_SLIDES.length}
        autoAdvanceMs={SLIDE_DURATION_MS}
        className={styles.slideshow}
      >
        <WelcomeSlider />
        <WelcomeCaption />

        <h1 className={styles.headline}>
          <span className={styles.headlineLead}>{t('headlineLead')}</span>{' '}
          <span className={styles.headlineAccent}>{t('headlineAccent')}</span>
        </h1>
        <p className={styles.subline}>{t('subline')}</p>

        <Button size="lg" fullWidth className={styles.cta} onClick={startShopping}>
          {t('cta')}
        </Button>
        <p className={styles.signIn}>
          {t('signInPrompt')}{' '}
          <Link to={routePaths.signIn} className={styles.signInLink} onClick={markWelcomeSeen}>
            {t('signInLink')}
          </Link>
        </p>

        <div className={styles.controls}>
          <CarouselDashes className={styles.dashes} />
          <CarouselPauseButton className={styles.pause} />
        </div>
      </Carousel>
    </main>
  );
}
