import type {UniverseId} from '~/lib/catalog/types';

/**
 * Store-wide merchandising config: navigation, problem selector, trust copy
 * and store policies. Everything marked OWNER TO CONFIRM is a commitment the
 * business must validate (and configure in Shopify) before launch.
 */

export const SITE = {
  name: 'WonderWeb',
  promise: 'Des outils concrets pour votre activité. Un paiement, sans abonnement.',
  currency: 'EUR',
} as const;

export type NavItem = {label: string; to: string; children?: NavItem[]};

export type ProblemEntry = {collection: string; label: string; hint: string};

/**
 * A universe is a top-level section of the store (option A): its own
 * homepage, navigation, problem selector and accent colour, sharing one
 * cart, one checkout and one design system with the others.
 */
export type UniverseConfig = {
  id: UniverseId;
  label: string;
  path: string;
  /** One-line pitch for the hub homepage and switcher. */
  pitch: string;
  audience: string;
  hero: {title: string; highlight: string};
  nav: NavItem[];
  problems: ProblemEntry[];
  bundlesPath: string;
  allPath: string;
  heroBundle: string;
  spotlightBundle?: string;
  /** Pro only: shop-by-business-type section and filters. */
  businessTypes: boolean;
};

export const UNIVERSES: UniverseConfig[] = [
  {
    id: 'pro',
    label: 'Pro',
    path: '/pro',
    pitch: 'Des outils pour indépendants, artisans et petites entreprises.',
    audience: 'Pour les indépendants, artisans et PME',
    hero: {title: 'Résolvez un problème concret aujourd’hui.', highlight: 'Un seul paiement.'},
    nav: [
      {label: 'Trouver des clients', to: '/collections/find-clients'},
      {label: 'Améliorer sa marge', to: '/collections/make-more-profit'},
      {label: 'S’organiser', to: '/collections/get-organized'},
      {label: 'Marketing', to: '/collections/marketing'},
      {label: 'Visibilité locale', to: '/collections/local-business'},
      {
        label: 'Par métier',
        to: '/collections/artisans',
        children: [
          {label: 'Artisans', to: '/collections/artisans'},
          {label: 'Indépendants', to: '/collections/freelancers'},
          {label: 'Agences', to: '/collections/agencies'},
          {label: 'E-commerce', to: '/collections/ecommerce'},
          {label: 'Commerces locaux', to: '/collections/local-shops'},
        ],
      },
      {label: 'Packs', to: '/collections/pro-bundles'},
      {label: 'Tous les outils', to: '/collections/pro-all'},
    ],
    problems: [
      {collection: 'make-more-profit', label: 'Connaître ma vraie marge', hint: 'Prix, marge et rentabilité'},
      {collection: 'find-clients', label: 'Trouver et relancer des clients', hint: 'Prospection et suivi commercial'},
      {collection: 'get-organized', label: 'Mieux organiser mon activité', hint: 'Processus, modèles et suivi'},
      {collection: 'local-business', label: 'Être trouvé près de chez moi', hint: 'Fiche Google, avis et visibilité'},
      {collection: 'marketing', label: 'Créer du contenu utile', hint: 'Calendriers et modèles de contenu'},
    ],
    bundlesPath: '/collections/pro-bundles',
    allPath: '/collections/pro-all',
    heroBundle: 'acquisition-toolkit-p12',
    businessTypes: true,
  },
];

export function getUniverse(id: string | null | undefined) {
  return UNIVERSES.find((u) => u.id === id) ?? null;
}

export const TRUST_ITEMS = [
  {icon: 'download', label: 'Fichiers numériques'},
  {icon: 'receipt', label: 'Un paiement, sans abonnement'},
  {icon: 'edit', label: 'Formats indiqués sur chaque fiche'},
  {icon: 'lock', label: 'Paiement Shopify sécurisé'},
] as const;

export const FORMAT_LABELS: Record<string, string> = {
  xlsx: 'Excel',
  sheets: 'Google Sheets',
  docx: 'Word',
  pdf: 'PDF',
  notion: 'Notion',
  canva: 'Canva',
};

/** Store-wide FAQ. Claims requiring operational verification stay out until QA. */
export const GENERAL_FAQ: Array<{q: string; a: string}> = [
  {
    q: 'Quels fichiers vais-je recevoir ?',
    a: 'La liste des fichiers et des formats figure sur chaque fiche produit.',
  },
  {
    q: 'S’agit-il d’un abonnement ?',
    a: 'Non. Chaque outil est vendu avec un paiement unique.',
  },
  {
    q: 'De quel logiciel ai-je besoin ?',
    a: 'Les formats PDF et Excel sont précisés sur chaque fiche. Vérifiez la compatibilité indiquée avant l’achat.',
  },
  {
    q: 'Où trouver les conditions d’utilisation ?',
    a: 'La licence est incluse dans l’archive de chaque produit.',
  },
];
