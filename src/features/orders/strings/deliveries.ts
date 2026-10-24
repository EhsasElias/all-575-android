import type { Translations } from '@/shared/i18n';

export const deliveriesEn = {
  deliveries: {
    title: 'Deliveries',
    separate:
      'This order comes from more than one seller. Each seller delivers on their own, so the parts can arrive at different times.',
  },
  suborder: {
    from: 'From {{seller}}',
    progress: 'Delivery progress',
    step: 'Step {{current}} of {{total}}',
    state: { done: 'completed', current: 'current step', next: 'not started' },
    eta: 'Expected {{time}}',
    etaPending: 'The expected time will show here once the seller confirms.',
    etaRevised: 'The time changed: {{reason}}',
  },
  items: {
    quantityPrice: '{{quantity}} × {{price}}',
  },
  code: {
    show: 'Show my delivery code',
    warning: 'Give this code only to the courier at your door. Never share it by phone or message.',
    validUntil: 'Valid until {{time}}.',
    autoHide: 'It hides itself after a minute.',
    hide: 'Hide code',
    unavailable: 'There is no code to show right now. It appears while your courier is on the way.',
    failed: 'We could not get your code. Check your connection and try again.',
  },
  cancel: {
    button: 'Cancel order',
    title: 'Cancel this order?',
    unpaidExplanation:
      'You have not paid yet, so nothing will be charged. The items and your delivery slot will be released.',
    paidExplanation: 'You will get back the full {{amount}} you paid, to the same payment method.',
    refundNote:
      'The refund shows as "In progress" until your payment provider confirms it. Only then do we mark it as refunded.',
    confirm: 'Yes, cancel my order',
    keep: 'Keep my order',
    close: 'Close',
    done: 'Your order was cancelled.',
    failed: 'We could not cancel the order. Check your connection and try again.',
    notCancellable:
      'This order is already being prepared, so it can no longer be cancelled here. Contact support if you need help.',
    locked: 'The seller has started preparing this order, so it can no longer be cancelled here.',
  },
};

export const deliveriesAr: Translations<typeof deliveriesEn> = {
  deliveries: {
    title: 'التوصيل',
    separate:
      'يتكوّن هذا الطلب من أكثر من بائع. يوصّل كل بائع طلبه على حدة، لذلك قد تصل الأجزاء في أوقات مختلفة.',
  },
  suborder: {
    from: 'من {{seller}}',
    progress: 'مراحل التوصيل',
    step: 'المرحلة {{current}} من {{total}}',
    state: { done: 'مكتملة', current: 'المرحلة الحالية', next: 'لم تبدأ بعد' },
    eta: 'الموعد المتوقع: {{time}}',
    etaPending: 'سيظهر الموعد المتوقع هنا بعد تأكيد البائع.',
    etaRevised: 'تغيّر الموعد: {{reason}}',
  },
  items: {
    quantityPrice: '{{quantity}} × {{price}}',
  },
  code: {
    show: 'عرض رمز الاستلام',
    warning: 'أعطِ هذا الرمز للمندوب عند بابك فقط. لا تشاركه عبر الهاتف أو الرسائل.',
    validUntil: 'صالح حتى {{time}}.',
    autoHide: 'يختفي تلقائيًا بعد دقيقة.',
    hide: 'إخفاء الرمز',
    unavailable: 'لا يوجد رمز لعرضه الآن. يظهر الرمز عندما يكون المندوب في الطريق إليك.',
    failed: 'تعذّر الحصول على الرمز. تحقق من اتصالك وحاول مرة أخرى.',
  },
  cancel: {
    button: 'إلغاء الطلب',
    title: 'هل تريد إلغاء هذا الطلب؟',
    unpaidExplanation:
      'لم تدفع بعد، لذلك لن يُخصم منك أي مبلغ. وسيُلغى حجز المنتجات وموعد التوصيل.',
    paidExplanation: 'ستسترد كامل المبلغ المدفوع ({{amount}}) على وسيلة الدفع نفسها.',
    refundNote:
      'يظهر الاسترداد «قيد المعالجة» إلى أن يؤكده مزوّد الدفع، وعندها فقط نعلّمه «تم الاسترداد».',
    confirm: 'نعم، ألغِ طلبي',
    keep: 'الإبقاء على الطلب',
    close: 'إغلاق',
    done: 'تم إلغاء طلبك.',
    failed: 'تعذّر إلغاء الطلب. تحقق من اتصالك وحاول مرة أخرى.',
    notCancellable:
      'بدأ تجهيز هذا الطلب، ولا يمكن إلغاؤه من هنا الآن. تواصل مع الدعم إذا احتجت مساعدة.',
    locked: 'بدأ البائع بتجهيز هذا الطلب، ولا يمكن إلغاؤه من هنا الآن.',
  },
};
