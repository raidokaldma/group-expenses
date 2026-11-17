import { deleteDoc, deleteField, getDocsFromServer, onSnapshot, serverTimestamp, setDoc, type DocumentData } from 'firebase/firestore';
import { AVATAR_COLORS } from '../shared/members';
import { GROUP_ID_LENGTH, randomId } from '../shared/randomId';
import type { ActivityChange, ActivityDraft, Group, Member } from '../shared/types';
import { addActivity, startBatch, touchGroup } from './groupBatch';
import { groupFromDocument, memberToDocument } from './mapping';
import { activityCollection, groupReference, ledgerCollection } from './references';

// Firestore allows 500 writes per batch; one is reserved for touching the group.
const DELETES_PER_BATCH = 499;

export type GroupSubscriber = {
  onGroup: (group: Group) => void;
  onMissing: () => void;
  /** The group isn't on this device and the server can't be asked right now. */
  onUnreachable: () => void;
  onError: () => void;
};

export type GroupEdit = {
  groupName: { kind: 'unchanged' } | { kind: 'renamed'; name: string };
  membersToSave: Member[];
  memberIdsToDelete: string[];
  changes: ActivityChange[];
};

export function subscribeToGroup(groupId: string, subscriber: GroupSubscriber): () => void {
  return onSnapshot(
    groupReference(groupId),
    // Needed to hear the server confirm that a group missing from the cache really doesn't exist.
    { includeMetadataChanges: true },
    (snapshot) => {
      // A change not yet confirmed by the server gets a local estimate of its timestamp instead of null.
      const data = snapshot.data({ serverTimestamps: 'estimate' });
      if (data) subscriber.onGroup(groupFromDocument(snapshot.id, data));
      else if (snapshot.metadata.fromCache) subscriber.onUnreachable();
      else subscriber.onMissing();
    },
    subscriber.onError,
  );
}

export function newGroupId(): string {
  return randomId(GROUP_ID_LENGTH);
}

export async function createGroup(groupId: string, name: string, memberNames: string[]): Promise<void> {
  const members: DocumentData = {};
  memberNames.forEach((memberName, position) => {
    members[randomId()] = memberToDocument({ name: memberName, colorIndex: position % AVATAR_COLORS.length });
  });
  await setDoc(groupReference(groupId), {
    name,
    members,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function applyGroupEdit(groupId: string, actor: Member, edit: GroupEdit): Promise<void> {
  // Members are written one field at a time so concurrent edits to different members don't overwrite each other.
  const changedFields: DocumentData = {};
  if (edit.groupName.kind === 'renamed') changedFields.name = edit.groupName.name;
  for (const member of edit.membersToSave) {
    changedFields[`members.${member.id}`] = memberToDocument(member);
  }
  for (const memberId of edit.memberIdsToDelete) {
    changedFields[`members.${memberId}`] = deleteField();
  }

  const batch = startBatch();
  touchGroup(batch, groupId, changedFields);
  for (const change of edit.changes) {
    addActivity(batch, groupId, { actor, change });
  }
  await batch.commit();
}

export async function saveMember(groupId: string, member: Member, activity: ActivityDraft): Promise<void> {
  const batch = startBatch();
  touchGroup(batch, groupId, { [`members.${member.id}`]: memberToDocument(member) });
  addActivity(batch, groupId, activity);
  await batch.commit();
}

/** Needs a connection: the full list of what to delete has to come from the server, not the cache. */
export async function deleteGroup(groupId: string): Promise<void> {
  const [ledgerSnapshot, activitySnapshot] = await Promise.all([
    getDocsFromServer(ledgerCollection(groupId)),
    getDocsFromServer(activityCollection(groupId)),
  ]);
  const documents = [...ledgerSnapshot.docs, ...activitySnapshot.docs];

  for (let start = 0; start < documents.length; start += DELETES_PER_BATCH) {
    const batch = startBatch();
    for (const document of documents.slice(start, start + DELETES_PER_BATCH)) {
      batch.delete(document.ref);
    }
    touchGroup(batch, groupId);
    await batch.commit();
  }
  await deleteDoc(groupReference(groupId));
}
