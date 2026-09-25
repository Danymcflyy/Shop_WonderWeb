import {useEffect} from 'react';
import {Link, data, type HeadersFunction} from 'react-router';
import type {Route} from './+types/cart';
import type {CartQueryDataReturn} from '@shopify/hydrogen';
import {CartForm} from '@shopify/hydrogen';
import {useCart} from '~/components/cart/CartProvider';
import {SITE} from '~/lib/site';

export const meta: Route.MetaFunction = () => {
  return [{title: `Cart | ${SITE.name}`}];
};

export const headers: HeadersFunction = ({actionHeaders}) => actionHeaders;

export async function action({request, context}: Route.ActionArgs) {
  const {cart} = context;

  const formData = await request.formData();

  const {action, inputs} = CartForm.getFormInput(formData);

  if (!action) {
    throw new Error('No action provided');
  }

  let status = 200;
  let result: CartQueryDataReturn;

  switch (action) {
    case CartForm.ACTIONS.LinesAdd:
      result = await cart.addLines(inputs.lines);
      break;
    case 'CustomFactoryReplace': {
      const removeLineIds = inputs.removeLineIds as string[];
      const addLines = inputs.lines as Array<{merchandiseId: string; quantity: number}>;
      if (!Array.isArray(removeLineIds) || !Array.isArray(addLines) || addLines.length !== 1) {
        throw new Response('Invalid cart replacement', {status: 400});
      }
      if (removeLineIds.length) {
        const removed = await cart.removeLines(removeLineIds);
        if (removed.errors?.length || removed.userErrors?.length) {
          return data({cart: removed.cart, errors: removed.errors ?? removed.userErrors, warnings: removed.warnings}, {status: 409});
        }
      }
      result = await cart.addLines(addLines);
      break;
    }
    case CartForm.ACTIONS.LinesUpdate:
      result = await cart.updateLines(inputs.lines);
      break;
    case CartForm.ACTIONS.LinesRemove:
      result = await cart.removeLines(inputs.lineIds);
      break;
    case CartForm.ACTIONS.DiscountCodesUpdate: {
      const formDiscountCode = inputs.discountCode;

      // User inputted discount code
      const discountCodes = (
        formDiscountCode ? [formDiscountCode] : []
      ) as string[];

      // Combine discount codes already applied on cart
      discountCodes.push(...inputs.discountCodes);

      result = await cart.updateDiscountCodes(discountCodes);
      break;
    }
    case CartForm.ACTIONS.GiftCardCodesAdd: {
      const formGiftCardCode = inputs.giftCardCode;

      const giftCardCodes = (
        formGiftCardCode ? [formGiftCardCode] : []
      ) as string[];

      result = await cart.addGiftCardCodes(giftCardCodes);
      break;
    }
    case CartForm.ACTIONS.GiftCardCodesRemove: {
      const appliedGiftCardIds = inputs.giftCardCodes as string[];
      result = await cart.removeGiftCardCodes(appliedGiftCardIds);
      break;
    }
    case CartForm.ACTIONS.BuyerIdentityUpdate: {
      result = await cart.updateBuyerIdentity({
        ...inputs.buyerIdentity,
      });
      break;
    }
    default:
      throw new Error(`${action} cart action is not defined`);
  }

  const cartId = result?.cart?.id;
  const headers = cartId ? cart.setCartId(result.cart.id) : new Headers();
  const {cart: cartResult, errors, warnings} = result;

  const redirectTo = formData.get('redirectTo') ?? null;
  if (typeof redirectTo === 'string') {
    status = 303;
    headers.set('Location', redirectTo);
  }

  return data(
    {
      cart: cartResult,
      errors,
      warnings,
      analytics: {
        cartId,
      },
    },
    {status, headers},
  );
}

export async function loader({context}: Route.LoaderArgs) {
  const {cart} = context;
  return await cart.get();
}

/**
 * The action above is the skeleton's Shopify cart API, kept for when products
 * come from Shopify. While the catalogue is mock data, the cart is the
 * client-side drawer, so /cart simply opens it.
 */
export default function Cart() {
  const {open, lines, ready} = useCart();
  useEffect(() => {
    if (ready) open('cart_page');
  }, [ready, open]);

  return (
    <div className="container-page py-16">
      <h1 className="h-section">Your cart</h1>
      <p className="mt-2 text-ink/70">
        {ready ? `${lines.length} ${lines.length === 1 ? 'item' : 'items'} in your cart.` : 'Loading…'}
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={() => open('cart_page')} className="btn-cta">Open cart</button>
        <Link to="/collections/all" className="btn-secondary">Continue shopping</Link>
      </div>
    </div>
  );
}
