import {useEffect, useMemo, useState} from 'react';
import {Link} from 'react-router';
import {useCart} from '~/components/cart/CartProvider';
import {CartProgress} from '~/components/conversion/CartProgress';
import {BundleUpgrade} from '~/components/conversion/BundleUpgrade';
import {CrossSellCard} from '~/components/conversion/CrossSellCard';
import {ProductPreview} from '~/components/product/ProductPreview';
import {Icon} from '~/components/ui/Icon';
import {rankCrossSells} from '~/lib/offer-engine';
import {readInterests} from '~/lib/personalization';
import {formatMoney} from '~/lib/money';
import {track} from '~/lib/analytics';
import {UNIVERSES} from '~/lib/site';
import {useModalA11y} from '~/lib/use-modal-a11y';

/**
 * Cart drawer — the main revenue surface after the product page
 * (CONVERSION_SYSTEM.md): items, progress offer, one bundle upgrade,
 * max two cross-sells, totals and checkout.
 */
export function CartDrawer() {
  const {isOpen, close, lines, ready, busy, checkoutUrl, checkoutEnabled, index, totals, upgrade, notice, remove} = useCart();
  const [checkoutNote, setCheckoutNote] = useState(false);
  const {dialogRef, initialFocusRef} = useModalA11y<HTMLElement>(isOpen, close);

  useEffect(() => {
    if (!isOpen) setCheckoutNote(false);
  }, [isOpen]);

  const crossSells = useMemo(
    () => (isOpen ? rankCrossSells(lines, lines, index, {interests: readInterests(), limit: upgrade ? 1 : 2}) : []),
    [isOpen, lines, index, upgrade],
  );

  if (!isOpen) return null;

  const beginCheckout = () => {
    if (!checkoutEnabled || !checkoutUrl) {
      track('checkout_blocked', {item_count: lines.length, reason: 'preview'});
      setCheckoutNote(true);
      return;
    }
    track('begin_checkout', {
      value: totals.totalCents / 100,
      currency: 'EUR',
      item_count: lines.length,
    });
    window.location.assign(checkoutUrl);
  };

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="cart-title">
      <button
        type="button"
        aria-label="Fermer le panier"
        tabIndex={-1}
        onClick={close}
        className="absolute inset-0 animate-fade-in bg-ink/45"
      />
      <aside ref={dialogRef} tabIndex={-1} className="absolute inset-y-0 right-0 flex w-full max-w-[440px] animate-drawer-in flex-col bg-surface shadow-2xl">
        <header className="flex items-center justify-between border-b border-line px-4 py-3.5">
          <h2 id="cart-title" className="text-lg font-black">
            Votre panier <span className="text-muted tabular-nums">({lines.length})</span>
          </h2>
          <button ref={initialFocusRef} type="button" onClick={close} className="grid size-9 place-items-center rounded-md hover:bg-paper" aria-label="Fermer le panier">
            <Icon name="close" className="size-5" />
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {notice ? (
            <p
              role="status"
              className={`flex gap-2 rounded-md px-3 py-2 text-sm font-semibold ${notice.tone === 'success' ? 'bg-success/10 text-success' : 'bg-blue/10 text-blue'}`}
            >
              <Icon name={notice.tone === 'success' ? 'check' : 'info'} className="mt-0.5 size-4 shrink-0" />
              {notice.message}
            </p>
          ) : null}

          {!ready ? (
            <p className="text-sm text-muted">Chargement du panier…</p>
          ) : lines.length === 0 ? (
            <EmptyCart onNavigate={close} />
          ) : (
            <>
              {/* Hidden for bundle-only carts: bundles don't count toward the offer. */}
              {totals.progress && totals.progress.eligibleCount > 0 ? <CartProgress progress={totals.progress} /> : null}

              <ul className="divide-y divide-line rounded-(--radius-control) border border-line">
                {totals.items.map((item) => (
                  <li key={item.handle} className="flex gap-3 p-3">
                    <div className="w-14 shrink-0">
                      <ProductPreview product={item} size="thumb" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link to={`/products/${item.handle}`} onClick={close} className="text-sm leading-tight font-extrabold hover:underline">
                        {item.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted">
                        {item.bundleItems ? `${item.bundleItems.length} outils inclus` : item.format} · Téléchargement après paiement
                      </p>
                      <button
                        type="button"
                        onClick={() => remove(item.handle)}
                        className="mt-1 text-xs font-semibold text-muted underline underline-offset-2 hover:text-sale"
                      >
                        Retirer
                      </button>
                    </div>
                    <span className="price text-sm">{formatMoney(item.priceCents)}</span>
                  </li>
                ))}
              </ul>

              {upgrade ? <BundleUpgrade offer={upgrade} /> : null}

              {crossSells.length ? (
                <section>
                  <h3 className="mb-2 text-xs font-extrabold tracking-[0.08em] uppercase">Compléter votre panier</h3>
                  <div className="space-y-2">
                    {crossSells.map((offer) => (
                      <CrossSellCard key={offer.product.handle} offer={offer} placement="cart_cross_sell" onNavigate={close} />
                    ))}
                  </div>
                </section>
              ) : null}
            </>
          )}
        </div>

        {ready && lines.length > 0 ? (
          <footer className="border-t border-line bg-surface px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Sous-total</dt>
                <dd className="tabular-nums">{formatMoney(totals.subtotalCents)}</dd>
              </div>
              {totals.discountCents > 0 ? (
                <div className="flex justify-between font-bold text-success">
                  <dt>{totals.progress?.campaign.headline}</dt>
                  <dd className="tabular-nums">−{formatMoney(totals.discountCents)}</dd>
                </div>
              ) : null}
              <div className="flex items-baseline justify-between pt-1">
                <dt className="font-extrabold">Total</dt>
                <dd className="price text-2xl">{formatMoney(totals.totalCents)}</dd>
              </div>
            </dl>
            <button type="button" onClick={beginCheckout} disabled={busy || !ready} className="btn-cta mt-3 w-full py-3.5 text-base disabled:opacity-50">
              <Icon name="lock" /> {checkoutEnabled ? 'Paiement Shopify sécurisé' : 'Paiement en attente de validation'}
            </button>
            {checkoutNote ? (
              <p role="status" className="mt-2 rounded-md bg-highlight px-3 py-2 text-xs font-semibold">
                Paiement temporairement indisponible. Réessayez plus tard.
              </p>
            ) : null}
            <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted">
              <Icon name="download" className="size-3.5" /> Un seul paiement · fichiers livrés après paiement
            </p>
          </footer>
        ) : null}
      </aside>
    </div>
  );
}

function EmptyCart({onNavigate}: {onNavigate: () => void}) {
  return (
    <div className="py-4">
      <p className="text-lg font-extrabold">Votre panier est vide.</p>
      <p className="mt-1 text-sm text-muted">Commencez par choisir un besoin :</p>
      {UNIVERSES.map((universe) => (
        <section key={universe.id} data-universe={universe.id} className="mt-4">
          <p className="mb-2 text-xs font-extrabold tracking-[0.08em] uppercase">
            <span aria-hidden className="mr-1.5 inline-block size-2 bg-cta align-middle" />
            {universe.label}
          </p>
          <ul className="space-y-2">
            {universe.problems.map((entry) => (
              <li key={entry.collection}>
                <Link
                  to={`/collections/${entry.collection}`}
                  onClick={onNavigate}
                  className="flex items-center justify-between rounded-md border border-line px-3 py-2.5 text-sm font-bold hover:border-ink"
                >
                  {entry.label}
                  <Icon name="arrow" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <Link to="/collections/bundles" onClick={onNavigate} className="btn-ghost mt-4">
        Ou comparer tous les packs <Icon name="arrow" />
      </Link>
    </div>
  );
}
