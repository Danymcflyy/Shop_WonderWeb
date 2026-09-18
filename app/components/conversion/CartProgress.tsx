import type {ProgressState} from '~/lib/offer-engine';
import {useTrackOnView} from '~/lib/analytics';
import {Icon} from '~/components/ui/Icon';

/** Progress toward a real cart-threshold campaign (discount applied by Shopify). */
export function CartProgress({progress}: {progress: ProgressState}) {
  const {campaign, eligibleCount, remaining, unlocked} = progress;
  const target = campaign.thresholdQuantity;
  const percent = Math.min(100, (eligibleCount / Math.max(target, 1)) * 100);
  const ref = useTrackOnView<HTMLDivElement>('progress_offer_view', {
    campaign_id: campaign.id,
    eligible_count: eligibleCount,
  });

  return (
    <div
      ref={ref}
      className={`rounded-(--radius-control) border p-3.5 ${unlocked ? 'border-success/40 bg-success/8' : 'border-line bg-paper'}`}
    >
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <p className="font-extrabold" aria-live="polite">
          {unlocked ? (
            <span className="inline-flex items-center gap-1.5 text-success">
              <Icon name="check" /> {campaign.discountPercent}% bundle discount unlocked
            </span>
          ) : (
            <>
              Add {remaining} more {remaining === 1 ? 'tool' : 'tools'} to unlock{' '}
              <span className="marker">{campaign.discountPercent}% off</span>
            </>
          )}
        </p>
        <span className="text-xs font-bold text-muted tabular-nums">
          {Math.min(eligibleCount, target)}/{target}
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={target}
        aria-valuenow={Math.min(eligibleCount, target)}
        aria-label={campaign.headline}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${unlocked ? 'bg-success' : 'bg-cta'}`}
          style={{width: `${percent}%`}}
        />
      </div>
      <p className="mt-1.5 text-xs text-muted">
        {campaign.headline}. Bundles excluded. Applied automatically at checkout.
      </p>
    </div>
  );
}
