import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useSession } from '@/shared/session';
import { superAdminDashboard } from '@/features/account/superAdminApi';
import { adminDashboard } from '@/features/account/platformAdminApi';
import { useTranslation } from 'react-i18next';
import { routePaths } from '@/shared/lib';
import styles from './AccountSidebar.module.css';
import { seller, review, superAdmin, admin, courier, customer } from './dashboardSectionLinks';

export function DashboardSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { i18n } = useTranslation();
  const ar = i18n.language.startsWith('ar');
  const fr = i18n.language.startsWith('fr');
  const tr = (a: string, en: string, french: string) => (ar ? a : fr ? french : en);
  const { pathname, search, hash } = useLocation();
  const notificationContext =
    pathname === routePaths.notifications ? new URLSearchParams(search).get('workspace') : null;
  const { status, user } = useSession();
  const [superAccess, setSuperAccess] = useState<{ userId: string; allowed: boolean } | null>(null);
  const [operationsAccess, setOperationsAccess] = useState<{ userId: string; allowed: boolean } | null>(null);
  const userId = user?.id === undefined ? null : String(user.id);

  // A Super Admin keeps their dashboard navigation when visiting the separate
  // reviewer route. Dedicated reviewers retain their own Approvals navigation.
  useEffect(() => {
    if (![routePaths.sellerReview, routePaths.superAdminDashboard, routePaths.platformAdminDashboard].includes(pathname)
      || status !== 'signed-in' || !userId) return;
    let active = true;
    void Promise.allSettled([superAdminDashboard(), adminDashboard()]).then(([superResult, operationsResult]) => {
      if (!active) return;
      setSuperAccess({ userId, allowed: superResult.status === 'fulfilled' });
      setOperationsAccess({ userId, allowed: operationsResult.status === 'fulfilled' });
    });
    return () => {
      active = false;
    };
  }, [pathname, status, userId]);
  const isSuperReviewer =
    pathname === routePaths.sellerReview &&
    status === 'signed-in' &&
    userId !== null &&
    superAccess?.userId === userId &&
    superAccess.allowed;

  const workspace =
    pathname === routePaths.superAdminDashboard ||
    isSuperReviewer ||
    notificationContext === 'super'
      ? 'super'
      : pathname === routePaths.platformAdminDashboard || notificationContext === 'admin'
        ? 'admin'
        : pathname === routePaths.sellerReview || notificationContext === 'review'
          ? 'review'
          : pathname === routePaths.sellerWorkspace || notificationContext === 'seller'
            ? 'seller'
            : pathname === routePaths.courierWorkspace || notificationContext === 'courier'
              ? 'courier'
              : 'customer';

  const canManage = status === 'signed-in' && userId !== null &&
    superAccess?.userId === userId && superAccess.allowed;
  const canOperate = status === 'signed-in' && userId !== null &&
    operationsAccess?.userId === userId && operationsAccess.allowed;
  const managementLinks = superAdmin.map((item) => ({
    ...item,
    to: item.to.startsWith(routePaths.superAdminDashboard)
      ? item.to.replace(routePaths.superAdminDashboard, routePaths.platformAdminDashboard + '?view=management')
      : item.to,
  }));
  const operationsLinks = admin.map((item) => ({
    ...item,
    to: item.to.replace(routePaths.platformAdminDashboard, routePaths.platformAdminDashboard + '?view=operations'),
  }));
  const sections = workspace === 'super' || workspace === 'admin'
    ? [
        ...(canManage ? managementLinks : []),
        ...(canOperate ? operationsLinks : []),
      ]
    : workspace === 'review'
      ? review
      : workspace === 'seller'
        ? seller
        : workspace === 'courier'
          ? courier
          : customer;
  const title =
    workspace === 'super' || workspace === 'admin'
      ? tr('الإدارة', 'Admin', 'Administration')
      : workspace === 'review'
        ? tr('الموافقات', 'Approvals', 'Approbations')
        : workspace === 'seller'
          ? tr('البائع', 'Seller', 'Vendeur')
          : workspace === 'courier'
            ? tr('المندوب', 'Courier', 'Livreur')
            : tr('العميل', 'Customer', 'Client');

  const isActive = (to: string) => {
    const [pathAndQuery = '', targetHash] = to.split('#');
    const [path, query] = pathAndQuery.split('?');
    if (pathname !== path) return false;
    if (targetHash) return hash === '#' + targetHash;
    if (hash) return false;
    if (!query) return search === '';
    const [key = '', value = ''] = query.split('=');
    const current = new URLSearchParams(search).get(key);
    return (current ?? (key === 'tab' ? 'applications' : 'overview')) === value;
  };

  return (
    <nav
      className={styles.sidebar}
      aria-label={tr('قائمة لوحة التحكم', 'Dashboard navigation', 'Navigation du tableau de bord')}
      dir={ar ? 'rtl' : 'ltr'}
    >
      <div className={styles.brand}>
        <strong>{title}</strong>
        <span>{tr('لوحة تحكم ALL 5.75', 'ALL 5.75 workspace', 'Espace de travail ALL 5.75')}</span>
      </div>
      <div className={styles.group}>
        <h2>{tr('أقسام لوحة التحكم', 'Dashboard sections', 'Sections du tableau de bord')}</h2>
        <Link
          to={routePaths.notifications + '?workspace=' + workspace}
          onClick={onNavigate}
          aria-current={pathname === routePaths.notifications ? 'page' : undefined}
          className={pathname === routePaths.notifications ? styles.selected : styles.link}
        >
          {tr('الإشعارات', 'Notifications', 'Notifications')}
        </Link>
        {sections.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            aria-current={isActive(item.to) ? 'page' : undefined}
            className={isActive(item.to) ? styles.selected : styles.link}
          >
            {ar ? item.ar : fr ? item.fr : item.en}
          </Link>
        ))}
      </div>
      <div className={styles.group}>
        <h2>{tr('التنقل', 'Navigation', 'Navigation')}</h2>
        <Link to={routePaths.account} className={styles.link} onClick={onNavigate}>
          {tr('العودة إلى حسابي', 'Back to my account', 'Retour à mon compte')}
        </Link>
      </div>
    </nav>
  );
}
