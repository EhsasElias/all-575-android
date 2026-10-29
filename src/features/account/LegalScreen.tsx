import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { routePaths } from '@/shared/lib';
import { BackLink } from './components/BackLink';
import { LegalVersion } from './components/LegalVersion';
import { Page } from './components/Page';
import { PageHeader } from './components/PageHeader';
import styles from './LegalScreen.module.css';

const TERMS_TOPICS = [
  'operator',
  'using',
  'prices',
  'orders',
  'delivery',
  'returns',
  'conduct',
  'rights',
  'changes',
  'contact',
] as const;
const PRIVACY_TOPICS = [
  'controller',
  'collect',
  'use',
  'location',
  'biometry',
  'share',
  'transfers',
  'keep',
  'rights',
  'choices',
] as const;

type LegalScreenProps = {
  document: 'terms' | 'privacy';
};

/** Detailed policy drafts with readable sections and an honest launch-readiness notice. */
export function LegalScreen({ document }: LegalScreenProps) {
  const { t } = useTranslation('account');
  const isTerms = document === 'terms';
  const noticeId = useId();
  const outlineId = useId();
  const sections = isTerms
    ? TERMS_TOPICS.map((topic) => ({
        id: `terms-${topic}`,
        title: t(`legal.terms.sections.${topic}.title`),
        body: t(`legal.terms.sections.${topic}.body`),
      }))
    : PRIVACY_TOPICS.map((topic) => ({
        id: `privacy-${topic}`,
        title: t(`legal.privacy.sections.${topic}.title`),
        body: t(`legal.privacy.sections.${topic}.body`),
      }));

  return (
    <Page>
      <PageHeader
        title={t(isTerms ? 'legal.terms.title' : 'legal.privacy.title')}
        lead={t(isTerms ? 'legal.terms.lead' : 'legal.privacy.lead')}
        back={<BackLink to={routePaths.account} label={t('back')} preferHistory />}
      />
      <LegalVersion document={document} />
      <p>{t('legal.updated')}</p>
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
        <ol className={styles.topics}>
          {sections.map((section) => (
            <li key={section.id}>
              <a href={`#${section.id}`}>{section.title}</a>
            </li>
          ))}
        </ol>
      </section>
      {sections.map((section) => (
        <section key={section.id} aria-labelledby={section.id} className={styles.policySection}>
          <h2 id={section.id} className={styles.outlineTitle}>
            {section.title}
          </h2>
          <p>{section.body}</p>
        </section>
      ))}
    </Page>
  );
}
