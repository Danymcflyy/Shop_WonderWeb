const formatters = new Map<string, Intl.NumberFormat>();

/** €12 for whole amounts, €12.50 otherwise. Amounts are integer cents. */
export function formatMoney(cents: number, currency = 'EUR') {
  const whole = cents % 100 === 0;
  const key = `${currency}:${whole}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency,
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: 2,
    });
    formatters.set(key, formatter);
  }
  return formatter.format(cents / 100);
}
