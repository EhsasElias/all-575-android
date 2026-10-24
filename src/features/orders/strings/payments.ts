import type { Translations } from '@/shared/i18n';

export const paymentsEn = {
  shipping: {
    title: 'Delivery details',
    slot: 'Delivery slot',
    noSlot: 'Not scheduled',
    recipient: 'Recipient',
    phone: 'Phone',
    address: 'Address',
    notes: 'Notes for the courier',
    unit: 'Unit',
    floor: 'Floor',
  },
  payments: {
    title: 'Payment and refunds',
    paymentsLabel: 'Payments',
    paidOn: 'Paid on {{date}}',
    refundsTitle: 'Refunds',
    requestedOn: 'Requested on {{date}}',
    refundedOn: 'Refunded on {{date}}',
    creditNote: 'Credit note {{number}}',
    reason: {
      customer_cancelled: 'Refund for the order you cancelled',
      late_payment: 'Refund of a payment that arrived after the order expired',
      other: 'Refund',
    },
    refundNote: {
      pending: 'Waiting for your payment provider to confirm. It is not refunded until it does.',
      succeeded: 'Confirmed by your payment provider.',
      failed: 'The refund could not be completed. Contact support.',
    },
  },
  totals: {
    title: 'Summary',
    subtotal: 'Items',
    discount: 'Discount',
    discountWithCode: 'Discount ({{code}})',
    delivery: 'Delivery',
    free: 'Free',
    total: 'Total',
    vat: 'VAT included',
    vatIncluded: 'All prices include VAT.',
  },
};

export const paymentsAr: Translations<typeof paymentsEn> = {
  shipping: {
    title: 'تفاصيل التوصيل',
    slot: 'موعد التوصيل',
    noSlot: 'غير محدد',
    recipient: 'المستلم',
    phone: 'الجوال',
    address: 'العنوان',
    notes: 'ملاحظات للمندوب',
    unit: 'وحدة',
    floor: 'الطابق',
  },
  payments: {
    title: 'الدفع والاسترداد',
    paymentsLabel: 'عمليات الدفع',
    paidOn: 'تم الدفع في {{date}}',
    refundsTitle: 'المبالغ المستردة',
    requestedOn: 'طُلب في {{date}}',
    refundedOn: 'تم الاسترداد في {{date}}',
    creditNote: 'إشعار دائن {{number}}',
    reason: {
      customer_cancelled: 'استرداد لطلب ألغيته',
      late_payment: 'استرداد لدفعة وصلت بعد انتهاء مهلة الطلب',
      other: 'استرداد',
    },
    refundNote: {
      pending: 'بانتظار تأكيد مزوّد الدفع. لا يُعدّ مستردًا قبل تأكيده.',
      succeeded: 'أكّده مزوّد الدفع.',
      failed: 'تعذّر إتمام الاسترداد. تواصل مع الدعم.',
    },
  },
  totals: {
    title: 'الملخص',
    subtotal: 'المنتجات',
    discount: 'الخصم',
    discountWithCode: 'الخصم ({{code}})',
    delivery: 'التوصيل',
    free: 'مجاني',
    total: 'الإجمالي',
    vat: 'ضريبة القيمة المضافة المضمّنة',
    vatIncluded: 'جميع الأسعار شاملة ضريبة القيمة المضافة.',
  },
};
