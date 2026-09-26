import {Link} from 'react-router';
import type {ProductSummary} from '~/lib/catalog/types';
import {getBundleValue, getProductBundleOffer} from '~/lib/offer-engine';
import {formatMoney} from '~/lib/money';
import {useNow} from '~/lib/use-now';
import {useCart} from '~/components/cart/CartProvider';
import {ProductPreview} from '~/components/product/ProductPreview';
import {AddToCartButton} from '~/components/conversion/AddToCartButton';
import {Badges} from '~/components/conversion/Badges';
import {Icon} from '~/components/ui/Icon';

export function ProductCard({product}: {product: ProductSummary}) {
  const {index} = useCart();
  const now = useNow();
  const isBundle = !!product.bundleItems?.length;
  const bundleValue = isBundle ? getBundleValue(product, index) : null;
  const bundleOffer = isBundle ? null : getProductBundleOffer(product, index);
  const href = `/products/${product.handle}`;

  return (
    <article className="card group flex flex-col p-3 transition-colors hover:border-ink/40">
      <Link to={href} prefetch="intent" tabIndex={-1} aria-hidden>
        <ProductPreview product={product} />
      </Link>

      <div className="mt-3 flex flex-1 flex-col px-1">
        <Badges
          product={product}
          now={now}
          extra={
            bundleValue
              ? [{label: `Économisez ${bundleValue.savingsPercent}%`, className: 'bg-sale text-surface'}]
              : undefined
          }
        />
        <h3 className="mt-2 text-[17px] leading-snug font-extrabold">
          <Link to={href} prefetch="intent" className="hover:underline">
            {product.title}
          </Link>
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-ink/70">{product.tagline}</p>
        <p className="mt-2 text-xs font-semibold text-muted">{product.format}</p>

        <div className="mt-auto pt-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <span className="price text-2xl">{formatMoney(product.priceCents)}</span>
              {bundleValue ? (
                <p className="text-xs text-muted">
                  <s>{formatMoney(bundleValue.separateCents)}</s> séparément
                </p>
              ) : (
                <p className="text-xs text-muted">Un seul paiement</p>
              )}
            </div>
            <AddToCartButton
              handle={product.handle}
              placement="card"
              className="btn-cta px-3.5 py-2 text-sm"
            >
              <Icon name="plus" /> Ajouter
            </AddToCartButton>
          </div>

          {bundleOffer ? (
            <Link
              to={`/products/${bundleOffer.bundle.handle}`}
              prefetch="intent"
              className="mt-3 flex items-center gap-1.5 rounded-md bg-highlight/70 px-2.5 py-1.5 text-xs font-semibold hover:bg-highlight"
            >
              <Icon name="layers" className="size-3.5 shrink-0" />
              <span className="truncate">
                Dans {bundleOffer.bundle.title} — économisez {bundleOffer.savingsPercent}%
              </span>
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}
