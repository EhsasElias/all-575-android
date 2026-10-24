import { useTranslation } from 'react-i18next';
import type { SessionUser } from '@/shared/session';
import { AccountMenu } from './AccountMenu';
import { ConsentNotice } from './ConsentNotice';
import { LanguagePreference } from './LanguagePreference';
import { LegalLinks } from './LegalLinks';
import { MarketingPreference } from './MarketingPreference';
import { Page } from './Page';
import { PageHeader } from './PageHeader';
import { ProfileSummary } from './ProfileSummary';
import { Section } from './Section';
import { SignOutSection } from './SignOutSection';

type SignedInAccountProps = {
  user: SessionUser;
};

export function SignedInAccount({ user }: SignedInAccountProps) {
  const { t } = useTranslation('account');

  return (
    <Page>
      <PageHeader title={t('title')} />
      <ProfileSummary user={user} />
      {user.consents.needs_update && <ConsentNotice />}
      <AccountMenu />
      <Section title={t('preferences.title')}>
        <LanguagePreference />
        <MarketingPreference user={user} />
      </Section>
      <LegalLinks />
      <SignOutSection />
    </Page>
  );
}
