import { useEffect, useState } from 'react';
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
import { memberships } from '../sellerWorkspaceApi';
import { superAdminDashboard } from '../superAdminApi';
import styles from './SignedInAccount.module.css';

type SignedInAccountProps = {
  user: SessionUser;
};

export function SignedInAccount({ user }: SignedInAccountProps) {
  const { t } = useTranslation('account');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [sellerState, setSellerState] = useState<'loading' | 'seller' | 'customer' | 'unavailable'>('loading');

  useEffect(() => {
    let active = true;
    setSellerState('loading');
    void memberships()
      .then((result) => {
        if (!active) return;
        setSellerState(
          result.data.some((membership) =>
            membership.is_active && membership.seller_status === 'approved'
          ) ? 'seller' : 'customer',
        );
      })
      .catch(() => {
        if (active) setSellerState('unavailable');
      });
    return () => { active = false; };
  }, [user.id]);

  useEffect(() => {
    let active = true;
    setIsSuperAdmin(false);
    void superAdminDashboard().then(() => {
      if (active) setIsSuperAdmin(true);
    }).catch(() => {
      if (active) setIsSuperAdmin(false);
    });
    return () => { active = false; };
  }, [user.id]);

  return (
    <Page>
      <PageHeader title={t('title')} />
      <ProfileSummary user={user} />
      <ButtonLink to={routePaths.dashboard}>{t('dashboard.title')}</ButtonLink>
      {user.consents.needs_update && <ConsentNotice />}
      <AccountMenu />
      <div className={styles.sellerActions}>
        {sellerState === 'customer' && (
          <ButtonLink to={routePaths.sellerApplication}>{t('sellerApply')}</ButtonLink>
        )}
        {sellerState === 'seller' && (
          <ButtonLink to={routePaths.sellerWorkspace} variant="secondary">
            {t('sellerWorkspace')}
          </ButtonLink>
        )}
      </div>
      {isSuperAdmin && (
        <ButtonLink to={routePaths.superAdminDashboard} variant="secondary">
          {t('superAdminDashboard', { defaultValue: 'Super Admin Dashboard' })}
        </ButtonLink>
      )}
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
