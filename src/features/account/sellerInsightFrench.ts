/** French interface and table labels for seller reporting. */
export const sellerInsightFrench: Record<string, string> = {
  'All orders': 'Toutes les commandes',
  'Awaiting seller': 'En attente du vendeur',
  Preparing: 'En préparation',
  Ready: 'Prêtes',
  'On the way': 'En livraison',
  'Delivered orders': 'Commandes livrées',
  'Delivered merchandise sales': 'Ventes des marchandises livrées',
  'Top selling products': 'Produits les plus vendus',
  'Branch performance': 'Performance des succursales',
  'Stock status': 'État du stock',
  Today: 'Aujourd’hui',
  '7 days': '7 jours',
  '30 days': '30 jours',
  '90 days': '90 jours',
  'Metric detail': 'Détail de l’indicateur',
  'Close details': 'Fermer les détails',
  'From date': 'Date de début',
  'To date': 'Date de fin',
  Branch: 'Succursale',
  'All assigned branches': 'Toutes les succursales autorisées',
  'Export CSV': 'Exporter en CSV',
  'Export Excel': 'Exporter en Excel',
  'Loading report…': 'Chargement du rapport…',
  'Delivered merchandise by order date': 'Marchandises livrées selon la date de commande',
  'Daily merchandise sales chart': 'Graphique quotidien des ventes de marchandises',
  'Rows shown: ': 'Lignes affichées : ',
  'No data for the selected period.': 'Aucune donnée pour la période choisie.',
  'Metric breakdown table': 'Tableau détaillé de l’indicateur',
  'Choose a valid date range.': 'Choisissez une période valide.',
  'Could not load details. Check connectivity and permissions.':
    'Impossible de charger les détails. Vérifiez la connexion et les autorisations.',
  'Export failed. Check permissions or connectivity.':
    'Échec de l’exportation. Vérifiez les autorisations ou la connexion.',
  'Grouped by the placement date of orders now delivered, not the payout date.':
    'Regroupement par date de commande des commandes livrées, et non par date de versement.',
  'Inventory is a current snapshot, not historic stock movements for the selected dates.':
    'Le stock représente l’état actuel, pas les mouvements historiques de la période choisie.',
  ' — Preview shows 200 rows; export includes up to 5000 records.':
    ' — L’aperçu montre 200 lignes ; l’exportation comprend jusqu’à 5 000 enregistrements.',
  'Amounts represent merchandise values, not net profit or payouts. Cost data is not yet available for profit calculations.':
    'Les montants représentent la valeur des marchandises, pas le bénéfice net ni les versements. Les coûts nécessaires au calcul du bénéfice ne sont pas encore disponibles.',
};

export const frenchInsightColumns: Record<string, string> = {
  Order: 'Numéro de commande',
  Date: 'Date de commande',
  Branch: 'Succursale',
  Status: 'État',
  'Subtotal SAR': 'Sous-total (SAR)',
  'Discount SAR': 'Remise (SAR)',
  'Merchandise SAR': 'Valeur des marchandises (SAR)',
  'Product ID': 'Identifiant produit',
  'Arabic name': 'Nom arabe',
  'English name': 'Nom anglais',
  Units: 'Unités vendues',
  'Branch ID': 'Identifiant succursale',
  Orders: 'Commandes',
  'Delivered merchandise SAR': 'Marchandises livrées (SAR)',
  SKU: 'SKU',
  Product: 'Produit',
  'On hand': 'Stock physique',
  Reserved: 'Réservé',
  Available: 'Disponible',
};

export const frenchInsightStatuses: Record<string, string> = {
  awaiting_seller: 'En attente du vendeur',
  preparing: 'En préparation',
  ready: 'Prête',
  on_the_way: 'En livraison',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};
