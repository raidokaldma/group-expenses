import { Timestamp } from 'firebase/firestore';
import { UNKNOWN_MEMBER_NAME } from '../shared/members';
import type { Member } from '../shared/types';

// Anyone with the link can write, so documents are read defensively.

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

/** Keeps the first of each ID: the screens key their lists by member ID, and a repeat would break them. */
export function uniqueTexts(value: unknown): string[] {
  return Array.isArray(value) ? [...new Set(value.map(String))] : [];
}

export function memberNameText(value: unknown): string {
  return text(value, UNKNOWN_MEMBER_NAME);
}

export function wholeNumber(value: unknown): number {
  return Math.max(0, Math.round(Number(value)) || 0);
}

export function positiveNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;
}

/** Server timestamps not yet confirmed are read with the "estimate" option, so they are set too. */
export function timestampMillis(value: unknown): number {
  return value instanceof Timestamp ? value.toMillis() : 0;
}

/** A member as stored inside an activity entry. */
export function loggedMember(value: unknown): Member {
  const member = isRecord(value) ? value : {};
  return { id: text(member.id), name: memberNameText(member.name), colorIndex: wholeNumber(member.colorIndex) };
}

export function uniqueLoggedMembers(value: unknown): Member[] {
  if (!Array.isArray(value)) return [];
  const membersById = new Map<string, Member>();
  for (const member of value.map(loggedMember)) {
    if (!membersById.has(member.id)) membersById.set(member.id, member);
  }
  return [...membersById.values()];
}
