import {describe, expect, it} from 'vitest';
import {formatMoney} from './money';

describe('formatMoney', () => {
  it('affiche les centimes et le symbole euro au format français', () => {
    expect(formatMoney(490)).toMatch(/^4,90\s€$/u);
    expect(formatMoney(1200)).toMatch(/^12\s€$/u);
  });
});
