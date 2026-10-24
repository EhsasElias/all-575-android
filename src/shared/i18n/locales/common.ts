import type { Translations } from '../translations';

const en = {
  appName: 'ALL 5.75',
  skipToContent: 'Skip to main content',
  nav: {
    label: 'Main navigation',
    home: 'Home',
    categories: 'Categories',
    cart: 'Cart',
    orders: 'Orders',
    account: 'Account',
    checkout: 'Checkout',
    signIn: 'Sign in',
    cartBadge: 'Items in cart: {{total}}',
    tabWithBadge: '{{label}}, {{badge}}',
  },
  language: {
    label: 'Language',
    ar: 'العربية',
    en: 'English',
  },
  actions: {
    retry: 'Try again',
    close: 'Close',
    dismiss: 'Dismiss',
    backToHome: 'Back to home',
    startShopping: 'Start shopping',
    continueShopping: 'Continue shopping',
  },
  carousel: {
    slides: 'Slides',
    pause: 'Pause slideshow',
    play: 'Play slideshow',
    slide: 'Slide {{current}} of {{total}}',
    previous: 'Previous slide',
    next: 'Next slide',
  },
  states: {
    loading: 'Loading',
    errorTitle: 'Something went wrong',
    errorMessage: 'We could not load this. Check your connection and try again.',
  },
  notFound: {
    title: 'Page not found',
    message: 'The page you are looking for does not exist or has moved.',
  },
  routeError: {
    title: 'This page did not load',
    message: 'Something went wrong while showing this page. Please try again.',
  },
};

const ar: Translations<typeof en> = {
  appName: 'الكل بـ 5.75',
  skipToContent: 'تخطَّ إلى المحتوى الرئيسي',
  nav: {
    label: 'التنقل الرئيسي',
    home: 'الرئيسية',
    categories: 'الفئات',
    cart: 'السلة',
    orders: 'الطلبات',
    account: 'حسابي',
    checkout: 'إتمام الطلب',
    signIn: 'تسجيل الدخول',
    cartBadge: 'عدد المنتجات في السلة: {{total}}',
    tabWithBadge: '{{label}}، {{badge}}',
  },
  language: {
    label: 'اللغة',
    ar: 'العربية',
    en: 'English',
  },
  actions: {
    retry: 'حاول مرة أخرى',
    close: 'إغلاق',
    dismiss: 'تجاهل',
    backToHome: 'العودة إلى الرئيسية',
    startShopping: 'ابدأ التسوق',
    continueShopping: 'متابعة التسوق',
  },
  carousel: {
    slides: 'الشرائح',
    pause: 'إيقاف العرض مؤقتًا',
    play: 'تشغيل العرض',
    slide: 'الشريحة {{current}} من {{total}}',
    previous: 'الشريحة السابقة',
    next: 'الشريحة التالية',
  },
  states: {
    loading: 'جارٍ التحميل',
    errorTitle: 'حدث خطأ ما',
    errorMessage: 'تعذّر تحميل المحتوى. تحقق من اتصالك وحاول مرة أخرى.',
  },
  notFound: {
    title: 'الصفحة غير موجودة',
    message: 'الصفحة التي تبحث عنها غير موجودة أو تم نقلها.',
  },
  routeError: {
    title: 'تعذّر تحميل هذه الصفحة',
    message: 'حدث خطأ أثناء عرض هذه الصفحة. يُرجى المحاولة مرة أخرى.',
  },
};

export const commonLocales = { en, ar };
