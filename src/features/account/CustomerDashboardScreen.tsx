import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { OrderCard } from '@/features/orders';
import { useLanguage } from '@/shared/i18n';
import { routePaths } from '@/shared/lib';
import { useSession } from '@/shared/session';
import { Button, ButtonLink, EmptyState, ErrorState, Skeleton } from '@/shared/ui';
import { Page } from './components/Page';
import { PageHeader } from './components/PageHeader';
import { DashboardSummary } from './DashboardSummary';
import { DashboardOrderFilters } from './DashboardOrderFilters';
import { DashboardJourney } from './DashboardJourney';
import { formatDateTime } from './formatDateTime';
import { useCustomerDashboard } from './useCustomerDashboard';
import styles from './CustomerDashboard.module.css';

export function CustomerDashboardScreen() {
  const { t } = useTranslation('account');
  const { language } = useLanguage();
  const { user } = useSession();
  const query = useCustomerDashboard();
  return (
    <Page>
      <PageHeader
        title={t('dashboard.title')}
        lead={
          user?.name ? t('dashboard.welcome', { name: user.name }) : t('dashboard.welcomeGuest')
        }
      />
      <div className={styles.actions}>
        <ButtonLink to={routePaths.categories}>{t('dashboard.shop')}</ButtonLink>
        <ButtonLink to={routePaths.cart} variant="secondary">
          {t('dashboard.cart')}
        </ButtonLink>
      </div>
      {query.isPending && (
        <div role="status" aria-busy="true" aria-label={t('loading')}>
          <Skeleton height="15rem" />
        </div>
      )}
      {query.isError && (
        <ErrorState title={t('dashboard.error')} onRetry={() => void query.refetch()} />
      )}
      {query.data && !query.isError && (
        <>
          <DashboardSummary data={query.data} />
          <DashboardOrderFilters />
          <section className={styles.section} aria-labelledby="dashboard-recent">
            <div className={styles.sectionHeader}>
              <h2 id="dashboard-recent">{t('dashboard.recent')}</h2>
              <Link to={routePaths.orders}>{t('dashboard.viewAll')}</Link>
            </div>
            {query.data.recent_orders.length === 0 ? (
              <EmptyState
                icon="package"
                headingLevel={3}
                title={t('dashboard.emptyTitle')}
                message={t('dashboard.emptyHint')}
                action={<ButtonLink to={routePaths.categories}>{t('dashboard.shop')}</ButtonLink>}
              />
            ) : (
              <ul className={styles.orders}>
                {query.data.recent_orders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </ul>
            )}
          </section>
          <DashboardJourney data={query.data} />
          <div className={styles.sectionHeader}>
            <p className={styles.muted}>
              {t('dashboard.sync', { time: formatDateTime(query.data.generated_at, language) })}
            </p>
            <Button variant="ghost" loading={query.isFetching} onClick={() => void query.refetch()}>
              {t('dashboard.refresh')}
            </Button>
          </div>
        </>
      )}
    </Page>
  );
}
