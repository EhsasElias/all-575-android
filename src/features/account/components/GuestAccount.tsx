import { useTranslation } from 'react-i18next';
import { routePaths } from '@/shared/lib';
import { ButtonLink, Icon, type IconName } from '@/shared/ui';
import { LanguagePreference } from './LanguagePreference';
import { LegalLinks } from './LegalLinks';
import { Page } from './Page';
import { PageHeader } from './PageHeader';
import { Section } from './Section';
import styles from './GuestAccount.module.css';

type Benefit = {
  icon: IconName;
  text: 'guest.benefitOrders' | 'guest.benefitAddresses' | 'guest.benefitSpending';
};

const BENEFITS: readonly Benefit[] = [
  { icon: 'receipt', text: 'guest.benefitOrders' },
  { icon: 'map-pin', text: 'guest.benefitAddresses' },
  { icon: 'credit-card', text: 'guest.benefitSpending' },
];

// Back to the account screen after signing in, since that is where the customer started.
const SIGN_IN_FROM_ACCOUNT = `${routePaths.signIn}?next=${encodeURIComponent(routePaths.account)}`;

/** What a guest sees: why to sign in, the way in, the language and the legal texts. */
export function GuestAccount() {
  const { t } = useTranslation('account');

  return (
    <Page>
      <PageHeader title={t('guest.title')} lead={t('guest.lead')} />
      <Section title={t('guest.benefitsTitle')}>
        <ul className={styles.benefits}>
          {BENEFITS.map((benefit) => (
            <li key={benefit.text} className={styles.benefit}>
              <Icon name={benefit.icon} />
              {t(benefit.text)}
            </li>
          ))}
        </ul>
        <ButtonLink to={SIGN_IN_FROM_ACCOUNT} size="lg" fullWidth>
          {t('guest.signIn')}
        </ButtonLink>
      </Section>
      <Section title={t('preferences.title')}>
        <LanguagePreference />
      </Section>
      <LegalLinks />
    </Page>
  );
}
