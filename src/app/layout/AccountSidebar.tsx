import { Link, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { routePaths } from '@/shared/lib';
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
        <Link className={styles.link} to={routePaths.sellerApplication} onClick={onNavigate}>
          {tr('الانضمام كبائع', 'Seller application')}
        </Link>
      </div>
    </nav>
  );
}
