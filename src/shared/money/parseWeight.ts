import { MAXIMUM_WEIGHT } from '../limits';

export type ParsedWeight = { kind: 'valid'; weight: number } | { kind: 'invalid' };

/** Accepts "2", "1,5" and "0.5". */
export function parseWeight(text: string): ParsedWeight {
  const normalized = text.trim().replace(',', '.');
  if (!/^(\d+\.?\d*|\.\d+)$/.test(normalized)) return { kind: 'invalid' };
  const weight = parseFloat(normalized);
  return weight > 0 && weight <= MAXIMUM_WEIGHT ? { kind: 'valid', weight } : { kind: 'invalid' };
}
