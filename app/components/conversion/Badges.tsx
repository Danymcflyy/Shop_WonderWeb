import type {ProductSummary} from '~/lib/catalog/types';
import {getBadges, type DisplayBadge} from '~/lib/offer-engine';

const STYLES: Record<DisplayBadge, {label: string; className: string}> = {
  'best-seller': {label: 'Meilleure vente', className: 'bg-ink text-surface'},
  new: {label: 'Nouveau', className: 'bg-blue text-surface'},
  featured: {label: 'Notre sélection', className: 'bg-highlight text-ink border border-ink/15'},
};

/** Badges come from getBadges(): best-seller only with real sales data. */
export function Badges({
  product,
  now,
  extra,
}: {
  product: ProductSummary;
  now: Date;
  extra?: Array<{label: string; className: string}>;
}) {
  const badges = [...getBadges(product, now).map((b) => STYLES[b]), ...(extra ?? [])];
  if (!badges.length) return null;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {badges.map((badge) => (
        <li
          key={badge.label}
          className={`rounded-[5px] px-1.5 py-0.5 text-[11px] leading-4 font-extrabold tracking-wide uppercase ${badge.className}`}
        >
          {badge.label}
        </li>
      ))}
    </ul>
  );
}
