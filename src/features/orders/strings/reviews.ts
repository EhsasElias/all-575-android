import type { Translations } from '@/shared/i18n';

export const reviewsEn = {
  reviews: {
    ratingLegend: 'Rate {{item}}',
    starLabel: 'Rate {{rating}} out of {{max}}',
    rated: 'Rated {{rating}} out of {{max}}',
    commentLabel: 'Comment (optional)',
    commentHint: 'Up to {{max}} characters.',
    submit: 'Send review',
    save: 'Save changes',
    cancel: 'Cancel',
    edit: 'Edit review',
    editUntil: 'You can edit this review until {{date}} ({{left}}).',
    editClosed: 'The time to edit this review has passed.',
    exists: 'You already reviewed this item. Thank you!',
    seeOnProduct: 'See it on the product page',
    errors: {
      ratingRequired: 'Choose a rating from 1 to 5 stars.',
      notAllowed: 'You can review an item only after it is delivered.',
      windowClosed: 'The time to edit this review has passed.',
      invalid: 'Check your rating and comment, then try again.',
      failed: 'We could not save your review. Check your connection and try again.',
    },
  },
};

export const reviewsAr: Translations<typeof reviewsEn> = {
  reviews: {
    ratingLegend: 'قيّم {{item}}',
    starLabel: 'التقييم {{rating}} من {{max}}',
    rated: 'التقييم {{rating}} من {{max}}',
    commentLabel: 'تعليق (اختياري)',
    commentHint: 'بحد أقصى {{max}} حرف.',
    submit: 'إرسال التقييم',
    save: 'حفظ التعديلات',
    cancel: 'إلغاء',
    edit: 'تعديل التقييم',
    editUntil: 'يمكنك تعديل هذا التقييم حتى {{date}} ({{left}}).',
    editClosed: 'انتهت مهلة تعديل هذا التقييم.',
    exists: 'سبق أن قيّمت هذا المنتج. شكرًا لك!',
    seeOnProduct: 'عرضه في صفحة المنتج',
    errors: {
      ratingRequired: 'اختر تقييمًا من 1 إلى 5 نجوم.',
      notAllowed: 'يمكنك تقييم المنتج بعد تسليمه فقط.',
      windowClosed: 'انتهت مهلة تعديل هذا التقييم.',
      invalid: 'تحقق من التقييم والتعليق ثم حاول مرة أخرى.',
      failed: 'تعذّر حفظ تقييمك. تحقق من اتصالك وحاول مرة أخرى.',
    },
  },
};

export const reviewsFr: Translations<typeof reviewsEn> = {
  reviews: {
    ratingLegend: 'Noter {{item}}',
    starLabel: 'Note de {{rating}} sur {{max}}',
    rated: 'Noté {{rating}} sur {{max}}',
    commentLabel: 'Commentaire (facultatif)',
    commentHint: '{{max}} caractères maximum.',
    submit: "Envoyer l'avis",
    save: 'Enregistrer les modifications',
    cancel: 'Annuler',
    edit: "Modifier l'avis",
    editUntil: "Vous pouvez modifier cet avis jusqu'au {{date}} ({{left}}).",
    editClosed: 'Le délai pour modifier cet avis est dépassé.',
    exists: 'Vous avez déjà donné votre avis sur cet article. Merci !',
    seeOnProduct: 'Le voir sur la page du produit',
    errors: {
      ratingRequired: 'Choisissez une note de 1 à 5 étoiles.',
      notAllowed: "Vous ne pouvez donner votre avis sur un article qu'après sa livraison.",
      windowClosed: 'Le délai pour modifier cet avis est dépassé.',
      invalid: 'Vérifiez votre note et votre commentaire, puis réessayez.',
      failed: "Impossible d'enregistrer votre avis. Vérifiez votre connexion et réessayez.",
    },
  },
};
