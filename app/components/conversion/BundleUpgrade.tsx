import type {BundleUpgradeOffer} from '~/lib/offer-engine';
import {productDimensions, useTrackOnView} from '~/lib/analytics';
import {formatMoney} from '~/lib/money';
import {useCart} from '~/components/cart/CartProvider';
import {Icon} from '~/components/ui/Icon';

/** Cart upgrade: swap tools already in the cart for the bundle that contains them. */
export function BundleUpgrade({offer}: {offer: BundleUpgradeOffer}) {
  const {add} = useCart();
  const {bundle, replaces, gains, deltaCents, gainedValueCents} = offer;
  const ref = useTrackOnView<HTMLElement>('view_bundle_upgrade', {
    ...productDimensions(bundle),
    bundle_id: bundle.factoryId,
    placement: 'cart',
  });

  return (
    <section ref={ref} className="rounded-(--radius-control) border-[1.5px] border-ink bg-highlight/60 p-3.5">
      <p className="text-[11px] font-extrabold tracking-[0.08em] uppercase">Plus avantageux</p>
      <h4 className="mt-1 leading-tight font-extrabold">
        Passez au pack {bundle.title} pour {formatMoney(deltaCents)} de plus
      </h4>
      <p className="mt-1 text-xs text-ink/75">
        Conservez {replaces.length === 1 ? 'votre outil' : `vos ${replaces.length} outils`} et obtenez {gains.length} outil(s) supplémentaires d’une valeur de{' '}
        {formatMoney(gainedValueCents)} achetés séparément :
      </p>
      <ul className="mt-2 space-y-1 text-xs">
        {gains.map((item) => (
          <li key={item.handle} className="flex items-center gap-1.5">
            <Icon name="plus" className="size-3 shrink-0 text-success" strokeWidth={3} />
            <span className="truncate">{item.title}</span>
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => add(bundle.handle, 'cart_bundle_upgrade')} className="btn-cta mt-3 w-full py-2.5 text-sm">
        Choisir le pack pour {formatMoney(deltaCents)} de plus
      </button>
    </section>
  );
}
