import type { Translations } from '@/shared/i18n';

export const spendingFiltersEn = {
  spendingFilters: {
    all: 'All',
    title: 'Filter spending orders',
    category: 'Orders containing category',
    seller: 'Orders containing seller',
    scope:
      'Totals include the whole matching order, not only selected products. Categories use current catalog grouping.',
    failed: 'We could not load the filter choices.',
  },
};

export const spendingFiltersAr: Translations<typeof spendingFiltersEn> = {
  spendingFilters: {
    all: 'الكل',
    title: 'تصفية طلبات الإنفاق',
    category: 'طلبات تحتوي على الفئة',
    seller: 'طلبات تحتوي على البائع',
    scope:
      'تشمل المجاميع كامل الطلب المطابق، وليس المنتجات المختارة فقط. تعتمد الفئات على تصنيف الكتالوج الحالي.',
    failed: 'تعذر تحميل خيارات التصفية.',
  },
};

export const spendingFiltersFr: Translations<typeof spendingFiltersEn> = {
  spendingFilters: {
    all: 'Tous',
    title: 'Filtrer les commandes payées',
    category: 'Commandes contenant la catégorie',
    seller: 'Commandes contenant le vendeur',
    scope:
      'Les totaux incluent toute la commande correspondante, pas seulement les articles choisis. Les catégories suivent le catalogue actuel.',
    failed: 'Impossible de charger les filtres.',
  },
};
