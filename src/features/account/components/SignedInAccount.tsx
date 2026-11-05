import { useTranslation } from 'react-i18next';
import { routePaths } from '@/shared/lib';
import { ButtonLink } from '@/shared/ui';
import type { SessionUser } from '@/shared/session';
import { AccountMenu } from './AccountMenu';
import { CustomerNotifications } from './CustomerNotifications';
import { ConsentNotice } from './ConsentNotice';
import { LanguagePreference } from './LanguagePreference';
import { LegalLinks } from './LegalLinks';
import { MarketingPreference } from './MarketingPreference';
import { Page } from './Page';
import { PageHeader } from './PageHeader';
import { ProfileSummary } from './ProfileSummary';
import { Section } from './Section';
import { SignOutSection } from './SignOutSection';
import { AccountSecurity } from './AccountSecurity';
import { SellerReviewEntry } from './SellerReviewEntry';
import styles from './SignedInAccount.module.css';

type SignedInAccountProps = {
  user: SessionUser;
};

export function SignedInAccount({ user }: SignedInAccountProps) {
  const { t } = useTranslation('account');

  return (
    <Page>
      <PageHeader title={t('title')} />
      <ProfileSummary user={user} />
      <ButtonLink to={routePaths.dashboard}>{t('dashboard.title')}</ButtonLink>
      {user.consents.needs_update && <ConsentNotice />}
      <AccountMenu />
      <div className={styles.sellerActions}>
        <ButtonLink to={routePaths.sellerApplication}>{t('sellerApply')}</ButtonLink>
        <ButtonLink to={routePaths.sellerWorkspace} variant="secondary">
          {t('sellerWorkspace')}
        </ButtonLink>
      </div>
      <SellerReviewEntry />
      <CustomerNotifications />
      <Section title={t('preferences.title')}>
        <LanguagePreference />
        <MarketingPreference user={user} />
      </Section>
      <LegalLinks />
      <AccountSecurity />
      <SignOutSection />
    </Page>
  );
}
