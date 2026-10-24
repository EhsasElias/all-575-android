import type { Translations } from '@/shared/i18n';

export const statusEn = {
  titles: {
    list: 'My orders',
    detail: 'Order details',
    spending: 'My spending',
  },
  status: {
    order: {
      pending_payment: 'Awaiting payment',
      confirmed: 'Confirmed',
      completed: 'Completed',
      cancelled: 'Cancelled',
    },
    suborder: {
      awaiting_payment: 'Awaiting payment',
      awaiting_seller: 'Waiting for the seller',
      preparing: 'Being prepared',
      ready: 'Ready for the courier',
      on_the_way: 'On the way',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    },
    payment: {
      pending: 'Waiting for payment',
      paid: 'Paid',
      failed: 'Failed',
      expired: 'Expired',
    },
    method: {
      mada: 'mada',
      card: 'Card',
      apple_pay: 'Apple Pay',
      none: 'Nothing to pay',
    },
    refund: {
      pending: 'In progress',
      succeeded: 'Refunded',
      failed: 'Failed',
    },
  },
  timeline: {
    title: 'Order timeline',
    reason: 'Reason: {{reason}}',
    events: {
      order_placed: 'Order placed',
      payment_confirmed: 'Payment received',
      order_confirmed: 'Order confirmed',
      preparing: 'Being prepared',
      ready: 'Ready for the courier',
      on_the_way: 'On the way to you',
      delivered: 'Delivered',
      cancelled: 'Delivery cancelled',
      eta_revised: 'Delivery time updated',
      order_completed: 'Order completed',
      order_cancelled: 'Order cancelled',
      refund_succeeded: 'Refund completed',
      refund_failed: 'Refund failed',
      late_payment_refunded: 'Late payment refunded',
      payment_failed: 'Payment failed',
      unknown: 'Order update',
    },
  },
};

export const statusAr: Translations<typeof statusEn> = {
  titles: {
    list: 'طلباتي',
    detail: 'تفاصيل الطلب',
    spending: 'مصروفاتي',
  },
  status: {
    order: {
      pending_payment: 'بانتظار الدفع',
      confirmed: 'تم التأكيد',
      completed: 'مكتمل',
      cancelled: 'ملغي',
    },
    suborder: {
      awaiting_payment: 'بانتظار الدفع',
      awaiting_seller: 'بانتظار البائع',
      preparing: 'قيد التجهيز',
      ready: 'جاهز للمندوب',
      on_the_way: 'في الطريق',
      delivered: 'تم التسليم',
      cancelled: 'ملغي',
    },
    payment: {
      pending: 'بانتظار الدفع',
      paid: 'تم الدفع',
      failed: 'فشل الدفع',
      expired: 'انتهت المهلة',
    },
    method: {
      mada: 'مدى',
      card: 'بطاقة',
      apple_pay: 'Apple Pay',
      none: 'لا يوجد مبلغ للدفع',
    },
    refund: {
      pending: 'قيد المعالجة',
      succeeded: 'تم الاسترداد',
      failed: 'فشل الاسترداد',
    },
  },
  timeline: {
    title: 'سجل الطلب',
    reason: 'السبب: {{reason}}',
    events: {
      order_placed: 'تم إنشاء الطلب',
      payment_confirmed: 'تم استلام الدفع',
      order_confirmed: 'تم تأكيد الطلب',
      preparing: 'بدأ تجهيز الطلب',
      ready: 'الطلب جاهز للمندوب',
      on_the_way: 'الطلب في الطريق إليك',
      delivered: 'تم التسليم',
      cancelled: 'أُلغي التوصيل',
      eta_revised: 'تم تعديل وقت التوصيل',
      order_completed: 'اكتمل الطلب',
      order_cancelled: 'أُلغي الطلب',
      refund_succeeded: 'اكتمل الاسترداد',
      refund_failed: 'فشل الاسترداد',
      late_payment_refunded: 'تم استرداد دفعة وصلت متأخرة',
      payment_failed: 'فشلت عملية الدفع',
      unknown: 'تحديث على الطلب',
    },
  },
};
