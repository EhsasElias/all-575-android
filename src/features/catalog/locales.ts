import type { Translations } from '@/shared/i18n';

const en = {
  home: {
    title: 'Products are on the way',
    message: 'We are getting the shelves ready. Meanwhile, you can browse the categories.',
    action: 'Browse categories',
  },
  categories: {
    title: 'No categories to show yet',
    message: 'Check back soon, or head to the home page.',
  },
};

const ar: Translations<typeof en> = {
  home: {
    title: 'المنتجات في الطريق',
    message: 'نجهّز الرفوف الآن. يمكنك تصفّح الفئات في الأثناء.',
    action: 'تصفّح الفئات',
  },
  categories: {
    title: 'لا توجد فئات لعرضها بعد',
    message: 'عد قريبًا، أو انتقل إلى الصفحة الرئيسية.',
  },
};

export const catalogLocales = { en, ar };
