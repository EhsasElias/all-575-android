import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { routePaths } from '@/shared/lib';
import { BackLink } from './components/BackLink';
import { LegalVersion } from './components/LegalVersion';
import { Page } from './components/Page';
import { PageHeader } from './components/PageHeader';
import styles from './LegalScreen.module.css';

const TERMS_TOPICS = ['using', 'orders', 'delivery', 'returns', 'changes'] as const;
const PRIVACY_TOPICS = ['collect', 'use', 'share', 'keep', 'rights'] as const;

type LegalScreenProps = {
  document: 'terms' | 'privacy';
};

/**
 * PLACEHOLDER legal page: the current version, a notice that the full text is pending legal review, and the
 * topics it will cover. It carries no legal terms of its own.
 */
export function LegalScreen({ document }: LegalScreenProps) {
  const { t } = useTranslation('account');
  const isTerms = document === 'terms';
  const noticeId = useId();
  const outlineId = useId();

  return (
    <Page>
      <PageHeader
        title={t(isTerms ? 'legal.terms.title' : 'legal.privacy.title')}
        lead={t(isTerms ? 'legal.terms.lead' : 'legal.privacy.lead')}
        back={<BackLink to={routePaths.account} label={t('back')} preferHistory />}
      />
      <LegalVersion document={document} />
      <section role="note" aria-labelledby={noticeId} className={styles.notice}>
        <h2 id={noticeId} className={styles.noticeTitle}>
          {t('legal.noticeTitle')}
        </h2>
        <p>{t('legal.noticeMessage')}</p>
      </section>
      <section aria-labelledby={outlineId} className={styles.outline}>
        <h2 id={outlineId} className={styles.outlineTitle}>
          {t('legal.outline')}
        </h2>
        <ul className={styles.topics}>
          {isTerms
            ? TERMS_TOPICS.map((topic) => <li key={topic}>{t(`legal.terms.topics.${topic}`)}</li>)
            : PRIVACY_TOPICS.map((topic) => (
                <li key={topic}>{t(`legal.privacy.topics.${topic}`)}</li>
              ))}
        </ul>
      </section>
    </Page>
  );
}
