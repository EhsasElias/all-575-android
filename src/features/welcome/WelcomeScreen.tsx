import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { routePaths } from '@/shared/lib';
import { Button, Carousel, CarouselDashes } from '@/shared/ui';
import { useStartShopping } from './useStartShopping';
import { markWelcomeSeen } from './welcomeSeen';
import { WELCOME_SLIDES } from './welcomeSlides';
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

      <Carousel count={WELCOME_SLIDES.length} autoAdvanceMs={4000} className={styles.slideshow}>
        <WelcomeSlider />
        <WelcomeCaption />
        <CarouselDashes className={styles.dashes} />

        <h1 className={styles.headline}>
          <span className={styles.headlineLead}>{t('headlineLead')}</span>{' '}
          <span className={styles.headlineAccent}>{t('headlineAccent')}</span>
        </h1>
        <p className={styles.subline}>{t('subline')}</p>

        <div className={styles.actions}>
          <Button size="lg" fullWidth className={styles.cta} onClick={startShopping}>
            {t('cta')}
          </Button>
          <p className={styles.signIn}>
            {t('signInPrompt')}{' '}
            <Link to={routePaths.signIn} className={styles.signInLink} onClick={markWelcomeSeen}>
              {t('signInLink')}
            </Link>
          </p>
        </div>
      </Carousel>
    </main>
  );
}
