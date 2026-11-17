import type { LedgerEntry } from '../../shared/types';

/** Latest day first; within a day, the most recently added first. */
export function newestFirst<Entry extends LedgerEntry>(entries: Entry[]): Entry[] {
  return [...entries].sort((a, b) => b.date.localeCompare(a.date) || b.createdAtMillis - a.createdAtMillis);
}
