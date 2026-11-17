import { onSnapshot } from 'firebase/firestore';
import type { ActivityDraft, LedgerEntry } from '../shared/types';
import { addActivity, startBatch, touchGroup } from './groupBatch';
import { ledgerEntryFromDocument, ledgerEntryToDocument } from './mapping';
import { ledgerCollection, ledgerEntryReference } from './references';

export type LedgerSnapshot = {
  ledger: LedgerEntry[];
  /** Entries changed on this device that the server hasn't received yet. */
  unsyncedEntryIds: Set<string>;
};

export function subscribeToLedger(groupId: string, onLedger: (snapshot: LedgerSnapshot) => void): () => void {
  return onSnapshot(
    ledgerCollection(groupId),
    // Needed to hear when a queued change has reached the server.
    { includeMetadataChanges: true },
    (snapshot) =>
      onLedger({
        ledger: snapshot.docs.map((document) => ledgerEntryFromDocument(document.id, document.data())),
        unsyncedEntryIds: new Set(
          snapshot.docs.filter((document) => document.metadata.hasPendingWrites).map((document) => document.id),
        ),
      }),
    // The group subscription already reports connection and access failures.
    () => {},
  );
}

export async function saveLedgerEntry(groupId: string, entry: LedgerEntry, activity: ActivityDraft): Promise<void> {
  const batch = startBatch();
  batch.set(ledgerEntryReference(groupId, entry.id), ledgerEntryToDocument(entry));
  touchGroup(batch, groupId);
  addActivity(batch, groupId, activity);
  await batch.commit();
}

export async function deleteLedgerEntry(groupId: string, entryId: string, activity: ActivityDraft): Promise<void> {
  const batch = startBatch();
  batch.delete(ledgerEntryReference(groupId, entryId));
  touchGroup(batch, groupId);
  addActivity(batch, groupId, activity);
  await batch.commit();
}
