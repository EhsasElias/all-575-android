import type { Translations } from '@/shared/i18n';

export const orderFiltersEn = {
  orderFilters: {
    emptyTitle: 'No matching orders',
    emptyMessage: 'Change or clear the filters to see more orders.',
    title: 'Filter orders',
    number: 'Order number',
    status: 'Order status',
    all: 'All statuses',
    allDates: 'All dates',
    apply: 'Apply filters',
    clear: 'Clear filters',
    dateBasis: 'Filter by order date, using Saudi time.',
  },
};

export const orderFiltersAr: Translations<typeof orderFiltersEn> = {
  orderFilters: {
    emptyTitle: 'لا توجد طلبات مطابقة',
    emptyMessage: 'غيّر الفلاتر أو امسحها لعرض المزيد من الطلبات.',
    title: 'تصفية الطلبات',
    number: 'رقم الطلب',
    status: 'حالة الطلب',
    all: 'جميع الحالات',
    allDates: 'كل التواريخ',
    apply: 'تطبيق الفلاتر',
    clear: 'مسح الفلاتر',
    dateBasis: 'التصفية حسب تاريخ إنشاء الطلب بتوقيت السعودية.',
  },
};

export const orderFiltersFr: Translations<typeof orderFiltersEn> = {
  orderFilters: {
    emptyTitle: 'Aucune commande correspondante',
    emptyMessage: 'Modifiez ou effacez les filtres pour voir plus de commandes.',
    title: 'Filtrer les commandes',
    number: 'Numéro de commande',
    status: 'État de la commande',
    all: 'Tous les états',
    allDates: 'Toutes les dates',
    apply: 'Appliquer les filtres',
    clear: 'Effacer les filtres',
    dateBasis: 'Filtrer par date de commande, en heure saoudienne.',
  },
};
