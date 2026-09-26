import {formatMoney} from '~/lib/money';

/**
 * Price with an optional anchor. The anchor must be a real reference: for
 * bundles, the sum of the included tools' current standalone prices. Never
 * pass an invented "was" price.
 */
export function PriceAnchor({
  priceCents,
  separateCents,
  savingsCents,
  size = 'lg',
}: {
  priceCents: number;
  separateCents?: number;
  savingsCents?: number;
  size?: 'sm' | 'lg';
}) {
  const hasAnchor = !!separateCents && !!savingsCents && savingsCents > 0;
  return (
    <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
      <span className={`price ${size === 'lg' ? 'text-[36px] leading-none' : 'text-xl'}`}>
        {formatMoney(priceCents)}
      </span>
      {hasAnchor ? (
        <>
          <span className="text-sm text-muted">
            <s className="tabular-nums">{formatMoney(separateCents)}</s> achetés séparément
          </span>
          <span className="rounded-[5px] bg-sale px-1.5 py-0.5 text-xs font-extrabold text-surface tabular-nums">
            Économisez {formatMoney(savingsCents)}
          </span>
        </>
      ) : null}
    </div>
  );
}
