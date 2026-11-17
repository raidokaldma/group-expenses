import { collection, doc } from 'firebase/firestore';
import { database } from './firebase';

export function groupReference(groupId: string) {
  return doc(database, 'groups', groupId);
}

export function ledgerCollection(groupId: string) {
  return collection(groupReference(groupId), 'ledger');
}

export function ledgerEntryReference(groupId: string, entryId: string) {
  return doc(ledgerCollection(groupId), entryId);
}

export function activityCollection(groupId: string) {
  return collection(groupReference(groupId), 'activity');
}
