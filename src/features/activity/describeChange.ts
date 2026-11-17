import { currentVersionOf } from '../../shared/members';
import { formatEuros } from '../../shared/money/formatEuros';
import type { ActivityChange, Group, Member } from '../../shared/types';

/** The sentence after the actor's name, like "added Dinner · €30.00". */
export function describeChange(change: ActivityChange, group: Group): string {
  const nameOf = (member: Member) => currentVersionOf(group, member).name;
  switch (change.kind) {
    case 'groupCreated':
      return 'created the group';
    case 'groupRenamed':
      return `renamed the group to ${change.name}`;
    case 'memberJoined':
      return 'joined the group';
    case 'memberAdded':
      return `added ${nameOf(change.member)}`;
    case 'memberRemoved':
      return `removed ${nameOf(change.member)}`;
    case 'memberRenamed':
      // The names at the time, so the history still reads right after later renames.
      return `renamed ${change.previousName} to ${change.member.name}`;
    case 'expenseAdded':
    case 'expenseEdited':
    case 'expenseDeleted': {
      const verb = { expenseAdded: 'added', expenseEdited: 'edited', expenseDeleted: 'deleted' }[change.kind];
      return `${verb} ${change.description || 'an expense'} · ${formatEuros(change.amountCents)}`;
    }
    case 'paymentRecorded':
    case 'paymentDeleted': {
      const verb = change.kind === 'paymentRecorded' ? 'recorded' : 'deleted';
      return `${verb} payment ${nameOf(change.from)} → ${nameOf(change.to)} · ${formatEuros(change.amountCents)}`;
    }
  }
}
