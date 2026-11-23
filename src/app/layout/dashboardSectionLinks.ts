import { routePaths } from '@/shared/lib';

type SectionLink = { to: string; ar: string; en: string; fr: string };

export const seller: SectionLink[] = [
  {
    to: routePaths.sellerWorkspace + '?section=overview',
    ar: 'نظرة عامة',
    en: 'Overview',
    fr: 'Vue d’ensemble',
  },
  {
    to: routePaths.sellerWorkspace + '?section=store',
    ar: 'المتجر والفروع',
    en: 'Store & branches',
    fr: 'Magasin et succursales',
  },
  {
    to: routePaths.sellerWorkspace + '?section=products',
    ar: 'المنتجات',
    en: 'Products',
    fr: 'Produits',
  },
  {
    to: routePaths.sellerWorkspace + '?section=inventory',
    ar: 'المخزون',
    en: 'Inventory',
    fr: 'Stock',
  },
  {
    to: routePaths.sellerWorkspace + '?section=orders',
    ar: 'الطلبات',
    en: 'Orders',
    fr: 'Commandes',
  },
  {
    to: routePaths.sellerWorkspace + '?section=returns',
    ar: 'المرتجعات',
    en: 'Returns',
    fr: 'Retours',
  },
  {
    to: routePaths.sellerWorkspace + '?section=finance',
    ar: 'المالية',
    en: 'Finance',
    fr: 'Finances',
  },
  { to: routePaths.sellerWorkspace + '?section=staff', ar: 'الفريق', en: 'Staff', fr: 'Équipe' },
];

export const review: SectionLink[] = [
  {
    to: routePaths.sellerReview + '?tab=applications',
    ar: 'طلبات البائعين',
    en: 'Seller applications',
    fr: 'Candidatures des vendeurs',
  },
  {
    to: routePaths.sellerReview + '?tab=branches',
    ar: 'اعتماد الفروع',
    en: 'Branch approvals',
    fr: 'Approbation des succursales',
  },
  {
    to: routePaths.sellerReview + '?tab=products',
    ar: 'مراجعة المنتجات',
    en: 'Product approvals',
    fr: 'Approbation des produits',
  },
  {
    to: routePaths.sellerReview + '?tab=categories',
    ar: 'إدارة التصنيفات',
    en: 'Categories',
    fr: 'Catégories',
  },
];

export const superAdmin: SectionLink[] = [
  {
    to: routePaths.superAdminDashboard,
    ar: 'الإحصائيات',
    en: 'Dashboard & statistics',
    fr: 'Tableau de bord et statistiques',
  },
  {
    to: routePaths.superAdminDashboard + '#admin-accounts',
    ar: 'إدارة الحسابات والصلاحيات',
    en: 'Admin permissions',
    fr: 'Autorisations administrateur',
  },
  {
    to: routePaths.superAdminDashboard + '#courier-approvals',
    ar: 'اعتماد المندوبين',
    en: 'Courier approvals',
    fr: 'Approbation des livreurs',
  },
  {
    to: routePaths.superAdminDashboard + '#admin-applications',
    ar: 'اعتماد طلبات الإدارة',
    en: 'Admin approvals',
    fr: 'Approbation des administrateurs',
  },
  {
    to: routePaths.superAdminDashboard + '#courier-applications',
    ar: 'طلبات انضمام المندوبين',
    en: 'Courier applications',
    fr: 'Candidatures des livreurs',
  },
  ...review,
];

export const admin: SectionLink[] = [
  {
    to: routePaths.platformAdminDashboard,
    ar: 'نظرة عامة',
    en: 'Operations overview',
    fr: 'Vue d’ensemble des opérations',
  },
  {
    to: routePaths.platformAdminDashboard + '#order-monitoring',
    ar: 'مراقبة الطلبات',
    en: 'Order monitoring',
    fr: 'Suivi des commandes',
  },
  {
    to: routePaths.platformAdminDashboard + '#inventory-overview',
    ar: 'المخزون',
    en: 'Inventory overview',
    fr: 'Vue d’ensemble du stock',
  },
  {
    to: routePaths.platformAdminDashboard + '#courier-operations',
    ar: 'التوصيل والبلاغات',
    en: 'Dispatch & incidents',
    fr: 'Livraisons et incidents',
  },
];

export const courier: SectionLink[] = [
  {
    to: routePaths.courierWorkspace,
    ar: 'مهام التوصيل',
    en: 'Courier jobs',
    fr: 'Missions de livraison',
  },
];
export const customer: SectionLink[] = [
  {
    to: routePaths.dashboard,
    ar: 'ملخص العميل',
    en: 'Customer overview',
    fr: 'Tableau de bord client',
  },
  { to: routePaths.orders, ar: 'طلباتي', en: 'Orders', fr: 'Commandes' },
  { to: routePaths.spending, ar: 'المصروفات', en: 'Spending', fr: 'Dépenses' },
  { to: routePaths.customerRequests, ar: 'الطلبات الخاصة', en: 'Requests', fr: 'Demandes' },
  { to: routePaths.customerCases, ar: 'الدعم', en: 'Support', fr: 'Assistance' },
];

