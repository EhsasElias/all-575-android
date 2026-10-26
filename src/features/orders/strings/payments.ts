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

export const paymentsFr: Translations<typeof paymentsEn> = {
  shipping: {
    title: 'Détails de la livraison',
    slot: 'Créneau de livraison',
    noSlot: 'Non planifiée',
    recipient: 'Destinataire',
    phone: 'Téléphone',
    address: 'Adresse',
    notes: 'Notes pour le livreur',
    unit: 'Appartement',
    floor: 'Étage',
  },
  payments: {
    title: 'Paiement et remboursements',
    paymentsLabel: 'Paiements',
    paidOn: 'Payé le {{date}}',
    refundsTitle: 'Remboursements',
    requestedOn: 'Demandé le {{date}}',
    refundedOn: 'Remboursé le {{date}}',
    creditNote: 'Avoir {{number}}',
    reason: {
      customer_cancelled: 'Remboursement de la commande que vous avez annulée',
      late_payment: "Remboursement d'un paiement arrivé après l'expiration de la commande",
      other: 'Remboursement',
    },
    refundNote: {
      pending:
        "En attente de la confirmation de votre prestataire de paiement. Tant qu'elle n'a pas eu lieu, il n'est pas remboursé.",
      succeeded: 'Confirmé par votre prestataire de paiement.',
      failed: "Le remboursement n'a pas pu être effectué. Contactez l'assistance.",
    },
  },
  totals: {
    title: 'Récapitulatif',
    subtotal: 'Articles',
    discount: 'Remise',
    discountWithCode: 'Remise ({{code}})',
    delivery: 'Livraison',
    free: 'Gratuite',
    total: 'Total',
    vat: 'TVA incluse',
    vatIncluded: 'Tous les prix incluent la TVA.',
  },
};
