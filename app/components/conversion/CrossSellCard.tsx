import {Link} from 'react-router';
import type {CrossSellOffer} from '~/lib/offer-engine';
import {productDimensions, useTrackOnView} from '~/lib/analytics';
import {formatMoney} from '~/lib/money';
import {ProductPreview} from '~/components/product/ProductPreview';
import {AddToCartButton} from '~/components/conversion/AddToCartButton';
import type {AddPlacement} from '~/components/cart/CartProvider';

export function CrossSellCard({
  offer,
  placement,
  onNavigate,
}: {
  offer: CrossSellOffer;
  placement: AddPlacement;
  onNavigate?: () => void;
}) {
  const {product, reason} = offer;
  const ref = useTrackOnView<HTMLElement>('view_cross_sell', {...productDimensions(product), placement});

  return (
    <article ref={ref} className="flex gap-3 rounded-(--radius-control) border border-line bg-surface p-3">
      <Link to={`/products/${product.handle}`} onClick={onNavigate} className="w-16 shrink-0" tabIndex={-1} aria-hidden>
        <ProductPreview product={product} size="thumb" />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm leading-tight font-extrabold">
            <Link to={`/products/${product.handle}`} onClick={onNavigate} className="hover:underline">
              {product.title}
            </Link>
          </h4>
          <span className="price shrink-0 text-sm">{formatMoney(product.priceCents)}</span>
        </div>
        <p className="mt-1 text-xs text-ink/70">{reason}</p>
        <AddToCartButton handle={product.handle} placement={placement} className="btn-secondary mt-2 px-3 py-1.5 text-xs">
          + Ajouter
        </AddToCartButton>
      </div>
    </article>
  );
}
