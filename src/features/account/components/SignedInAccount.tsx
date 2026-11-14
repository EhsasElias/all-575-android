import { useTranslation } from 'react-i18next';
import type { SessionUser } from '@/shared/session';
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

type SignedInAccountProps = {
  user: SessionUser;
};

/** Navigation lives in AccountSidebar; this screen contains only account settings and information. */
export function SignedInAccount({ user }: SignedInAccountProps) {
  const { t } = useTranslation('account');

  return (
    <Page>
      <PageHeader title={t('title')} />
      <ProfileSummary user={user} />
      {user.consents.needs_update && <ConsentNotice />}
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
