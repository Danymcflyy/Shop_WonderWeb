/** A completed checkout can leave a cart cookie that Shopify no longer accepts. */
export function hasExpiredCartId(
  userErrors: ReadonlyArray<{code?: string | null; field?: ReadonlyArray<string> | null}> | undefined,
) {
  return userErrors?.some((error) => error.code === 'INVALID' && error.field?.includes('cartId')) ?? false;
}
