const euroFormat = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EUR' });

export function formatEuros(cents: number): string {
  return euroFormat.format(cents / 100);
}
