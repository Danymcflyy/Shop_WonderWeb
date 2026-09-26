import {describe, expect, it} from 'vitest';
import {hasExpiredCartId} from './cart-errors';

describe('hasExpiredCartId', () => {
  it('repère un identifiant de panier expiré sans dépendre de la langue du message Shopify', () => {
    expect(hasExpiredCartId([{code: 'INVALID', field: ['cartId']}])).toBe(true);
    expect(hasExpiredCartId([{code: 'INVALID', field: ['lines']}])).toBe(false);
    expect(hasExpiredCartId([{code: 'MERCHANDISE_NOT_AVAILABLE', field: ['cartId']}])).toBe(false);
  });
});
