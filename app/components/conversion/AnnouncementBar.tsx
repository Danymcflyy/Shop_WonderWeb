import {Link} from 'react-router';
import type {Campaign} from '~/lib/catalog/types';
import {useTrackOnView} from '~/lib/analytics';
import {Icon} from '~/components/ui/Icon';
import {RealCountdown} from '~/components/conversion/RealCountdown';
import {SITE} from '~/lib/site';

/** Shows the live campaign only; falls back to the store promise. */
export function AnnouncementBar({campaign}: {campaign: Campaign | null}) {
  const ref = useTrackOnView<HTMLDivElement>('view_promo', {campaign_id: campaign?.id}, !!campaign);

  return (
    <div ref={ref} className="bg-ink text-surface">
      <div className="container-page flex min-h-10 flex-wrap items-center justify-center gap-x-4 gap-y-1 py-2 text-center text-[13px]">
        {campaign ? (
          <>
            <Link to="/collections/all" className="inline-flex items-center gap-1.5 font-bold hover:underline">
              <Icon name="tag" className="size-3.5 text-cta" />
              {campaign.headline} — applied automatically at checkout
            </Link>
            {campaign.endsAt ? <RealCountdown endsAt={campaign.endsAt} /> : null}
          </>
        ) : (
          <span className="font-bold">{SITE.promise}</span>
        )}
        <span className="hidden items-center gap-1.5 text-surface/70 md:inline-flex">
          <Icon name="download" className="size-3.5" /> Instant download
        </span>
      </div>
    </div>
  );
}
