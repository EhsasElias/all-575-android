import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router';
import { Logo } from '@/shared/ui';
import { useLanguage } from '@/shared/i18n';
import { routePaths } from '@/shared/lib';
import styles from './LogoIntroScreen.module.css';
import { welcomePath } from './introPaths';

/** The opening greeting stays visible until the customer taps the large logo. */
export function LogoIntroScreen() {
  const { t } = useTranslation('welcome');
  const { language } = useLanguage();
  const tagline = language === 'ar'
    ? 'كل ما تحتاجه، في مكان واحد'
    : language === 'fr'
      ? 'Tout ce dont vous avez besoin, au même endroit'
      : 'Everything you need, all in one place';
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const accountEntry = params.get('mode') === 'account';
  const destination = accountEntry
    ? `${routePaths.signIn}?next=${encodeURIComponent(routePaths.account)}`
    : welcomePath(params.get('next'));

  return (
    <main id="main-content" tabIndex={-1} className={styles.screen}>
      <h1 className={styles.greeting}>
        <span className={styles.lead}>{t('headlineLead')}</span>{' '}
        <span className={styles.accent}>{t('headlineAccent')}</span>
      </h1>
      <p className={styles.tagline}>{tagline}</p>
      <button
        type="button"
        className={styles.logoButton}
        onClick={() => void navigate(destination, { replace: true })}
        aria-label={t('cta')}
      >
        <Logo decorative size={260} />
      </button>
      <p className={styles.instruction}>{t('cta')}</p>
      <div className={styles.loading} aria-hidden="true">
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </div>
    </main>
  );
}
