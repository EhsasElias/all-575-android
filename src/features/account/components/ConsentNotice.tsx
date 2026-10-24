import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { routePaths } from '@/shared/lib';
import { Icon } from '@/shared/ui';
import styles from './ConsentNotice.module.css';

/**
 * Shown when the Terms or Privacy Policy changed since the customer accepted them. The API only records the
 * new acceptance at the next sign-in, so this explains that and lets them read the texts now.
 */
export function ConsentNotice() {
  const { t } = useTranslation('account');
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} className={styles.notice}>
      <Icon name="info" size={24} />
      <div className={styles.text}>
        <h2 id={titleId} className={styles.title}>
          {t('consentNotice.title')}
        </h2>
        <p>{t('consentNotice.message')}</p>
        <p className={styles.links}>
          <Link to={routePaths.terms}>{t('legal.terms.title')}</Link>
          <Link to={routePaths.privacy}>{t('legal.privacy.title')}</Link>
        </p>
      </div>
    </section>
  );
}
