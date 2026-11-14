import { Link, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { routePaths } from '@/shared/lib';
import styles from './AccountSidebar.module.css';

type SectionLink = { to: string; ar: string; en: string };

const seller: SectionLink[] = [
  { to: routePaths.sellerWorkspace + '?section=overview', ar: 'نظرة عامة', en: 'Overview' },
  { to: routePaths.sellerWorkspace + '?section=store', ar: 'المتجر والفروع', en: 'Store & branches' },
  { to: routePaths.sellerWorkspace + '?section=products', ar: 'المنتجات', en: 'Products' },
  { to: routePaths.sellerWorkspace + '?section=inventory', ar: 'المخزون', en: 'Inventory' },
  { to: routePaths.sellerWorkspace + '?section=orders', ar: 'الطلبات', en: 'Orders' },
  { to: routePaths.sellerWorkspace + '?section=returns', ar: 'المرتجعات', en: 'Returns' },
  { to: routePaths.sellerWorkspace + '?section=finance', ar: 'المالية', en: 'Finance' },
  { to: routePaths.sellerWorkspace + '?section=staff', ar: 'الفريق', en: 'Staff' },
];

const review: SectionLink[] = [
  { to: routePaths.sellerReview + '?tab=applications', ar: 'طلبات البائعين', en: 'Seller applications' },
  { to: routePaths.sellerReview + '?tab=branches', ar: 'اعتماد الفروع', en: 'Branch approvals' },
  { to: routePaths.sellerReview + '?tab=products', ar: 'مراجعة المنتجات', en: 'Product approvals' },
  { to: routePaths.sellerReview + '?tab=categories', ar: 'إدارة التصنيفات', en: 'Categories' },
];

const superAdmin: SectionLink[] = [
  { to: routePaths.superAdminDashboard, ar: 'الإحصائيات', en: 'Dashboard & statistics' },
  { to: routePaths.superAdminDashboard + '#admin-accounts', ar: 'إدارة الحسابات والصلاحيات', en: 'Admin permissions' },
  ...review,
];

const admin: SectionLink[] = [
  { to: routePaths.platformAdminDashboard, ar: 'نظرة عامة', en: 'Operations overview' },
  { to: routePaths.platformAdminDashboard + '#order-monitoring', ar: 'مراقبة الطلبات', en: 'Order monitoring' },
  { to: routePaths.platformAdminDashboard + '#inventory-overview', ar: 'المخزون', en: 'Inventory overview' },
];

const customer: SectionLink[] = [
  { to: routePaths.dashboard, ar: 'ملخص العميل', en: 'Customer overview' },
  { to: routePaths.orders, ar: 'طلباتي', en: 'Orders' },
  { to: routePaths.spending, ar: 'المصروفات', en: 'Spending' },
  { to: routePaths.customerRequests, ar: 'الطلبات الخاصة', en: 'Requests' },
  { to: routePaths.customerCases, ar: 'الدعم', en: 'Support' },
];

export function DashboardSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { i18n } = useTranslation();
  const ar = i18n.language.startsWith('ar');
  const tr = (a: string, en: string) => ar ? a : en;
  const { pathname, search, hash } = useLocation();

  const workspace =
    pathname === routePaths.superAdminDashboard ? 'super' :
    pathname === routePaths.platformAdminDashboard ? 'admin' :
    pathname === routePaths.sellerReview ? 'review' :
    pathname === routePaths.sellerWorkspace ? 'seller' : 'customer';

  const sections = workspace === 'super' ? superAdmin :
    workspace === 'admin' ? admin :
    workspace === 'review' ? review :
    workspace === 'seller' ? seller : customer;
  const title = workspace === 'super' ? tr('السوبر أدمن', 'Super Admin') :
    workspace === 'admin' ? tr('الإدارة', 'Admin') :
    workspace === 'review' ? tr('الموافقات', 'Approvals') :
    workspace === 'seller' ? tr('البائع', 'Seller') : tr('العميل', 'Customer');

  const isActive = (to: string) => {
    const [pathAndQuery, targetHash] = to.split('#');
    const [path, query] = pathAndQuery.split('?');
    if (pathname !== path) return false;
    if (targetHash) return hash === '#' + targetHash;
    if (hash) return false;
    if (!query) return search === '';
    const [key, value] = query.split('=');
    const current = new URLSearchParams(search).get(key);
    return (current ?? (key === 'tab' ? 'applications' : 'overview')) === value;
  };

  return (
    <nav className={styles.sidebar} aria-label={tr('قائمة لوحة التحكم', 'Dashboard navigation')} dir={ar ? 'rtl' : 'ltr'}>
      <div className={styles.brand}>
        <strong>{title}</strong>
        <span>{tr('لوحة تحكم ALL 5.75', 'ALL 5.75 workspace')}</span>
      </div>
      <div className={styles.group}>
        <h2>{tr('أقسام لوحة التحكم', 'Dashboard sections')}</h2>
        {sections.map(item => (
          <Link key={item.to} to={item.to} onClick={onNavigate}
            aria-current={isActive(item.to) ? 'page' : undefined}
            className={isActive(item.to) ? styles.selected : styles.link}>
            {ar ? item.ar : item.en}
          </Link>
        ))}
      </div>
      <div className={styles.group}>
        <h2>{tr('التنقل', 'Navigation')}</h2>
        <Link to={routePaths.account} className={styles.link} onClick={onNavigate}>
          {tr('العودة إلى حسابي', 'Back to my account')}
        </Link>
      </div>
    </nav>
  );
}
