import { doc, serverTimestamp, writeBatch, type DocumentData, type WriteBatch } from 'firebase/firestore';
import type { ActivityDraft } from '../shared/types';
import { database } from './firebase';
import { activityToDocument } from './activityMapping';
import { activityCollection, groupReference } from './references';

export function startBatch(): WriteBatch {
  return writeBatch(database);
}

/**
 * The security rules reject any write inside a group unless the same batch
 * bumps the group's updatedAt. Group field changes must go through here too:
 * rules check each write on its own, so a second update without updatedAt would fail.
 */
export function touchGroup(batch: WriteBatch, groupId: string, changedFields: DocumentData = {}) {
  batch.update(groupReference(groupId), { ...changedFields, updatedAt: serverTimestamp() });
}

export function addActivity(batch: WriteBatch, groupId: string, draft: ActivityDraft) {
  batch.set(doc(activityCollection(groupId)), activityToDocument(draft));
}
