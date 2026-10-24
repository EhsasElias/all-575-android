import { useTranslation } from 'react-i18next';
import { routePaths } from '@/shared/lib';
import { ButtonLink, EmptyState, ErrorState, Skeleton } from '@/shared/ui';
import { BackLink } from './components/BackLink';
import { ConfirmSheet } from './components/ConfirmSheet';
import { Page } from './components/Page';
import { PageHeader } from './components/PageHeader';
import { SessionCard } from './components/SessionCard';
import { useDeviceLabel } from './useDeviceLabel';
import { useRevokeSession, useSessionsQuery } from './useSessions';
import styles from './SessionsScreen.module.css';

function SessionsSkeleton() {
  const { t } = useTranslation('account');

  return (
    <div role="status" aria-busy="true" aria-label={t('sessions.loading')} className={styles.list}>
      <Skeleton height="6rem" />
      <Skeleton height="6rem" />
      <Skeleton height="6rem" />
    </div>
  );
}

/** The devices where the customer is signed in, with a way to sign out of the ones they do not recognize. */
export function SessionsScreen() {
  const { t } = useTranslation('account');
  const sessions = useSessionsQuery();
  const revoke = useRevokeSession();
  const deviceLabel = useDeviceLabel();

  return (
    <Page>
      <PageHeader
        title={t('sessions.title')}
        lead={t('sessions.lead')}
        back={<BackLink to={routePaths.account} label={t('backToAccount')} />}
      />
      {sessions.isPending && <SessionsSkeleton />}
      {sessions.isError && (
        <ErrorState
          title={t('sessions.errorTitle')}
          message={t('sessions.errorMessage')}
          headingLevel={2}
          onRetry={() => {
            void sessions.refetch();
          }}
        />
      )}
      {sessions.isSuccess && sessions.data.length === 0 && (
        <EmptyState
          icon="shield"
          title={t('sessions.emptyTitle')}
          message={t('sessions.emptyMessage')}
          action={<ButtonLink to={routePaths.account}>{t('sessions.emptyAction')}</ButtonLink>}
        />
      )}
      {sessions.isSuccess && sessions.data.length > 0 && (
        <ul aria-label={t('sessions.listLabel')} className={styles.list}>
          {sessions.data.map((session) => (
            <SessionCard key={session.id} session={session} onRevoke={revoke.ask} />
          ))}
        </ul>
      )}
      <ConfirmSheet
        open={revoke.target !== null}
        title={t('sessions.revokeTitle', { device: deviceLabel(revoke.target?.device_name ?? '') })}
        message={t('sessions.revokeMessage')}
        confirmLabel={t('sessions.revokeConfirm')}
        cancelLabel={t('sessions.revokeCancel')}
        pending={revoke.pending}
        errorMessage={revoke.failed ? t('sessions.revokeFailed') : undefined}
        onConfirm={revoke.confirm}
        onCancel={revoke.cancel}
      />
    </Page>
  );
}
