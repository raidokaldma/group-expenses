import { MAXIMUM_MEMBER_NAME_LENGTH } from './limits';
import type { Group, LedgerEntry, Member } from './types';

export const AVATAR_COLORS = [
  '#2f6fed', '#d9482b', '#1f9d6b', '#b0469f', '#b97f04', '#0e8f9f',
  '#7a55e0', '#d43d73', '#5a8a1f', '#b8602a', '#3d5a80', '#8a6d3b',
];

/** Shown for a member who no longer exists or whose stored name is unreadable. */
export const UNKNOWN_MEMBER_NAME = 'Someone';

export function findMember(group: Group, memberId: string): Member | undefined {
  return group.members.find((member) => member.id === memberId);
}

/** A member as they are now, or as they were logged if they have been removed since. */
export function currentVersionOf(group: Group, logged: Member): Member {
  return findMember(group, logged.id) ?? logged;
}

export function memberOrUnknown(group: Group, memberId: string): Member {
  return findMember(group, memberId) ?? { id: memberId, name: UNKNOWN_MEMBER_NAME, colorIndex: 0 };
}

/** Everyone an expense or payment is about, payer first. */
export function membersInvolvedIn(group: Group, entry: LedgerEntry): Member[] {
  const memberIds = entry.kind === 'payment' ? [entry.fromId, entry.toId] : [entry.payerId, ...entry.participantIds];
  return [...new Set(memberIds)].map((memberId) => findMember(group, memberId)).filter((member) => member !== undefined);
}

export function nextColorIndex(members: Member[]): number {
  const usedColorIndexes = new Set(members.map((member) => member.colorIndex));
  for (let colorIndex = 0; colorIndex < AVATAR_COLORS.length; colorIndex++) {
    if (!usedColorIndexes.has(colorIndex)) return colorIndex;
  }
  return members.length % AVATAR_COLORS.length;
}

export function parseMemberNames(commaSeparatedNames: string): string[] {
  const names = commaSeparatedNames
    .split(/[,\n]/)
    .map((name) => name.trim().slice(0, MAXIMUM_MEMBER_NAME_LENGTH))
    .filter((name) => name !== '');
  return [...new Set(names)];
}

export function findMemberByName(members: Member[], name: string): Member | undefined {
  return members.find((member) => hasSameName(member, name));
}

function hasSameName(member: Member, name: string): boolean {
  return member.name.toLowerCase() === name.toLowerCase();
}

export function initials(name: string): string {
  const trimmedName = name.trim();
  const words = trimmedName.split(/\s+/);
  const letters = words.length > 1 ? words[0][0] + words[1][0] : trimmedName.slice(0, 2);
  return (letters || '?').toUpperCase();
}
