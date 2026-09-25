import type {UniverseId} from '~/lib/catalog/types';

/**
 * Store-wide merchandising config: navigation, problem selector, trust copy
 * and store policies. Everything marked OWNER TO CONFIRM is a commitment the
 * business must validate (and configure in Shopify) before launch.
 */

export const SITE = {
  name: 'WonderWeb',
  promise: 'Practical tools for work and life. One payment. No subscription.',
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
    pitch: 'Business tools for trades, freelancers and small businesses.',
    audience: 'For trades, freelancers & small businesses',
    hero: {title: 'Fix one business problem today.', highlight: 'Pay once.'},
    nav: [
      {label: 'Find clients', to: '/collections/find-clients'},
      {label: 'Make more profit', to: '/collections/make-more-profit'},
      {label: 'Get organized', to: '/collections/get-organized'},
      {label: 'Marketing', to: '/collections/marketing'},
      {label: 'Local business', to: '/collections/local-business'},
      {
        label: 'By business type',
        to: '/collections/artisans',
        children: [
          {label: 'Artisans & trades', to: '/collections/artisans'},
          {label: 'Freelancers', to: '/collections/freelancers'},
          {label: 'Small agencies', to: '/collections/agencies'},
          {label: 'E-commerce', to: '/collections/ecommerce'},
          {label: 'Local shops & studios', to: '/collections/local-shops'},
        ],
      },
      {label: 'Bundles', to: '/collections/pro-bundles'},
      {label: 'All Pro tools', to: '/collections/pro-all'},
    ],
    problems: [
      {collection: 'make-more-profit', label: 'Know my real rate and margin', hint: 'Rate, margin and cash-flow calculators'},
      {collection: 'find-clients', label: 'Win more of my quotes and leads', hint: 'Follow-up scripts and a simple pipeline'},
      {collection: 'get-organized', label: 'Stop running the business from my head', hint: 'Planners, onboarding and templates'},
      {collection: 'local-business', label: 'Get found by clients nearby', hint: 'Google profile, reviews, local SEO'},
      {collection: 'marketing', label: 'Post regularly and convert visitors', hint: 'Content calendar and page checklists'},
    ],
    bundlesPath: '/collections/pro-bundles',
    allPath: '/collections/pro-all',
    heroBundle: 'artisan-business-toolkit',
    spotlightBundle: 'freelance-operating-system',
    businessTypes: true,
  },
  {
    id: 'lifestyle',
    label: 'Lifestyle',
    path: '/lifestyle',
    pitch: 'Planners and trackers for your money, your home and your habits.',
    audience: 'For households, families & busy people',
    hero: {title: 'Get your home and money in order.', highlight: 'Pay once.'},
    nav: [
      {label: 'Budget & money', to: '/collections/money'},
      {label: 'Organised home', to: '/collections/home'},
      {label: 'Habits & wellbeing', to: '/collections/wellbeing'},
      {label: 'Bundles', to: '/collections/lifestyle-bundles'},
      {label: 'All Lifestyle tools', to: '/collections/lifestyle-all'},
    ],
    problems: [
      {collection: 'money', label: 'Know where my money goes', hint: 'Budget, debt and savings planners'},
      {collection: 'home', label: 'Run the house without the mental load', hint: 'Meals, chores and decluttering'},
      {collection: 'wellbeing', label: 'Build habits that actually stick', hint: 'Habit and routine trackers'},
    ],
    bundlesPath: '/collections/lifestyle-bundles',
    allPath: '/collections/lifestyle-all',
    heroBundle: 'organised-home-bundle',
    businessTypes: false,
  },
];

export function getUniverse(id: string | null | undefined) {
  return UNIVERSES.find((u) => u.id === id) ?? null;
}

export const TRUST_ITEMS = [
  {icon: 'download', label: 'Instant download'},
  {icon: 'receipt', label: 'One payment, no subscription'},
  {icon: 'edit', label: 'Editable files'},
  {icon: 'lock', label: 'Secure Shopify checkout'},
] as const;

export const FORMAT_LABELS: Record<string, string> = {
  xlsx: 'Excel',
  sheets: 'Google Sheets',
  docx: 'Word',
  pdf: 'PDF',
  notion: 'Notion',
  canva: 'Canva',
};

/** Store-wide FAQ. OWNER TO CONFIRM: delivery, invoice, licence, file-issue policy. */
export const GENERAL_FAQ: Array<{q: string; a: string}> = [
  {
    q: 'How do I get the files?',
    a: 'Right after payment you get a download link on the order confirmation page and by email. No account needed.',
  },
  {
    q: 'Is this a subscription?',
    a: 'No. You pay once and keep the files. Nothing renews.',
  },
  {
    q: 'Which software do I need?',
    a: 'Each product lists its exact formats. Most tools work in Excel or free Google Sheets; documents open in Word or Google Docs.',
  },
  {
    q: 'Can I get a VAT invoice?',
    a: 'Yes. Enter your company name and VAT number at checkout and the invoice is sent with your order.',
  },
  {
    q: 'What if a file doesn’t work?',
    a: 'Contact us within 14 days of purchase. We fix the file or refund you. Because the files are delivered instantly, we can’t refund a download that works as described.',
  },
  {
    q: 'Can my team or family use it?',
    a: 'Yes — one purchase covers one business or one household. Reselling or sharing outside it isn’t allowed.',
  },
];
