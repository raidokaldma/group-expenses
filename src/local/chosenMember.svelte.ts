import { SvelteMap } from 'svelte/reactivity';
import { readStoredText, removeStoredText, writeStoredText } from './deviceStorage';

// There is no login: each device remembers which member its user said they are, per group.

export type MemberChoice = { kind: 'none' } | { kind: 'member'; memberId: string };

// Reactive copy of what is stored, so the screen updates when the choice changes.
const choiceByGroup = new SvelteMap<string, MemberChoice>();

function storageKey(groupId: string): string {
  return `groupExpenses.me.${groupId}`;
}

function readStoredChoice(groupId: string): MemberChoice {
  const memberId = readStoredText(storageKey(groupId));
  return memberId ? { kind: 'member', memberId } : { kind: 'none' };
}

export function memberChoiceFor(groupId: string): MemberChoice {
  return choiceByGroup.get(groupId) ?? readStoredChoice(groupId);
}

export function storeChosenMemberId(groupId: string, memberId: string) {
  writeStoredText(storageKey(groupId), memberId);
  choiceByGroup.set(groupId, { kind: 'member', memberId });
}

export function clearChosenMemberId(groupId: string) {
  removeStoredText(storageKey(groupId));
  choiceByGroup.set(groupId, { kind: 'none' });
}
