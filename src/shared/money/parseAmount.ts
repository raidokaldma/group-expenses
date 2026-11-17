import { MAXIMUM_AMOUNT_CENTS } from '../limits';

export type ParsedAmount = { kind: 'valid'; cents: number } | { kind: 'invalid' };

const INVALID: ParsedAmount = { kind: 'invalid' };

/** Accepts "12,50", "12.5" and sums like "10+2,5-1". */
export function parseAmount(text: string): ParsedAmount {
  const normalized = text.replace(/[\s€]/g, '').replace(/,/g, '.');
  if (!/^[\d.+-]+$/.test(normalized)) return INVALID;

  const terms = normalized.match(/[+-]?[^+-]+/g);
  if (!terms || terms.join('') !== normalized) return INVALID;

  let cents = 0;
  for (const term of terms) {
    const match = /^([+-]?)(\d*\.?\d*)$/.exec(term);
    if (!match || !/\d/.test(match[2])) return INVALID;
    const sign = match[1] === '-' ? -1 : 1;
    cents += sign * Math.round(parseFloat(match[2]) * 100);
  }
  return cents > 0 && cents <= MAXIMUM_AMOUNT_CENTS ? { kind: 'valid', cents } : INVALID;
}
