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

type Role = 'seller' | 'admin' | 'super' | 'reviewer';
type MenuItem = { to: string; ar: string; en: string };

const customerItems: MenuItem[] = [
  { to: routePaths.account, ar: 'حسابي', en: 'My account' },
  { to: routePaths.dashboard, ar: 'لوحة العميل', en: 'Customer dashboard' },
  { to: routePaths.orders, ar: 'طلباتي', en: 'My orders' },
  { to: routePaths.notifications, ar: 'الإشعارات', en: 'Notifications' },
  { to: routePaths.customerRequests, ar: 'طلباتي الخاصة', en: 'Requests' },
  { to: routePaths.customerCases, ar: 'الدعم', en: 'Support' },
  { to: routePaths.savedProducts, ar: 'المحفوظات', en: 'Saved products' },
  { to: routePaths.addresses, ar: 'العناوين', en: 'Addresses' },
  { to: routePaths.spending, ar: 'المصروفات', en: 'Spending' },
  { to: routePaths.billing, ar: 'بيانات الفوترة', en: 'Billing' },
  { to: routePaths.profile, ar: 'الملف الشخصي', en: 'Profile' },
  { to: routePaths.sessions, ar: 'الأجهزة والجلسات', en: 'Sessions' },
];

const sellerSections: MenuItem[] = [
  { to: '?section=overview', ar: 'نظرة عامة', en: 'Overview' },
  { to: '?section=store', ar: 'المتجر والفروع', en: 'Store & branches' },
  { to: '?section=products', ar: 'المنتجات', en: 'Products' },
  { to: '?section=inventory', ar: 'المخزون', en: 'Inventory' },
  { to: '?section=orders', ar: 'الطلبات', en: 'Orders' },
  { to: '?section=returns', ar: 'المرتجعات', en: 'Returns' },
  { to: '?section=finance', ar: 'المالية', en: 'Finance' },
  { to: '?section=staff', ar: 'الفريق', en: 'Staff' },
];

const reviewSections: MenuItem[] = [
  { to: '?tab=applications', ar: 'طلبات البائعين', en: 'Seller applications' },
  { to: '?tab=branches', ar: 'الفروع الجديدة', en: 'New branches' },
  { to: '?tab=products', ar: 'مراجعة المنتجات', en: 'Product approvals' },
  { to: '?tab=categories', ar: 'التصنيفات', en: 'Categories' },
];

export function AccountSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { i18n } = useTranslation();
  const ar = i18n.language.startsWith('ar');
  const t = (arText: string, enText: string) => ar ? arText : enText;
  const { status, user } = useSession();
  const { pathname, search, hash } = useLocation();
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    if (status !== 'signed-in' || !user) { setRoles([]); return; }
    let alive = true;
    setRoles([]);
    const check = async () => {
      const results = await Promise.all([
        memberships().then(r => r.data.some(m => m.is_active && m.seller_status === 'approved')).catch(() => false),
        adminDashboard().then(() => true).catch(() => false),
        superAdminDashboard().then(() => true).catch(() => false),
        reviewOverview().then(() => true).catch(() => false),
      ]);
      if (alive) setRoles((['seller', 'admin', 'super', 'reviewer'] as const).filter((_, i) => results[i]));
    };
    void check();
    return () => { alive = false; };
  }, [status, user?.id]);

  const has = (role: Role) => roles.includes(role);
  const active = (to: string) => {
    const [route, query] = to.split('?');
    const path = route.split('#')[0];
    const matchesSubpage = [routePaths.orders, routePaths.addresses, routePaths.customerCases].some(
      parent => path === parent && pathname.startsWith(parent + '/')
    );
    if (pathname !== path && !matchesSubpage) return false;
    if (route.includes('#')) return hash === '#' + route.split('#')[1];
    if (!query) return hash === '';
    const [key, value] = query.split('=');
    const selected = new URLSearchParams(search).get(key);
    return (selected ?? (key === 'tab' ? 'applications' : 'overview')) === value;
  };

  const group = (heading: string, entries: MenuItem[], base = '') => (
    <div className={styles.group} key={heading}>
      <h2>{heading}</h2>
      {entries.map(item => {
        const to = item.to.startsWith('?') ? base + item.to : item.to;
        return <Link key={to} to={to} onClick={onNavigate}
          aria-current={active(to) ? 'page' : undefined}
          className={active(to) ? styles.selected : styles.link}>
          <span>{ar ? item.ar : item.en}</span>
        </Link>;
      })}
    </div>
  );

  return (
    <nav className={styles.sidebar} aria-label={t('قائمة الحساب', 'Account navigation')} dir={ar ? 'rtl' : 'ltr'}>
      <div className={styles.brand}>
        <strong>ALL 5.75</strong>
        <span>{t('مساحة الحساب', 'Account workspace')}</span>
      </div>
      {(has('super') || pathname === routePaths.superAdminDashboard) && group(t('السوبر أدمن', 'Super Admin'), [
        {to: routePaths.superAdminDashboard, ar: 'لوحة التحكم والإحصائيات', en: 'Dashboard & statistics'},
        {to: routePaths.superAdminDashboard + '#admin-accounts', ar: 'حسابات الإدارة والصلاحيات', en: 'Admin accounts & permissions'},
        {to: routePaths.sellerReview, ar: 'طلبات البائعين', en: 'Seller applications'},
        {to: routePaths.sellerReview + '?tab=branches', ar: 'مراجعة الفروع', en: 'Branch approvals'},
        {to: routePaths.sellerReview + '?tab=products', ar: 'مراجعة المنتجات', en: 'Product approvals'},
        {to: routePaths.sellerReview + '?tab=categories', ar: 'إدارة التصنيفات', en: 'Category management'},
      ])}
      {(has('admin') || pathname === routePaths.platformAdminDashboard) && group(t('الإدارة', 'Admin'), [
        {to: routePaths.platformAdminDashboard, ar: 'لوحة العمليات', en: 'Operations overview'},
        {to: routePaths.platformAdminDashboard + '#order-monitoring', ar: 'مراقبة الطلبات', en: 'Order monitoring'},
        {to: routePaths.platformAdminDashboard + '#inventory-overview', ar: 'نظرة على المخزون', en: 'Inventory overview'},
      ])}
      {!has('super') && (has('reviewer') || pathname === routePaths.sellerReview) && group(t('الموافقات', 'Approvals'), reviewSections, routePaths.sellerReview)}
      {(has('seller') || pathname === routePaths.sellerWorkspace) && group(t('مساحة البائع', 'Seller workspace'), sellerSections, routePaths.sellerWorkspace)}
      {group(t('حساب العميل', 'Customer account'), customerItems)}
      {!has('seller') && group(t('التجارة', 'Selling'), [
        { to: routePaths.sellerApplication, ar: 'طلب الانضمام كبائع', en: 'Apply as a seller' },
      ])}
    </nav>
  );
}
