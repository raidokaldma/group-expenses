import { memberOrUnknown } from '../../shared/members';
import { formatEuros } from '../../shared/money/formatEuros';
import type { Transfer } from '../../shared/money/settleUp';
import type { Group } from '../../shared/types';

/** Plain-text summary meant to be pasted into a chat. */
export function shareSummary(group: Group, transfers: Transfer[], link: string): string {
  const settleLines =
    transfers.length > 0
      ? transfers.map(
          (transfer) =>
            `${memberOrUnknown(group, transfer.fromId).name} → ${memberOrUnknown(group, transfer.toId).name}: ${formatEuros(transfer.amountCents)}`,
        )
      : ['Nobody owes anything.'];

  return [group.name, '', ...settleLines, '', link].join('\n');
}
