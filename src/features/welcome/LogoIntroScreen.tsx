import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router';
import { Logo, VisuallyHidden } from '@/shared/ui';
import styles from './LogoIntroScreen.module.css';
import { afterIntroPath } from './introPaths';

const INTRO_DURATION_MS = 1200;

/** A short brand transition, not a simulated payment or network progress indicator. */
export function LogoIntroScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const destination = afterIntroPath(params.get('next'));

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void navigate(destination, { replace: true });
    }, INTRO_DURATION_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [navigate, destination]);

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
