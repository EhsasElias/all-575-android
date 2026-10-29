import type { Translations } from '@/shared/i18n';
import type { en } from './locales.en';

export const fr: Translations<typeof en> = {
  titles: {
    list: 'Mes adresses',
    new: 'Nouvelle adresse',
    edit: "Modifier l'adresse",
  },
  list: {
    heading: 'Mes adresses',
    intro: "Où devons-nous livrer ? Vous pouvez enregistrer jusqu'à {{max}} adresses.",
    loading: 'Chargement de vos adresses',
    add: 'Ajouter une adresse',
    limitReached:
      'Vous avez enregistré {{max}} adresses, le maximum possible. Supprimez-en une pour en ajouter une autre.',
    default: 'Par défaut',
    deliverable: 'Nous livrons ici',
    notDeliverable: 'Nous ne livrons pas encore ici',
    notDeliverableHelp:
      "Vous ne pouvez pas commander vers cette adresse pour le moment. Si le repère n'est pas au bon endroit, modifiez-le.",
    setDefault: 'Définir par défaut',
    setDefaultNamed: 'Définir {{name}} par défaut',
    edit: 'Modifier',
    editNamed: 'Modifier {{name}}',
    delete: 'Supprimer',
    deleteNamed: 'Supprimer {{name}}',
    empty: {
      title: 'Aucune adresse enregistrée',
      message:
        'Ajoutez une adresse de livraison pour que nous vérifiions que nous livrons chez vous.',
      action: 'Ajouter votre première adresse',
    },
    toast: {
      defaultSet: '{{name}} est maintenant votre adresse par défaut.',
      deleted: 'Adresse supprimée.',
      failed: "Nous n'avons pas pu faire cela. Veuillez réessayer.",
    },
    deleteSheet: {
      title: 'Supprimer cette adresse ?',
      message:
        '{{name}} sera retirée de vos adresses enregistrées. Les commandes déjà passées ne sont pas concernées.',
      confirm: "Supprimer l'adresse",
      cancel: 'La garder',
    },
  },
  card: {
    building: 'Bâtiment {{building}}, no complémentaire {{additional}}',
    postal: 'Code postal {{code}}',
    shortAddress: 'Adresse courte {{code}}',
  },
  form: {
    country: 'Pays',
    countryValue: 'Arabie saoudite',
    sections: {
      recipient: 'Qui recevra la commande ?',
      address: 'Adresse nationale',
    },
    fields: {
      label: "Nom de l'adresse (facultatif)",
      labelHint: 'Par exemple Maison ou Travail',
      recipientName: 'Nom du destinataire',
      recipientPhone: 'Numéro de mobile du destinataire',
      recipientPhoneHint: 'Par exemple 0512345678',
      region: 'Région',
      city: 'Ville',
      district: 'Quartier',
      street: 'Rue',
      buildingNumber: 'Numéro du bâtiment',
      buildingNumberHint: '4 chiffres',
      additionalNumber: 'Numéro complémentaire',
      additionalNumberHint: '4 chiffres',
      postalCode: 'Code postal',
      postalCodeHint: '5 chiffres',
      shortAddress: 'Adresse courte (facultatif)',
      shortAddressHint: '4 lettres et 4 chiffres, comme RRRD2929',
      unit: 'Appartement (facultatif)',
      floor: 'Étage (facultatif)',
      deliveryNotes: 'Notes pour le livreur (facultatif)',
      deliveryNotesHint: 'Par exemple la porte bleue, ou appelez à votre arrivée',
    },
    makeDefault: 'Faire de cette adresse mon adresse par défaut',
    pin: {
      lookup: {
        loading: 'Recherche des détails de l’adresse…',
        filled:
          'Les détails disponibles ont été renseignés. Vérifiez-les et complétez les champs manquants, dont le numéro supplémentaire.',
        empty:
          'Aucune adresse trouvée ici. Saisissez les détails ou choisissez un autre emplacement.',
        outside:
          'Choisissez un emplacement en Arabie saoudite. Les détails n’ont pas été renseignés.',
        failed: 'Impossible de trouver les détails de l’adresse. Saisissez-les ou réessayez.',
        retry: 'Réessayer la recherche d’adresse',
      },
      heading: 'Placez votre position',
      help: "Touchez la carte ou faites glisser le repère jusqu'à votre porte. Le repère est obligatoire pour que le livreur vous trouve.",
      useMyLocation: 'Utiliser ma position actuelle',
      found:
        "Nous avons placé le repère sur votre position actuelle. Faites-le glisser pour l'ajuster.",
      denied:
        "Nous n'avons pas reçu l'autorisation d'utiliser votre position. Autorisez-la dans les réglages de votre appareil, ou placez le repère sur la carte.",
      unavailable:
        "Nous n'avons pas pu trouver votre position pour le moment. Placez plutôt le repère sur la carte.",
      isSet: 'Le repère est placé sur la carte.',
      notSet: 'Pas encore de repère.',
      deliverable: 'Nous livrons dans cette zone.',
      notDeliverable:
        "Nous ne livrons pas encore dans cette zone. Vous pouvez tout de même enregistrer l'adresse.",
      mapLabel: 'Carte pour choisir le lieu de livraison',
      pinLabel: 'Repère du lieu de livraison',
      zoomIn: 'Zoom avant',
      zoomOut: 'Zoom arrière',
      placeAtCenter: 'Placer le repère au milieu de la carte',
      mapFailed:
        "La carte n'a pas pu se charger. Vérifiez votre connexion et rechargez la page, ou utilisez votre position actuelle.",
      mapLoading: 'Chargement de la carte',
    },
    errors: {
      summary: 'Vérifiez les champs signalés par une erreur, puis réessayez.',
      required: 'Ce champ est obligatoire',
      tooLong: 'Utilisez au plus {{max}} caractères',
      other: 'Vérifiez ce champ',
      pin: 'Placez le repère sur la carte',
      format: {
        recipientPhone: 'Saisissez un numéro de mobile saoudien valide, comme 0512345678',
        buildingNumber: 'Le numéro du bâtiment compte 4 chiffres',
        additionalNumber: 'Le numéro complémentaire compte 4 chiffres',
        postalCode: 'Le code postal compte 5 chiffres',
        shortAddress: "L'adresse courte compte 4 lettres puis 4 chiffres, comme RRRD2929",
      },
    },
    submit: { create: "Enregistrer l'adresse", update: 'Enregistrer les modifications' },
    limitReached:
      "Vous pouvez enregistrer jusqu'à {{max}} adresses. Supprimez-en une de votre liste d'abord.",
    failed: "Nous n'avons pas pu enregistrer l'adresse. Vérifiez votre connexion et réessayez.",
    notFound: {
      title: 'Adresse introuvable',
      message: 'Cette adresse a peut-être été supprimée.',
      action: 'Retour à mes adresses',
    },
  },
  saved: {
    titleNew: 'Adresse enregistrée',
    titleEdit: 'Adresse mise à jour',
    deliverable: "Nous livrons à cette adresse. Vous pouvez l'utiliser lors du paiement.",
    notDeliverableTitle: 'Enregistrée, mais nous ne livrons pas encore ici',
    notDeliverable:
      "Cette adresse est en dehors des zones que nous desservons, vous ne pouvez donc pas l'utiliser pour une commande. Si le repère n'est pas au bon endroit, déplacez-le et enregistrez de nouveau, ou choisissez une autre adresse.",
    back: 'Retour à mes adresses',
    continue: 'Continuer',
    editPin: 'Modifier le repère',
    chooseAnother: 'Choisir une autre adresse',
  },
};
