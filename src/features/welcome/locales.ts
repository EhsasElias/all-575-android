import type { Translations } from '@/shared/i18n';

const en = {
  headlineLead: 'Welcome,',
  headlineAccent: 'our partner in success',
  subline: 'Everything you need, in one place',
  cta: 'Tap the logo to shop now',
  skip: 'Skip',
  signInPrompt: 'Already a customer?',
  signInLink: 'Sign in',
  priceLine: 'Up to {{amount}}',
  carouselLabel: 'Shop by category',
  slides: {
    fruit: 'Fruit & vegetables',
    household: 'Household essentials',
    clothing: 'Clothing',
  },
};

const ar: Translations<typeof en> = {
  headlineLead: 'نرحب بكم',
  headlineAccent: 'شريك النجاح',
  subline: 'كل ما تحتاجه، في مكان واحد',
  cta: 'اضغط على الشعار للتسوق الآن',
  skip: 'تخطي',
  signInPrompt: 'لديك حساب؟',
  signInLink: 'تسجيل الدخول',
  priceLine: 'حتى {{amount}}',
  carouselLabel: 'تسوّق حسب الفئة',
  slides: {
    fruit: 'خضار وفواكه',
    household: 'منظفات',
    clothing: 'ملابس',
  },
};

const fr: Translations<typeof en> = {
  headlineLead: 'Bienvenue,',
  headlineAccent: 'partenaire de réussite',
  subline: 'Tout ce dont vous avez besoin, au même endroit',
  cta: 'Touchez le logo pour acheter',
  skip: 'Passer',
  signInPrompt: 'Déjà client ?',
  signInLink: 'Se connecter',
  priceLine: 'Jusqu’à {{amount}}',
  carouselLabel: 'Acheter par catégorie',
  slides: {
    fruit: 'Fruits et légumes',
    household: 'Articles ménagers essentiels',
    clothing: 'Vêtements',
  },
};

export const welcomeLocales = { en, ar, fr };
