import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { routePaths, usePrefersReducedMotion } from '@/shared/lib';
import { Logo, VisuallyHidden } from '@/shared/ui';
import styles from './LogoIntroScreen.module.css';

const INTRO_DURATION_MS = 900;

/** A short brand transition, not a simulated payment or network progress indicator. */
export function LogoIntroScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const timer = window.setTimeout(
      () => {
        void navigate(routePaths.home, { replace: true });
      },
      reducedMotion ? 0 : INTRO_DURATION_MS,
    );
    return () => {
      window.clearTimeout(timer);
    };
  }, [navigate, reducedMotion]);

  return (
    <main id="main-content" tabIndex={-1} className={styles.screen}>
      <div className={styles.mark}>
        <Logo decorative size={176} />
      </div>
      <div role="status" className={styles.loading}>
        <VisuallyHidden>{t('states.loading')}</VisuallyHidden>
        <span aria-hidden="true" className={styles.dot} />
        <span aria-hidden="true" className={styles.dot} />
        <span aria-hidden="true" className={styles.dot} />
      </div>
    </main>
  );
}
