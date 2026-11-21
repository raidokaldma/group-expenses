import type { LedgerEntry, Member } from './types';

/**
 * Removing a member only deletes the member, so entries can still name someone who is gone. This is
 * where they stop counting: what that member paid or received drops out, and expenses they shared
 * are split among the remaining participants.
 */
export function ledgerOfMembers(ledger: LedgerEntry[], members: Member[]): LedgerEntry[] {
  const memberIds = new Set(members.map((member) => member.id));
  const entries: LedgerEntry[] = [];
  for (const entry of ledger) {
    if (entry.kind === 'payment') {
      if (memberIds.has(entry.fromId) && memberIds.has(entry.toId)) entries.push(entry);
      continue;
    }
    const participantIds = entry.participantIds.filter((participantId) => memberIds.has(participantId));
    if (!memberIds.has(entry.payerId) || participantIds.length === 0) continue;
    if (participantIds.length === entry.participantIds.length) {
      entries.push(entry);
      continue;
    }
    const weightByParticipantId = Object.fromEntries(
      participantIds.map((participantId) => [participantId, entry.weightByParticipantId[participantId]]),
    );
    entries.push({ ...entry, participantIds, weightByParticipantId });
  }
  return entries;
}
