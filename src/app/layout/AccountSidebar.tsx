import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { routePaths } from '@/shared/lib';
import { useSession } from '@/shared/session';
import { memberships } from '@/features/account/sellerWorkspaceApi';
import { superAdminDashboard } from '@/features/account/superAdminApi';
import { adminDashboard } from '@/features/account/platformAdminApi';
import { reviewOverview } from '@/features/account/sellerReviewApi';
import styles from './AccountSidebar.module.css';

type AccountLink = { path: string; ar: string; en: string };

const pages: AccountLink[] = [
  { path: routePaths.account, ar: 'نظرة عامة على الحساب', en: 'Account overview' },
  { path: routePaths.profile, ar: 'الملف الشخصي', en: 'Profile' },
  { path: routePaths.notifications, ar: 'الإشعارات', en: 'Notifications' },
  { path: routePaths.addresses, ar: 'العناوين', en: 'Addresses' },
  { path: routePaths.billing, ar: 'بيانات الفوترة', en: 'Billing' },
  { path: routePaths.sessions, ar: 'الأجهزة والجلسات', en: 'Sessions' },
  { path: routePaths.savedProducts, ar: 'المنتجات المحفوظة', en: 'Saved products' },
  { path: routePaths.customerRequests, ar: 'طلباتي الخاصة', en: 'Requests' },
  { path: routePaths.customerCases, ar: 'الدعم', en: 'Support' },
  { path: routePaths.orders, ar: 'طلباتي', en: 'My orders' },
  { path: routePaths.spending, ar: 'المصروفات', en: 'Spending' },
];

export function AccountSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { i18n } = useTranslation();
  const ar = i18n.language.startsWith('ar');
  const tr = (a: string, en: string) => ar ? a : en;
  const { pathname } = useLocation();
  const { status, user } = useSession();
  const [workspaces, setWorkspaces] = useState<string[]>([]);

  useEffect(() => {
    if (status !== 'signed-in' || !user) { setWorkspaces([]); return; }
    let active = true;
    void Promise.all([
      memberships().then(r => r.data.some(m => m.is_active && m.seller_status === 'approved')).catch(() => false),
      adminDashboard().then(() => true).catch(() => false),
      superAdminDashboard().then(() => true).catch(() => false),
      reviewOverview().then(() => true).catch(() => false),
    ]).then(results => {
      if (active) setWorkspaces(['seller', 'admin', 'super', 'reviewer'].filter((_, i) => results[i]));
    });
    return () => { active = false; };
  }, [status, user?.id]);
  return (
    <nav className={styles.sidebar} aria-label={tr('قائمة الحساب', 'Account navigation')} dir={ar ? 'rtl' : 'ltr'}>
      <div className={styles.brand}>
        <strong>ALL 5.75</strong>
        <span>{tr('إعدادات الحساب', 'Account & settings')}</span>
      </div>
      <div className={styles.group}>
        <h2>{tr('الحساب الشخصي', 'Personal account')}</h2>
        {pages.map(item => {
          const selected = pathname === item.path || (item.path !== routePaths.account && pathname.startsWith(item.path + '/'));
          return (
            <Link key={item.path} to={item.path} onClick={onNavigate} aria-current={selected ? 'page' : undefined}
              className={selected ? styles.selected : styles.link}>
              {ar ? item.ar : item.en}
            </Link>
          );
        })}
      </div>
      <div className={styles.group}>
        <h2>{tr('مساحة العمل', 'Workspaces')}</h2>
        <Link className={styles.link} to={routePaths.dashboard} onClick={onNavigate}>
          {tr('لوحة العميل', 'Customer dashboard')}
        </Link>
        {workspaces.includes('seller') && (
          <Link className={styles.link} to={routePaths.sellerWorkspace} onClick={onNavigate}>
            {tr('لوحة البائع', 'Seller dashboard')}
          </Link>
        )}
        {workspaces.includes('admin') && (
          <Link className={styles.link} to={routePaths.platformAdminDashboard} onClick={onNavigate}>
            {tr('لوحة الإدارة', 'Admin dashboard')}
          </Link>
        )}
        {workspaces.includes('super') && (
          <Link className={styles.link} to={routePaths.superAdminDashboard} onClick={onNavigate}>
            {tr('لوحة السوبر أدمن', 'Super Admin dashboard')}
          </Link>
        )}
        {workspaces.includes('reviewer') && !workspaces.includes('super') && (
          <Link className={styles.link} to={routePaths.sellerReview} onClick={onNavigate}>
            {tr('لوحة الموافقات', 'Approvals dashboard')}
          </Link>
        )}
        <Link className={styles.link} to={routePaths.sellerApplication} onClick={onNavigate}>
          {tr('الانضمام كبائع', 'Seller application')}
        </Link>
      </div>
    </nav>
  );
}
