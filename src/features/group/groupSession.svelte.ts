import { subscribeToActivity } from '../../data/activityRepository';
import { subscribeToGroup } from '../../data/groupRepository';
import { subscribeToLedger, type LedgerSnapshot } from '../../data/ledgerRepository';
import { forgetGroup, rememberGroup } from '../../local/rememberedGroups';
import { isCreatedHere } from '../groups/createdHere';
import type { ActivityEntry, Group } from '../../shared/types';

export type GroupLoad =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'unreachable' }
  | { status: 'failed' }
  | { status: 'ready'; group: Group };

type LedgerLoad = { status: 'loading' } | { status: 'ready'; snapshot: LedgerSnapshot };

const EMPTY_LEDGER: LedgerSnapshot = { ledger: [], unsyncedEntryIds: new Set() };

/** Live view of one group: everything updates as other people make changes. */
export function openGroupSession(groupId: string) {
  let groupLoad = $state.raw<GroupLoad>({ status: 'loading' });
  // Without a server answer for a brand-new group, the empty ledger would keep it on "Loading…".
  let ledgerLoad = $state.raw<LedgerLoad>(
    isCreatedHere(groupId) ? { status: 'ready', snapshot: EMPTY_LEDGER } : { status: 'loading' },
  );
  let activity = $state.raw<ActivityEntry[]>([]);

  const unsubscribers = [
    subscribeToGroup(groupId, {
      onGroup(group) {
        groupLoad = { status: 'ready', group };
        rememberGroup(group);
      },
      onMissing() {
        groupLoad = { status: 'missing' };
        forgetGroup(groupId);
      },
      onUnreachable() {
        groupLoad = { status: 'unreachable' };
      },
      onError() {
        groupLoad = { status: 'failed' };
      },
    }),
    subscribeToLedger(groupId, (snapshot) => {
      ledgerLoad = { status: 'ready', snapshot };
    }),
    subscribeToActivity(groupId, (entries) => {
      activity = entries;
    }),
  ];

  function currentLedger(): LedgerSnapshot {
    return ledgerLoad.status === 'ready' ? ledgerLoad.snapshot : EMPTY_LEDGER;
  }

  return {
    /** The group shows once its expenses are in too, so it never flashes as empty. */
    get load(): GroupLoad {
      return groupLoad.status === 'ready' && ledgerLoad.status === 'loading' ? { status: 'loading' } : groupLoad;
    },
    get ledger() {
      return currentLedger().ledger;
    },
    get unsyncedEntryIds() {
      return currentLedger().unsyncedEntryIds;
    },
    get activity() {
      return activity;
    },
    close() {
      for (const unsubscribe of unsubscribers) unsubscribe();
    },
  };
}
