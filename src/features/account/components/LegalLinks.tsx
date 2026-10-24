import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { routePaths } from '@/shared/lib';
import { Section } from './Section';
import styles from './LegalLinks.module.css';

export function LegalLinks() {
  const { t } = useTranslation('account');

  return (
    <Section title={t('legalLinks.title')}>
      <ul className={styles.list}>
        <li>
          <Link to={routePaths.terms} className={styles.link}>
            {t('legal.terms.title')}
          </Link>
        </li>
        <li>
          <Link to={routePaths.privacy} className={styles.link}>
            {t('legal.privacy.title')}
          </Link>
        </li>
      </ul>
    </Section>
  );
}
