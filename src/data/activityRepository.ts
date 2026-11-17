import { limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import type { ActivityDraft, ActivityEntry } from '../shared/types';
import { activityFromDocument } from './activityMapping';
import { addActivity, startBatch, touchGroup } from './groupBatch';
import { activityCollection } from './references';

const SHOWN_ACTIVITY_LIMIT = 200;

export function subscribeToActivity(groupId: string, onActivity: (activity: ActivityEntry[]) => void): () => void {
  // Server time, so a device with a wrong clock can't push its entries to the top.
  const newestFirst = query(activityCollection(groupId), orderBy('createdAt', 'desc'), limit(SHOWN_ACTIVITY_LIMIT));
  return onSnapshot(
    newestFirst,
    (snapshot) => {
      const entries: ActivityEntry[] = [];
      for (const document of snapshot.docs) {
        const read = activityFromDocument(document.id, document.data({ serverTimestamps: 'estimate' }));
        if (read.kind === 'readable') entries.push(read.entry);
      }
      onActivity(entries);
    },
    () => {},
  );
}

export async function recordActivity(groupId: string, activity: ActivityDraft): Promise<void> {
  const batch = startBatch();
  touchGroup(batch, groupId);
  addActivity(batch, groupId, activity);
  await batch.commit();
}
