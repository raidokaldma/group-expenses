import type { DocumentData } from 'firebase/firestore';
import type { Group, LedgerEntry, Member } from '../shared/types';
import { isRecord, memberNameText, text, timestampMillis, uniqueTexts, wholeNumber } from './readFields';

export function memberToDocument(member: Pick<Member, 'name' | 'colorIndex'>): DocumentData {
  return { name: member.name, colorIndex: member.colorIndex };
}

export function groupFromDocument(id: string, data: DocumentData): Group {
  const membersById = isRecord(data.members) ? data.members : {};
  const members = Object.entries(membersById)
    .filter((entry): entry is [string, Record<string, unknown>] => isRecord(entry[1]))
    .map(([memberId, member]) => ({
      id: memberId,
      name: memberNameText(member.name),
      colorIndex: wholeNumber(member.colorIndex),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return { id, name: text(data.name, 'Group'), members, updatedAtMillis: timestampMillis(data.updatedAt) };
}

export function ledgerEntryToDocument(entry: LedgerEntry): DocumentData {
  const { id, ...fields } = entry;
  return fields;
}

export function ledgerEntryFromDocument(id: string, data: DocumentData): LedgerEntry {
  const common = {
    id,
    amountCents: wholeNumber(data.amountCents),
    date: text(data.date),
    createdAtMillis: wholeNumber(data.createdAtMillis),
  };
  if (data.kind === 'payment') {
    return { ...common, kind: 'payment', fromId: text(data.fromId), toId: text(data.toId) };
  }
  return {
    ...common,
    kind: 'expense',
    description: text(data.description),
    payerId: text(data.payerId),
    participantIds: uniqueTexts(data.participantIds),
  };
}
