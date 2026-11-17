const MAXIMUM_SLUG_LENGTH = 40;

/** Readable URL suffix, e.g. "Riia nädalavahetus!" becomes "riia-nadalavahetus". Empty when the name has no letters or digits. */
export function groupSlug(groupName: string): string {
  return groupName
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // accents split off by NFD
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, MAXIMUM_SLUG_LENGTH)
    .replace(/^-+|-+$/g, '');
}
