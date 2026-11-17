import { expect, it } from 'vitest';
import { groupSlug } from './groupSlug';

it('makes a readable slug from a group name', () => {
  expect(groupSlug('Riga weekend')).toBe('riga-weekend');
  expect(groupSlug('  Riia nädalavahetus & õlu! ')).toBe('riia-nadalavahetus-olu');
});

it('is empty when nothing readable is left', () => {
  expect(groupSlug('🎉🎉')).toBe('');
});
