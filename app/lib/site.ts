/**
 * Store-wide merchandising config: navigation, problem selector, trust copy
 * and store policies. Everything marked OWNER TO CONFIRM is a commitment the
 * business must validate (and configure in Shopify) before launch.
 */

export const SITE = {
  // Placeholder brand name — OWNER TO CONFIRM.
  name: 'Toolbench',
  promise: 'Useful business tools. One payment. No subscription.',
  currency: 'EUR',
} as const;

export type NavItem = {label: string; to: string; children?: NavItem[]};

export const MAIN_NAV: NavItem[] = [
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
  {label: 'Bundles', to: '/collections/bundles'},
  {label: 'All tools', to: '/collections/all'},
];

/** Homepage problem selector: the customer's goal, in their words. */
export const PROBLEM_ENTRIES: Array<{collection: string; label: string; hint: string}> = [
  {collection: 'make-more-profit', label: 'Know my real rate and margin', hint: 'Rate, margin and cash-flow calculators'},
  {collection: 'find-clients', label: 'Win more of my quotes and leads', hint: 'Follow-up scripts and a simple pipeline'},
  {collection: 'get-organized', label: 'Stop running the business from my head', hint: 'Planners, onboarding and templates'},
  {collection: 'local-business', label: 'Get found by clients nearby', hint: 'Google profile, reviews, local SEO'},
  {collection: 'marketing', label: 'Post regularly and convert visitors', hint: 'Content calendar and page checklists'},
];

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
    q: 'Can I get a VAT invoice for my business?',
    a: 'Yes. Enter your company name and VAT number at checkout and the invoice is sent with your order.',
  },
  {
    q: 'What if a file doesn’t work?',
    a: 'Contact us within 14 days of purchase. We fix the file or refund you. Because the files are delivered instantly, we can’t refund a download that works as described.',
  },
  {
    q: 'Can my team use it?',
    a: 'Yes — one purchase covers one business and everyone who works in it. Reselling or sharing outside your business isn’t allowed.',
  },
];
