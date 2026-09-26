import {useEffect, useState, type RefObject} from 'react';
import {formatMoney} from '~/lib/money';
import {AddToCartButton} from '~/components/conversion/AddToCartButton';

/**
 * Appears once the main purchase box scrolls out of view, and hides again
 * near the final CTA so it never duplicates a visible button or covers content.
 */
export function StickyPurchaseBar({
  handle,
  title,
  priceCents,
  watchRef,
  hideNearRef,
}: {
  handle: string;
  title: string;
  priceCents: number;
  watchRef: RefObject<HTMLElement | null>;
  hideNearRef?: RefObject<HTMLElement | null>;
}) {
  const [heroVisible, setHeroVisible] = useState(true);
  const [finalVisible, setFinalVisible] = useState(false);

  useEffect(() => {
    const hero = watchRef.current;
    const final = hideNearRef?.current;
    if (!hero || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === hero) setHeroVisible(entry.isIntersecting);
        if (entry.target === final) setFinalVisible(entry.isIntersecting);
      }
    });
    observer.observe(hero);
    if (final) observer.observe(final);
    return () => observer.disconnect();
  }, [watchRef, hideNearRef]);

  const visible = !heroVisible && !finalVisible;

  return (
    <>
      {/* Spacer so the bar never covers the end of the page. */}
      <div aria-hidden className="h-20" />
      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/97 shadow-[0_-8px_30px_rgba(17,17,17,0.10)] transition-[transform,visibility] duration-200 ${visible ? 'visible translate-y-0' : 'invisible translate-y-full'}`}
        aria-hidden={!visible}
      >
        <div className="container-page flex items-center gap-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{title}</p>
            <p className="text-xs text-muted">
              <span className="price text-base text-ink">{formatMoney(priceCents)}</span> · Téléchargement après paiement
            </p>
          </div>
          <AddToCartButton handle={handle} placement="pdp_sticky" className="btn-cta shrink-0 px-5 py-2.5 text-sm">
            Ajouter au panier
          </AddToCartButton>
        </div>
      </div>
    </>
  );
}
