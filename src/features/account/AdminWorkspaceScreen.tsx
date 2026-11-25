import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router';
import { isApiError } from '@/shared/api';
import { superAdminDashboard } from './superAdminApi';
import { adminDashboard } from './platformAdminApi';
import { SuperAdminDashboardScreen } from './SuperAdminDashboardScreen';
import { PlatformAdminDashboardScreen } from './PlatformAdminDashboardScreen';
import { routePaths } from '@/shared/lib';

/**
 * A single Admin workspace entry. Capabilities are detected from protected
 * endpoints, never granted by the UI or inferred from a role label.
 */
export function AdminWorkspaceScreen() {
  const { i18n } = useTranslation();
  const [params] = useSearchParams();
  const [access, setAccess] = useState<{ super: boolean; operations: boolean } | null>(null);
  const [failed, setFailed] = useState(false);
  const tr = (ar: string, en: string, fr: string) =>
    i18n.language.startsWith('ar') ? ar : i18n.language.startsWith('fr') ? fr : en;

  useEffect(() => {
    let active = true;
    void Promise.allSettled([superAdminDashboard(), adminDashboard()]).then(
      ([superResult, adminResult]) => {
        if (!active) return;
        const superAllowed = superResult.status === 'fulfilled';
        const adminAllowed = adminResult.status === 'fulfilled';
        setAccess({ super: superAllowed, operations: adminAllowed });
        setFailed(
          [superResult, adminResult].some(
            (result) =>
              result.status === 'rejected' &&
              (!isApiError(result.reason) ||
                result.reason.status == null ||
                ![401, 403].includes(result.reason.status)),
          ),
        );
      },
    );
    return () => {
      active = false;
    };
  }, []);

  if (access === null)
    return (
      <p role="status">
        {tr(
          'جار تحميل لوحة الإدارة…',
          'Loading Admin workspace…',
          'Chargement de l’administration…',
        )}
      </p>
    );
  if (!access.super && !access.operations) {
    return (
      <p role="alert">
        {failed
          ? tr(
              'تعذر التحقق من صلاحيات الإدارة. أعد المحاولة.',
              'Unable to verify Admin access. Please retry.',
              'Impossible de vérifier l’accès administrateur.',
            )
          : tr(
              'ليس لديك صلاحية الدخول إلى الإدارة.',
              'You do not have Admin access.',
              'Vous n’avez pas accès à l’administration.',
            )}
      </p>
    );
  }

  const requested = params.get('view');
  const view =
    requested === 'operations' && access.operations
      ? 'operations'
      : requested === 'management' && access.super
        ? 'management'
        : access.super
          ? 'management'
          : 'operations';

  return (
    <div>
      {access.super && access.operations && (
        <nav
          aria-label={tr('أقسام الإدارة', 'Admin sections', 'Sections administration')}
          style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}
        >
          <Link
            to={routePaths.platformAdminDashboard + '?view=management'}
            aria-current={view === 'management' ? 'page' : undefined}
          >
            {tr('الإدارة العامة والموافقات', 'Management & approvals', 'Gestion et approbations')}
          </Link>
          <Link
            to={routePaths.platformAdminDashboard + '?view=operations'}
            aria-current={view === 'operations' ? 'page' : undefined}
          >
            {tr('العمليات والطلبات', 'Operations & orders', 'Opérations et commandes')}
          </Link>
        </nav>
      )}
      {view === 'management' ? <SuperAdminDashboardScreen /> : <PlatformAdminDashboardScreen />}
    </div>
  );
}
