import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router';
import { Logo, VisuallyHidden } from '@/shared/ui';
import { routePaths } from '@/shared/lib';
import styles from './LogoIntroScreen.module.css';
import { welcomePath } from './introPaths';

const INTRO_DURATION_MS = 2500;
const ACCOUNT_INTRO_DURATION_MS = 1200;

/** A short brand transition, not a simulated payment or network progress indicator. */
export function LogoIntroScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  // A guest who taps Account sees the same branded animation, then the login
  // form directly. Normal app launches still continue to the welcome slider.
  const accountEntry = params.get('mode') === 'account';
  const destination = accountEntry
    ? `${routePaths.signIn}?next=${encodeURIComponent(routePaths.account)}`
    : welcomePath(params.get('next'));

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void navigate(destination, { replace: true });
    }, accountEntry ? ACCOUNT_INTRO_DURATION_MS : INTRO_DURATION_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [navigate, destination, accountEntry]);

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
