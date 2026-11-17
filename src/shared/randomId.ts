const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const DEFAULT_ID_LENGTH = 20;

/**
 * A group's ID is its only access control, so it must stay unguessable while being short enough for a link.
 * 10 characters is about 60 bits: far beyond what can be found by trying IDs against the database.
 */
export const GROUP_ID_LENGTH = 10;

export function randomId(length = DEFAULT_ID_LENGTH): string {
  // Reject bytes that would bias the alphabet (256 is not a multiple of 62).
  const largestUnbiasedByte = 256 - (256 % ALPHABET.length);
  let id = '';
  while (id.length < length) {
    const randomBytes = crypto.getRandomValues(new Uint8Array(length * 2));
    for (const byte of randomBytes) {
      if (byte < largestUnbiasedByte && id.length < length) {
        id += ALPHABET[byte % ALPHABET.length];
      }
    }
  }
  return id;
}
