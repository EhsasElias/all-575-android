import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ErrorState, Skeleton } from '@/shared/ui';
import { BillingForm } from './BillingForm';
import { billingKey, getBilling } from './customerApi';
import { Page } from './components/Page';
import { PageHeader } from './components/PageHeader';
export function BillingScreen() {
  const { t } = useTranslation('customer');
  const profile = useQuery({ queryKey: billingKey, queryFn: ({ signal }) => getBilling(signal) });
  return (
    <Page>
      <PageHeader title={t('billing')} />
      {profile.isPending ? (
        <Skeleton height="12rem" />
      ) : profile.isError ? (
        <ErrorState onRetry={() => void profile.refetch()} />
      ) : (
        <BillingForm initial={profile.data} />
      )}
    </Page>
  );
}
