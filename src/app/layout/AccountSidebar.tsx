import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { routePaths, routeTo } from '@/shared/lib';
import { useSession } from '@/shared/session';
import { memberships } from '@/features/account/sellerWorkspaceApi';
import { superAdminDashboard } from '@/features/account/superAdminApi';
import { adminDashboard } from '@/features/account/platformAdminApi';
import { reviewOverview } from '@/features/account/sellerReviewApi';
import { courierProfile } from '@/features/account/courierOperationsApi';
import styles from './AccountSidebar.module.css';

type AccountLink = { path: string; ar: string; en: string; fr: string };

const pages: AccountLink[] = [
  {
    path: routePaths.account,
    ar: 'نظرة عامة على الحساب',
    en: 'Account overview',
    fr: 'Vue d’ensemble du compte',
  },
  { path: routePaths.profile, ar: 'الملف الشخصي', en: 'Profile', fr: 'Profil' },
  { path: routePaths.notifications, ar: 'الإشعارات', en: 'Notifications', fr: 'Notifications' },
  { path: routePaths.addresses, ar: 'العناوين', en: 'Addresses', fr: 'Adresses' },
  { path: routePaths.billing, ar: 'بيانات الفوترة', en: 'Billing', fr: 'Facturation' },
  {
    path: routePaths.sessions,
    ar: 'الأجهزة والجلسات',
    en: 'Sessions',
    fr: 'Appareils et sessions',
  },
  {
    path: routePaths.savedProducts,
    ar: 'المنتجات المحفوظة',
    en: 'Saved products',
    fr: 'Produits enregistrés',
  },
  { path: routePaths.customerRequests, ar: 'طلباتي الخاصة', en: 'Requests', fr: 'Demandes' },
  { path: routePaths.customerCases, ar: 'الدعم', en: 'Support', fr: 'Assistance' },
  { path: routePaths.orders, ar: 'طلباتي', en: 'My orders', fr: 'Mes commandes' },
  { path: routePaths.spending, ar: 'المصروفات', en: 'Spending', fr: 'Dépenses' },
];

export function AccountSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { i18n } = useTranslation();
  const ar = i18n.language.startsWith('ar');
  const fr = i18n.language.startsWith('fr');
  const tr = (a: string, en: string, french: string) => (ar ? a : fr ? french : en);
  const { pathname } = useLocation();
  const { status, user } = useSession();
  // Keep workspace discovery tied to the signed-in identity, never a previous account.
  const [workspaceState, setWorkspaceState] = useState<{
    ownerId: string;
    entries: string[];
  } | null>(null);
  const userId = user?.id;
  const workspaces =
    status === 'signed-in' && userId !== undefined && workspaceState?.ownerId === String(userId)
      ? workspaceState.entries
      : [];

  useEffect(() => {
    if (status !== 'signed-in' || userId === undefined) return;
    let active = true;
    void Promise.all([
      memberships()
        .then((r) => r.data.some((m) => m.is_active && m.seller_status === 'approved'))
        .catch(() => false),
      adminDashboard()
        .then(() => true)
        .catch(() => false),
      superAdminDashboard()
        .then(() => true)
        .catch(() => false),
      reviewOverview()
        .then(() => true)
        .catch(() => false),
      courierProfile()
        .then(() => true)
        .catch(() => false),
    ]).then((results) => {
      if (active)
        setWorkspaceState({
          ownerId: String(userId),
          entries: ['seller', 'admin', 'super', 'reviewer', 'courier'].filter((_, i) => results[i]),
        });
    });
    return () => {
      active = false;
    };
  }, [status, userId]);
  return (
    <nav
      className={styles.sidebar}
      aria-label={tr('قائمة الحساب', 'Account navigation', 'Navigation du compte')}
      dir={ar ? 'rtl' : 'ltr'}
    >
      <div className={styles.brand}>
        <strong>ALL 5.75</strong>
        <span>{tr('إعدادات الحساب', 'Account & settings', 'Compte et paramètres')}</span>
      </div>
      <div className={styles.group}>
        <h2>{tr('الحساب الشخصي', 'Personal account', 'Compte personnel')}</h2>
        {pages.map((item) => {
          const selected =
            pathname === item.path ||
            (item.path !== routePaths.account && pathname.startsWith(item.path + '/'));
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              aria-current={selected ? 'page' : undefined}
              className={selected ? styles.selected : styles.link}
            >
              {ar ? item.ar : fr ? item.fr : item.en}
            </Link>
          );
        })}
      </div>
      <div className={styles.group}>
        <h2>{tr('مساحة العمل', 'Workspaces', 'Espaces de travail')}</h2>
        <Link className={styles.link} to={routePaths.dashboard} onClick={onNavigate}>
          {tr('لوحة العميل', 'Customer dashboard', 'Tableau de bord client')}
        </Link>
        <div className={styles.roleActions}>
          <Link className={styles.link} to={routeTo.roleApplication('admin')} onClick={onNavigate}>
            {tr('الانضمام كمسؤول', 'Become Admin', 'Devenir administrateur')}
          </Link>
          <Link
            className={styles.link}
            to={routeTo.roleApplication('courier')}
            onClick={onNavigate}
          >
            {tr('الانضمام كمندوب توصيل', 'Become Delivery', 'Devenir livreur')}
          </Link>
        </div>
        {workspaces.includes('seller') && (
          <Link className={styles.link} to={routePaths.sellerWorkspace} onClick={onNavigate}>
            {tr('لوحة البائع', 'Seller dashboard', 'Tableau de bord vendeur')}
          </Link>
        )}
        {workspaces.includes('courier') && (
          <Link className={styles.link} to={routePaths.courierWorkspace} onClick={onNavigate}>
            {tr('مساحة مندوب التوصيل', 'Courier workspace', 'Espace livreur')}
          </Link>
        )}
        {workspaces.includes('admin') && (
          <Link className={styles.link} to={routePaths.platformAdminDashboard} onClick={onNavigate}>
            {tr('لوحة الإدارة', 'Admin dashboard', 'Tableau de bord administrateur')}
          </Link>
        )}
        {workspaces.includes('super') && (
          <Link className={styles.link} to={routePaths.superAdminDashboard} onClick={onNavigate}>
            {tr(
              'لوحة السوبر أدمن',
              'Super Admin dashboard',
              'Tableau de bord super administrateur',
            )}
          </Link>
        )}
        {workspaces.includes('reviewer') && !workspaces.includes('super') && (
          <Link className={styles.link} to={routePaths.sellerReview} onClick={onNavigate}>
            {tr('لوحة الموافقات', 'Approvals dashboard', 'Tableau des approbations')}
          </Link>
        )}
        <Link className={styles.link} to={routePaths.sellerApplication} onClick={onNavigate}>
          {tr('الانضمام كبائع', 'Seller application', 'Devenir vendeur')}
        </Link>
      </div>
    </nav>
  );
}
