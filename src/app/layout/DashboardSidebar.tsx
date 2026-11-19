import { Link, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { routePaths } from '@/shared/lib';
import styles from './AccountSidebar.module.css';

type SectionLink = { to: string; ar: string; en: string; fr: string };

const seller: SectionLink[] = [
  { to: routePaths.sellerWorkspace + '?section=overview', ar: 'نظرة عامة', en: 'Overview', fr: 'Vue d’ensemble' },
  {
    to: routePaths.sellerWorkspace + '?section=store',
    ar: 'المتجر والفروع',
    en: 'Store & branches', fr: 'Magasin et succursales',
  },
  { to: routePaths.sellerWorkspace + '?section=products', ar: 'المنتجات', en: 'Products', fr: 'Produits' },
  { to: routePaths.sellerWorkspace + '?section=inventory', ar: 'المخزون', en: 'Inventory', fr: 'Stock' },
  { to: routePaths.sellerWorkspace + '?section=orders', ar: 'الطلبات', en: 'Orders', fr: 'Commandes' },
  { to: routePaths.sellerWorkspace + '?section=returns', ar: 'المرتجعات', en: 'Returns', fr: 'Retours' },
  { to: routePaths.sellerWorkspace + '?section=finance', ar: 'المالية', en: 'Finance', fr: 'Finances' },
  { to: routePaths.sellerWorkspace + '?section=staff', ar: 'الفريق', en: 'Staff', fr: 'Équipe' },
];

const review: SectionLink[] = [
  {
    to: routePaths.sellerReview + '?tab=applications',
    ar: 'طلبات البائعين',
    en: 'Seller applications', fr: 'Candidatures des vendeurs',
  },
  { to: routePaths.sellerReview + '?tab=branches', ar: 'اعتماد الفروع', en: 'Branch approvals', fr: 'Approbation des succursales' },
  { to: routePaths.sellerReview + '?tab=products', ar: 'مراجعة المنتجات', en: 'Product approvals', fr: 'Approbation des produits' },
  { to: routePaths.sellerReview + '?tab=categories', ar: 'إدارة التصنيفات', en: 'Categories', fr: 'Catégories' },
];

const superAdmin: SectionLink[] = [
  { to: routePaths.superAdminDashboard, ar: 'الإحصائيات', en: 'Dashboard & statistics', fr: 'Tableau de bord et statistiques' },
  {
    to: routePaths.superAdminDashboard + '#admin-accounts',
    ar: 'إدارة الحسابات والصلاحيات',
    en: 'Admin permissions', fr: 'Autorisations administrateur',
  },
  {
    to: routePaths.superAdminDashboard + '#courier-approvals',
    ar: 'اعتماد المندوبين',
    en: 'Courier approvals', fr: 'Approbation des livreurs',
  },
  ...review,
];

const admin: SectionLink[] = [
  { to: routePaths.platformAdminDashboard, ar: 'نظرة عامة', en: 'Operations overview', fr: 'Vue d’ensemble des opérations' },
  {
    to: routePaths.platformAdminDashboard + '#order-monitoring',
    ar: 'مراقبة الطلبات',
    en: 'Order monitoring', fr: 'Suivi des commandes',
  },
  {
    to: routePaths.platformAdminDashboard + '#inventory-overview',
    ar: 'المخزون',
    en: 'Inventory overview', fr: 'Vue d’ensemble du stock',
  },
  {
    to: routePaths.platformAdminDashboard + '#courier-operations',
    ar: 'التوصيل والبلاغات',
    en: 'Dispatch & incidents', fr: 'Livraisons et incidents',
  },
];

const courier: SectionLink[] = [
  { to: routePaths.courierWorkspace, ar: 'مهام التوصيل', en: 'Courier jobs', fr: 'Missions de livraison' },
];
const customer: SectionLink[] = [
  { to: routePaths.dashboard, ar: 'ملخص العميل', en: 'Customer overview', fr: 'Tableau de bord client' },
  { to: routePaths.orders, ar: 'طلباتي', en: 'Orders', fr: 'Commandes' },
  { to: routePaths.spending, ar: 'المصروفات', en: 'Spending', fr: 'Dépenses' },
  { to: routePaths.customerRequests, ar: 'الطلبات الخاصة', en: 'Requests', fr: 'Demandes' },
  { to: routePaths.customerCases, ar: 'الدعم', en: 'Support', fr: 'Assistance' },
];

export function DashboardSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { i18n } = useTranslation();
  const ar = i18n.language.startsWith('ar');
  const fr = i18n.language.startsWith('fr');
  const tr = (a: string, en: string, french: string) => (ar ? a : fr ? french : en);
  const { pathname, search, hash } = useLocation();

  const workspace =
    pathname === routePaths.superAdminDashboard
      ? 'super'
      : pathname === routePaths.platformAdminDashboard
        ? 'admin'
        : pathname === routePaths.sellerReview
          ? 'review'
          : pathname === routePaths.sellerWorkspace
            ? 'seller'
            : pathname === routePaths.courierWorkspace
              ? 'courier'
              : 'customer';

  const sections =
    workspace === 'super'
      ? superAdmin
      : workspace === 'admin'
        ? admin
        : workspace === 'review'
          ? review
          : workspace === 'seller'
            ? seller
            : workspace === 'courier'
              ? courier
              : customer;
  const title =
    workspace === 'super'
      ? tr('السوبر أدمن', 'Super Admin', 'Super administrateur')
      : workspace === 'admin'
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
          to={routePaths.notifications}
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
