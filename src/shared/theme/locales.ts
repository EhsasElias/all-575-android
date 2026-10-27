import type { Translations } from '@/shared/i18n';

const en = {
  label: 'Appearance',
  light: 'Light',
  dark: 'Dark',
  system: 'System',
};
const ar: Translations<typeof en> = {
  label: 'المظهر',
  light: 'فاتح',
  dark: 'داكن',
  system: 'حسب الجهاز',
};
const fr: Translations<typeof en> = {
  label: 'Apparence',
  light: 'Clair',
  dark: 'Sombre',
  system: 'Système',
};

export const appearanceLocales = { en, ar, fr };
