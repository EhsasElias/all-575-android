import type { Translations } from '@/shared/i18n';

const en = {
  open: 'Open menu',
  title: 'Menu',
  greeting: 'Welcome',
  intro: 'Everything you need, simply.',
  dashboard: 'Customer dashboard',
  home: 'Home',
  orders: 'My orders',
  addresses: 'My addresses',
  spending: 'My spending',
  support: 'Support and returns',
  account: 'My account',
};
const ar: Translations<typeof en> = {
  open: 'فتح القائمة',
  title: 'القائمة',
  greeting: 'أهلًا بك',
  intro: 'كل احتياجاتك بسهولة.',
  dashboard: 'لوحة العميل',
  home: 'الرئيسية',
  orders: 'طلباتي',
  addresses: 'عناويني',
  spending: 'مشترياتي',
  support: 'الدعم والمرتجعات',
  account: 'حسابي',
};
const fr: Translations<typeof en> = {
  open: 'Ouvrir le menu',
  title: 'Menu',
  greeting: 'Bienvenue',
  intro: 'Tout ce dont vous avez besoin, simplement.',
  dashboard: 'Tableau de bord client',
  home: 'Accueil',
  orders: 'Mes commandes',
  addresses: 'Mes adresses',
  spending: 'Mes dépenses',
  support: 'Assistance et retours',
  account: 'Mon compte',
};

export const navigationLocales = { en, ar, fr };
