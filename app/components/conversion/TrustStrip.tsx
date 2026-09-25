import {Icon} from '~/components/ui/Icon';
import {TRUST_ITEMS} from '~/lib/site';
import {useCart} from '~/components/cart/CartProvider';

export function TrustStrip({compact = false}: {compact?: boolean}) {
  const {checkoutEnabled} = useCart();
  return (
    <ul
      className={
        compact
          ? 'flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] font-semibold text-ink/80'
          : 'grid grid-cols-2 gap-x-4 gap-y-2 text-sm font-semibold sm:grid-cols-4'
      }
    >
      {TRUST_ITEMS.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <Icon name={item.icon} className="size-4 shrink-0 text-success" />
          {!checkoutEnabled && item.label === 'Paiement Shopify sécurisé'
            ? 'Paiement en cours de configuration'
            : item.label}
        </li>
      ))}
    </ul>
  );
}
