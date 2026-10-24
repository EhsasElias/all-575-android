import type { Translations } from '@/shared/i18n';

const en = {
  headlineLead: 'Welcome,',
  headlineAccent: 'our partner in success',
  subline: 'Everything you need, in one place',
  cta: 'Tap the logo to shop now',
  skip: 'Skip',
  signInPrompt: 'Already a customer?',
  signInLink: 'Sign in',
  priceLine: 'Everything · {{amount}}',
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
  priceLine: 'كل شيء بـ {{amount}}',
  carouselLabel: 'تسوّق حسب الفئة',
  slides: {
    fruit: 'خضار وفواكه',
    household: 'منظفات',
    clothing: 'ملابس',
  },
};

export const welcomeLocales = { en, ar };
