import type { Translations } from '@/shared/i18n';

/**
 * PLACEHOLDER. The real Terms of Use and Privacy Policy have not been written or reviewed by legal yet.
 * Nothing below is a legal term: each page only says that the text is pending and lists the topics it will cover.
 */
const en = {
  version: 'Version {{version}}',
  versionUnavailable: 'The current version could not be loaded.',
  noticeTitle: 'The full text is coming soon',
  noticeMessage:
    'This page is a placeholder. The full text is waiting for legal review and will be published here before the app launches.',
  outline: 'What this document will cover',
  terms: {
    title: 'Terms of Use',
    lead: 'The rules for using ALL 5.75.',
    topics: {
      using: 'Who can use the app, and how',
      orders: 'Placing and paying for orders',
      delivery: 'Delivery and receiving your order',
      returns: 'Cancellations, returns and refunds',
      changes: 'Changes to these terms',
    },
  },
  privacy: {
    title: 'Privacy Policy',
    lead: 'How ALL 5.75 handles your personal data.',
    topics: {
      collect: 'What personal data we collect',
      use: 'Why we use it',
      share: 'Who we share it with',
      keep: 'How long we keep it',
      rights: 'Your choices and how to reach us',
    },
  },
};

const ar: Translations<typeof en> = {
  version: 'الإصدار {{version}}',
  versionUnavailable: 'تعذّر تحميل الإصدار الحالي.',
  noticeTitle: 'النص الكامل قريبًا',
  noticeMessage:
    'هذه الصفحة مؤقتة. النص الكامل بانتظار المراجعة القانونية، وسيُنشر هنا قبل إطلاق التطبيق.',
  outline: 'ما سيتناوله هذا المستند',
  terms: {
    title: 'شروط الاستخدام',
    lead: 'القواعد التي تحكم استخدام الكل بـ 5.75.',
    topics: {
      using: 'من يمكنه استخدام التطبيق وكيف',
      orders: 'تقديم الطلبات ودفعها',
      delivery: 'التوصيل واستلام طلبك',
      returns: 'الإلغاء والإرجاع واسترداد المبالغ',
      changes: 'التغييرات على هذه الشروط',
    },
  },
  privacy: {
    title: 'سياسة الخصوصية',
    lead: 'كيف يتعامل الكل بـ 5.75 مع بياناتك الشخصية.',
    topics: {
      collect: 'البيانات الشخصية التي نجمعها',
      use: 'لماذا نستخدمها',
      share: 'مع من نشاركها',
      keep: 'كم من الوقت نحتفظ بها',
      rights: 'خياراتك وكيف تتواصل معنا',
    },
  },
};

export const legalLocales = { en, ar };
