import type {ReactNode} from 'react';
import {Icon} from '~/components/ui/Icon';
import {useCart, useCartStatus, type AddPlacement} from '~/components/cart/CartProvider';

/**
 * Cart-aware purchase button. Never lets a customer pay twice for the same
 * file: a tool in the cart, or covered by a bundle in the cart, shows its
 * state instead of adding again.
 */
export function AddToCartButton({
  handle,
  placement,
  children = 'Ajouter au panier',
  className = 'btn-cta',
}: {
  handle: string;
  placement: AddPlacement;
  children?: ReactNode;
  className?: string;
}) {
  const {add, open, ready, busy} = useCart();
  const status = useCartStatus(handle);

  if (status !== 'available') {
    return (
      <button
        type="button"
        onClick={() => open(`${placement}_in_cart`)}
        className={`${className.replace('btn-cta', 'btn-secondary')} border-success text-success hover:bg-success/10 hover:text-success`}
      >
        <Icon name="check" />
        {status === 'in-cart' ? 'Dans votre panier' : 'Inclus dans votre pack'}
      </button>
    );
  }

  return (
    <button type="button" onClick={() => add(handle, placement)} disabled={!ready || busy} className={`${className} disabled:opacity-50`}>
      {busy ? 'Ajout en cours…' : children}
    </button>
  );
}
