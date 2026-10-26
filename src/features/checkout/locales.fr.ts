import type { Translations } from '@/shared/i18n';
import type { en } from './locales.en';

export const fr: Translations<typeof en> = {
  title: 'Paiement',
  titles: { payment: 'Paiement' },
  emptyTitle: 'Rien à payer pour le moment',
  emptyMessage: 'Ajoutez au moins un produit à votre panier avant de passer au paiement.',
  action: 'Aller au panier',
  address: {
    heading: 'Adresse de livraison',
    loading: 'Chargement de vos adresses',
    default: 'Par défaut',
    notServiceable: 'Nous ne livrons pas encore ici',
    editPin: 'Modifier le repère',
    emptyTitle: 'Ajoutez une adresse de livraison',
    emptyMessage:
      'Nous devons savoir où apporter votre commande et vérifier que nous livrons à cet endroit.',
    add: 'Ajouter une adresse',
    noneDeliverable:
      'Nous ne livrons encore à aucune de vos adresses. Modifiez un repère ou ajoutez une autre adresse.',
  },
  slots: {
    heading: 'Heure de livraison',
    needAddress: "Choisissez d'abord une adresse de livraison.",
    loading: 'Chargement des créneaux de livraison',
    none: "Aucun créneau de livraison n'est ouvert pour cette adresse pour le moment. Revenez plus tard.",
    full: 'Complet',
  },
  summary: {
    heading: 'Récapitulatif de la commande',
    needAddress: 'Choisissez une adresse de livraison pour voir votre total.',
    loading: 'Calcul du prix de votre commande',
    notServiceable:
      'Nous ne livrons pas à cette adresse, nous ne pouvons donc pas chiffrer votre commande.',
    promoNoLongerWorks: 'Le code promo ne fonctionne plus pour cette commande.',
    continueWithoutCode: 'Continuer sans le code',
    unavailable: 'Plus disponible',
    onlyLeft: 'Seulement {{units}} en stock',
    quantity: 'Quantité : {{quantity}}',
    cannotCheckout: 'Certains articles ne peuvent pas être livrés pour le moment.',
    backToCart: 'Mettre à jour votre panier',
    subtotal: 'Articles',
    discount: 'Remise',
    discountWithCode: 'Remise ({{code}})',
    delivery: 'Livraison',
    deliveryPending: 'Affichée une fois votre panier corrigé',
    free: 'Gratuite',
    freeOver: 'Livraison gratuite pour les commandes de {{amount}} ou plus',
    vat: 'TVA comprise',
    vatIncludedShort: 'TVA comprise',
    total: 'Total',
  },
  promo: {
    label: 'Code promo',
    apply: 'Appliquer',
    remove: 'Retirer',
    applied: 'Code promo {{code}} appliqué',
    errors: {
      promo_invalid: "Ce code promo n'est pas valide.",
      promo_not_started: "Ce code promo n'est pas encore actif.",
      promo_expired: 'Ce code promo a expiré.',
      promo_min_subtotal: "Votre commande doit être d'au moins {{amount}} pour utiliser ce code.",
      promo_min_subtotal_unknown: 'Votre commande est inférieure au minimum requis pour ce code.',
      promo_used_up: 'Ce code promo a été entièrement utilisé.',
      promo_already_used: 'Vous avez déjà utilisé ce code promo.',
      too_many_attempts: 'Trop de tentatives. Patientez un instant et réessayez.',
      failed: "Nous n'avons pas pu vérifier ce code. Veuillez réessayer.",
    },
  },
  quote: {
    validUntil: "Les prix sont garantis jusqu'à {{time}}",
    expired: 'Ces prix ont expiré.',
    refresh: 'Actualiser les prix',
    updating: 'Actualisation des prix',
    changed:
      'Le total est passé de {{from}} à {{to}}. Vérifiez-le, puis touchez Payer de nouveau pour confirmer.',
  },
  method: {
    heading: 'Mode de paiement',
    options: {
      mada: { name: 'mada', description: 'Carte de débit saoudienne' },
      card: { name: 'Visa ou Mastercard', description: 'Carte de crédit ou de débit' },
      apple_pay: { name: 'Apple Pay', description: 'Payez avec votre appareil Apple' },
    },
  },
  pay: {
    button: 'Payer',
    buttonWithAmount: 'Payer {{amount}}',
    secure:
      'Vous payez sur la page sécurisée de la banque. Nous ne voyons jamais les détails de votre carte.',
    blocked: {
      address: 'Choisissez une adresse de livraison pour continuer.',
      slot: 'Choisissez une heure de livraison pour continuer.',
      quote: 'En attente de votre total.',
      expired: 'Actualisez les prix pour continuer.',
      unavailable:
        'Mettez à jour votre panier pour continuer : certains articles ne sont pas disponibles.',
    },
  },
  problems: {
    backToCart: 'Retour au panier',
    chooseAnotherAddress: 'Choisir une autre adresse',
    quote_changed: {
      title: 'Le prix ou la disponibilité a changé',
      message: 'Vérifiez le nouveau total ci-dessus, puis touchez Payer de nouveau pour confirmer.',
    },
    offline: {
      title: "Nous n'avons pas eu de réponse",
      message:
        'Vérifiez votre connexion et touchez Payer de nouveau. Si votre commande est déjà passée, elle ne sera pas passée deux fois.',
    },
    failed: {
      title: "Nous n'avons pas pu passer votre commande",
      message: "Rien n'a été débité. Veuillez réessayer.",
    },
    quote_expired: {
      title: 'Vos prix ont expiré',
      message: 'Nous les avons mis à jour. Vérifiez le total, puis touchez Payer de nouveau.',
    },
    quote_not_found: {
      title: "Nous n'avons pas trouvé cette offre de prix",
      message:
        'Nous avons chiffré votre commande de nouveau. Vérifiez le total, puis touchez Payer de nouveau.',
    },
    cart_has_unavailable_items: {
      title: 'Certains articles ne sont plus disponibles',
      message: "Mettez à jour votre panier, puis revenez payer. Rien n'a été débité.",
    },
    out_of_stock: {
      title: 'Un article vient de partir',
      message: "Quelqu'un a acheté le dernier. Mettez à jour votre panier, puis revenez payer.",
    },
    slot_full: {
      title: 'Ce créneau de livraison vient de se remplir',
      message: "Choisissez un autre horaire. Rien n'a été débité.",
    },
    slot_too_soon: {
      title: 'Ce créneau de livraison est trop proche',
      message: "Choisissez un horaire plus tardif. Rien n'a été débité.",
    },
    slot_invalid: {
      title: 'Choisissez de nouveau votre heure de livraison',
      message: "Cet horaire n'est pas disponible pour cette adresse. Rien n'a été débité.",
    },
    payments_unavailable: {
      title: "Le paiement en ligne n'est pas disponible pour le moment",
      message: "Rien n'a été débité. Veuillez réessayer plus tard.",
    },
    payment_provider_error: {
      title: 'Le service de paiement ne répond pas',
      message: "Rien n'a été débité. Patientez un instant et touchez Payer de nouveau.",
    },
    cart_empty: {
      title: 'Votre panier est vide',
      message: 'Ajoutez un article avant de passer au paiement.',
    },
    address_not_serviceable: {
      title: 'Nous ne livrons pas à cette adresse',
      message: "Déplacez le repère s'il n'est pas au bon endroit, ou choisissez une autre adresse.",
    },
    address_missing: {
      title: "Cette adresse n'existe plus",
      message: 'Choisissez une autre adresse pour continuer.',
    },
    idempotency_key_reused: {
      title: 'Un problème est survenu lors de cette tentative',
      message: 'Veuillez toucher Payer de nouveau.',
    },
    checkout_conflict: {
      title: 'Nous terminons votre dernière tentative',
      message: 'Veuillez toucher Payer de nouveau dans un instant.',
    },
  },
  payment: {
    pendingTitle: 'Finalisez votre paiement',
    order: 'Commande {{number}}',
    timeLeft: 'Temps restant pour payer :',
    timeUp: 'Le temps pour payer est écoulé. Nous vérifions auprès de la banque.',
    continueHeading: 'Payer sur la page de la banque',
    continueMessage:
      'Touchez le bouton pour ouvrir la page de paiement sécurisée. Quand vous avez terminé, revenez ici : nous confirmons votre paiement auprès de la banque.',
    continue: 'Continuer vers le paiement',
    waiting: 'En attente de la confirmation de votre paiement par la banque',
    onlyServerCounts:
      "Revenir dans l'application ne confirme pas un paiement. Votre commande n'est confirmée que lorsque la banque nous indique qu'elle est payée.",
    otherMethod: 'Payer autrement',
    chooseMethod: 'Choisissez comment payer',
    tryWith: 'Payer avec {{method}}',
    failedTitle: "Le paiement n'a pas abouti",
    failedMessage: "Le paiement n'a pas été finalisé. Rien n'a été débité. Vous pouvez réessayer.",
    declinedMessage:
      "Votre carte a été refusée. Rien n'a été débité. Essayez une autre carte ou un autre mode.",
    expiredTitle: 'Le paiement a expiré',
    expiredMessage:
      "La session de paiement s'est terminée avant d'être finalisée. Rien n'a été débité.",
    closedTitle: 'Cette commande ne peut plus être payée',
    closedMessage:
      "Le temps pour payer est écoulé, les articles sont donc retournés en rayon. Rien n'a été débité. Vous pouvez commander de nouveau depuis votre panier.",
    backToCart: 'Retour au panier',
    myOrders: 'Mes commandes',
    notFoundTitle: 'Commande introuvable',
    notFoundMessage: "Nous n'avons pas trouvé cette commande dans votre compte.",
    retryErrors: {
      payments_unavailable:
        "Le paiement en ligne n'est pas disponible pour le moment. Veuillez réessayer plus tard.",
      payment_provider_error:
        'Le service de paiement ne répond pas. Patientez un instant et réessayez.',
      failed: "Nous n'avons pas pu démarrer le paiement. Vérifiez votre connexion et réessayez.",
    },
  },
};
