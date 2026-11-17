import { currentVersionOf } from '../../shared/members';
import type { ActivityChange, Group, Member } from '../../shared/types';

/** Who a change is about, with current names and colours where the member still exists. */
export function membersOfChange(change: ActivityChange, group: Group): Member[] {
  switch (change.kind) {
    case 'groupCreated':
    case 'groupRenamed':
    case 'memberJoined':
      return [];
    case 'memberAdded':
    case 'memberRemoved':
    case 'memberRenamed':
      return [currentVersionOf(group, change.member)];
    case 'expenseAdded':
    case 'expenseEdited':
    case 'expenseDeleted':
      return change.members.map((member) => currentVersionOf(group, member));
    case 'paymentRecorded':
    case 'paymentDeleted':
      return [currentVersionOf(group, change.from), currentVersionOf(group, change.to)];
  }
}
