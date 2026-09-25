import {describe, expect, it, vi} from 'vitest';
import {action} from '../routes/cart';

function request() {
  const form = new FormData();
  form.set('cartFormInput', JSON.stringify({
    action: 'CustomFactoryReplace',
    inputs: {removeLineIds: ['old-line'], lines: [{merchandiseId: 'new-variant', quantity: 1}]},
  }));
  return new Request('https://example.test/cart', {method: 'POST', body: form});
}

function context(addLines: ReturnType<typeof vi.fn>) {
  const removeLines = vi.fn().mockResolvedValue({cart: {id: 'cart-1'}, errors: [], userErrors: [], warnings: []});
  return {cart: {addLines, removeLines, setCartId: vi.fn().mockReturnValue(new Headers())}};
}

describe('Shopify bundle replacement', () => {
  it('adds the pack before removing the products it replaces', async () => {
    const addLines = vi.fn().mockResolvedValue({cart: {id: 'cart-1'}, errors: [], userErrors: [], warnings: []});
    const shop = context(addLines);
    await action({request: request(), context: shop} as never);
    expect(addLines).toHaveBeenCalledWith([{merchandiseId: 'new-variant', quantity: 1}]);
    expect(shop.cart.removeLines).toHaveBeenCalledWith(['old-line']);
    expect(addLines.mock.invocationCallOrder[0]).toBeLessThan(shop.cart.removeLines.mock.invocationCallOrder[0]);
  });

  it('keeps the existing products when Shopify rejects the pack', async () => {
    const addLines = vi.fn().mockResolvedValue({cart: {id: 'cart-1'}, errors: [{message: 'Unavailable'}], userErrors: [], warnings: []});
    const shop = context(addLines);
    await action({request: request(), context: shop} as never);
    expect(shop.cart.removeLines).not.toHaveBeenCalled();
  });

  it('reports a failed removal after adding the pack', async () => {
    const addLines = vi.fn().mockResolvedValue({cart: {id: 'cart-1'}, errors: [], userErrors: [], warnings: []});
    const shop = context(addLines);
    shop.cart.removeLines.mockResolvedValue({cart: {id: 'cart-1'}, errors: [], userErrors: [{message: 'Could not remove'}], warnings: []});
    const response = await action({request: request(), context: shop} as never);
    expect(response.init?.status).toBe(409);
    expect(response.data.errors).toEqual([{message: 'Could not remove'}]);
  });
});
