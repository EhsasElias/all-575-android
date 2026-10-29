import type { Translations } from '@/shared/i18n';
import type { legalEn } from './legal.en';

export const legalFr: Translations<typeof legalEn> = {
  version: 'Version {{version}}',
  versionUnavailable: 'La version actuelle n’a pas pu être chargée.',
  updated: 'Projet mis à jour : 29 octobre 2026',
  noticeTitle: 'Projet à valider avant lancement public',
  noticeMessage:
    'Ces politiques détaillées décrivent le service de test. L’identité juridique, les contacts officiels, les prestataires et les règles opérationnelles doivent être confirmés et vérifiés avant de prendre de vraies commandes.',
  outline: 'Dans cette page',
  terms: {
    title: 'Conditions d’utilisation',
    lead: 'Compte, achats, livraison et droits des clients.',
    sections: {
      operator: {
        title: 'À propos du service',
        body: 'ALL 5.75 est une place de marché livrant dans les zones desservies en Arabie saoudite. Le vendeur figure sur la fiche produit et la commande. Avant le lancement public, il faut publier l’identité juridique de l’exploitant, son immatriculation, son adresse nationale et son contact officiel. Ce projet ne désigne aucune société non confirmée comme exploitant.',
      },
      using: {
        title: 'Compte et capacité à acheter',
        body: 'Fournissez des coordonnées exactes et gardez vos codes de vérification confidentiels. Vous devez avoir la capacité juridique de conclure un achat, sinon un représentant légalement autorisé doit agir pour vous. Les acheteurs professionnels confirment leur habilitation. Le déverrouillage biométrique est facultatif après connexion vérifiée. Signalez toute utilisation non autorisée présumée.',
      },
      prices: {
        title: 'Prix, TVA et produits',
        body: 'Les prix unitaires vont de 1 à 5,75 SAR, TVA applicable comprise. Le serveur calcule les articles, remises et frais de livraison avant confirmation. Le numéro de TVA d’une entreprise ne supprime pas automatiquement la taxe. Les photos sont descriptives : vérifiez le texte, la taille, la variante et la quantité. Si le prix ou la disponibilité change avant acceptation, vérifiez le nouveau total. Les commandes confirmées conservent leurs prix enregistrés.',
      },
      orders: {
        title: 'Commandes, paiements et devis',
        body: 'Le retour depuis une page bancaire ne prouve pas un paiement : une confirmation vérifiée est nécessaire. Les moyens disponibles et le paiement à la livraison figurent à la caisse. Le paiement comptant reste en attente jusqu’à son encaissement enregistré. Ne transmettez pas de données de carte ni de codes au support. Une nouvelle tentative après interruption doit retrouver la même commande. Une demande de devis ne constitue ni vente acceptée, ni remise, ni crédit, ni obligation de paiement ; un accord distinct est nécessaire.',
      },
      delivery: {
        title: 'Adresse, livraison et réception',
        body: 'Indiquez une adresse saoudienne exacte, le téléphone du destinataire et un point accessible. Les détails fournis par la carte sont des suggestions à vérifier et compléter. La couverture et les créneaux sont vérifiés à la caisse ; plusieurs vendeurs peuvent livrer séparément. Ne communiquez le code de remise qu’à réception. Signalez les articles manquants, endommagés ou incorrects depuis la commande. En cas de retard dépassant quinze jours après la conclusion ou la date convenue, les droits de résiliation et remboursement s’appliquent conformément à la loi, sous réserve d’un autre délai valablement convenu et de la force majeure.',
      },
      returns: {
        title: 'Annulation, retours et remboursements',
        body: 'Le bouton d’annulation directe dépend de l’état de la commande ; sinon, contactez le support depuis celle-ci. Cette restriction ne supprime aucun droit légal. Lorsque les règles saoudiennes de consommation en ligne s’appliquent, un produit non utilisé peut généralement faire l’objet d’une résiliation dans les sept jours suivant sa réception, sous réserve des exceptions légales. Les frais suivent la loi sauf accord différent. Les droits liés aux défauts et à la non-conformité restent protégés. Précisez article, quantité et motif. Une demande reçue ou clôturée ne prouve pas un remboursement, suivi séparément après traitement. Annuler une commande comptant non encaissée ne crée pas de remboursement.',
      },
      conduct: {
        title: 'Avis et utilisation acceptable',
        body: 'Les avis doivent refléter une expérience réelle sans menace, contenu illicite ni données privées d’autrui. L’usurpation d’identité, les demandes abusives de codes, la manipulation des avis, stocks ou paiements et les accès non autorisés sont interdits. Une utilisation abusive peut être restreinte pour un motif justifié, sans supprimer les droits légaux ni les recours appropriés.',
      },
      rights: {
        title: 'Droits et responsabilité',
        body: 'Ces conditions ne suppriment aucun droit obligatoire de consommation, de confidentialité ou de garantie prévu par le droit saoudien applicable. Nous apportons un soin raisonnable au service et aux réclamations. La disponibilité continue n’est pas garantie ; une simulation de paiement, de livraison ou une décision du support ne prouve pas un événement réel. La responsabilité suit la loi, sans exclusion générale des conséquences d’actes illicites.',
      },
      changes: {
        title: 'Modifications et consentement',
        body: 'Les modifications importantes seront publiées avec une nouvelle version et signalées lorsque nécessaire. Une nouvelle acceptation peut être demandée avant des opérations protégées ultérieures. Le consentement marketing reste distinct et facultatif. Les changements ne modifient pas rétroactivement le prix enregistré d’une commande ni les droits acquis.',
      },
      contact: {
        title: 'Aide, réclamations et droit applicable',
        body: 'Pour une commande, utilisez son aide ou retour puis suivez les réponses dans Compte > Support et retours. Les demandes de confidentialité et de compte figurent dans Devis et demandes de compte. Le droit saoudien s’applique, sans limiter les recours auprès des tribunaux, autorités et canaux légaux compétents. Le contact officiel de l’exploitant doit être finalisé avant le lancement public.',
      },
    },
  },
  privacy: {
    title: 'Politique de confidentialité',
    lead: 'Données traitées, finalités et choix disponibles.',
    sections: {
      controller: {
        title: 'Responsable des données',
        body: 'Cette politique décrit le service de test ALL 5.75. Avant le lancement public, l’identité juridique du responsable de traitement, son adresse postale, son contact officiel de confidentialité et, si nécessaire, celui du délégué à la protection des données doivent être confirmés et publiés. Ce projet n’invente pas ces informations.',
      },
      collect: {
        title: 'Données personnelles collectées',
        body: 'Nous traitons les données fournies pour le compte et les achats : nom, email ou mobile, vérification et sessions, destinataire, adresses, coordonnées choisies, facturation professionnelle, panier, favoris, commandes, références de paiement/remboursement, avis, messages et demandes de compte. Les services techniques peuvent traiter l’adresse IP, les heures de requête, les informations de navigateur/appareil et les journaux nécessaires. N’ajoutez ni données de carte, ni codes, ni informations sensibles inutiles aux messages libres.',
      },
      use: {
        title: 'Finalités et bases juridiques',
        body: 'L’accès au compte, les commandes, paiements, assistance et sécurité sont traités pour fournir le service demandé et exécuter l’accord. Les obligations fiscales, comptables et de divulgation reposent sur la loi applicable. Le marketing facultatif et les permissions de localisation reposent sur le consentement pertinent. Tout intérêt légitime doit respecter les garanties applicables et vos droits. Accepter les conditions ne constitue pas une autorisation générale pour des usages sans rapport.',
      },
      location: {
        title: 'Localisation et cartes',
        body: 'La localisation est demandée lorsque vous choisissez de l’utiliser ; vous pouvez refuser et placer le repère manuellement. Le point choisi et la langue sont transmis via notre serveur au fournisseur configuré, actuellement Nominatim/OpenStreetMap. Ni les données du compte ni les textes du formulaire ne sont envoyés pour cette recherche. Les requêtes de tuiles cartographiques atteignent aussi le fournisseur et peuvent révéler votre IP et la zone affichée. Les suggestions peuvent être mises en cache temporairement. Ne soumettez pas de lieu confidentiel ; la saisie manuelle reste possible.',
      },
      biometry: {
        title: 'Biométrie et stockage local',
        body: 'Sur Android compatible, le système vérifie votre biométrie. L’application reçoit un résultat, sans image ni modèle d’empreinte. La session native enregistrée utilise le stockage sécurisé ; la session du navigateur reste en mémoire. Les préférences, le panier invité et l’apparence sont enregistrés sur l’appareil. La déconnexion supprime la session enregistrée. Vous pouvez désactiver le déverrouillage biométrique et gérer les permissions.',
      },
      share: {
        title: 'Partage et prestataires',
        body: 'Les données nécessaires sont partagées avec le vendeur concerné, la livraison, le paiement, l’hébergement, la sécurité et la messagerie lorsque ces services sont configurés. Le destinataire et l’adresse servent à livrer ; les prestataires de paiement traitent leurs données de transaction. Nous ne vendons pas les données personnelles. Les divulgations aux autorités ou pour des litiges nécessitent un fondement légal. Les prestataires et accords doivent être finalisés avant exploitation réelle ; une intégration de test ne prouve aucun contrat opérationnel.',
      },
      transfers: {
        title: 'Traitement hors d’Arabie saoudite',
        body: 'Les fournisseurs de cartes, d’hébergement ou autres peuvent traiter des données à l’étranger. Tout transfert doit respecter les exigences et garanties saoudiennes applicables ; un fournisseur étranger ne suffit pas à établir la conformité. Pays d’hébergement, destinataires et mécanismes de transfert doivent être confirmés avant le lancement. Nous ne prétendons pas que toutes les données restent en Arabie saoudite.',
      },
      keep: {
        title: 'Conservation et sécurité',
        body: 'Les données sont conservées selon leur finalité et les obligations fiscales, comptables, de litige et de sécurité. La durée dépend du type de dossier, de la loi, des réclamations et du compte ; sa clôture n’efface pas les documents devant légalement rester. Les données inutiles doivent être supprimées ou anonymisées, avec expiration des sauvegardes gérée par la procédure de conservation. Des contrôles d’accès et mesures techniques et organisationnelles appropriées sont nécessaires. Aucune sécurité absolue n’est garantie ; les notifications obligatoires d’incident suivent la loi.',
      },
      rights: {
        title: 'Vos droits et demandes',
        body: 'Sous réserve du droit applicable, vous pouvez demander information, accès, copie lisible, correction, complément, destruction lorsqu’elle est permise et retrait du consentement. Utilisez Compte > Devis et demandes de compte pour l’accès ou la clôture et décrivez les corrections souhaitées. Une vérification proportionnée de l’identité est effectuée. Les demandes suivent le délai légal, généralement au plus 30 jours, avec notification motivée d’une prolongation autorisée. Une demande ne supprime pas immédiatement les données ; la conservation légale peut limiter l’effacement et un refus doit avoir un motif légal. Vous pouvez saisir l’autorité compétente ; vos droits ne se limitent pas à cette interface.',
      },
      choices: {
        title: 'Marketing, permissions et mises à jour',
        body: 'Le marketing reste facultatif et modifiable dans le compte sans perdre l’accès aux achats. Les messages nécessaires aux commandes et à la sécurité sont distincts. Vous pouvez gérer langue, apparence, sessions et permissions de localisation. Le service ne vise pas les achats autonomes de personnes sans capacité juridique ; un représentant autorisé doit agir si nécessaire. Les changements importants reçoivent une nouvelle version et l’information ou le consentement approprié. Les contacts officiels et informations sur les prestataires sont requis avant lancement.',
      },
    },
  },
};
