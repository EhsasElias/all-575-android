import type { Translations } from '@/shared/i18n';

const en = {
  unavailableTitle: 'Sign-in is not available yet',
  unavailableMessage: 'You can keep browsing as a guest in the meantime.',
};

const ar: Translations<typeof en> = {
  unavailableTitle: 'تسجيل الدخول غير متاح بعد',
  unavailableMessage: 'يمكنك متابعة التصفح كزائر في الأثناء.',
};

export const authLocales = { en, ar };
