import type { ActivityEntry, Member } from '../../shared/types';

/**
 * A change affects whoever made it and whoever it is about. Changes about the group itself,
 * like renaming it, affect everyone.
 */
export function affectsMember(entry: ActivityEntry, memberId: string, involved: Member[]): boolean {
  if (entry.actor.id === memberId) return true;
  if (entry.change.kind === 'groupCreated' || entry.change.kind === 'groupRenamed') return true;
  return involved.some((member) => member.id === memberId);
}
