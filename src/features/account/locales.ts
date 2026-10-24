import type { Translations } from '@/shared/i18n';

const en = {
  guestTitle: 'Sign in to manage your account',
  guestMessage: 'You can browse freely as a guest. An account is needed to place orders.',
  signIn: 'Sign in',
};

const ar: Translations<typeof en> = {
  guestTitle: 'سجّل الدخول لإدارة حسابك',
  guestMessage: 'يمكنك التصفح بحرية كزائر. تحتاج إلى حساب لإتمام الطلبات.',
  signIn: 'تسجيل الدخول',
};

export const accountLocales = { en, ar };
