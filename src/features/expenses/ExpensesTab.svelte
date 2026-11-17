<script lang="ts">
  import { dayLabel } from '../../shared/dates';
  import { memberOrUnknown } from '../../shared/members';
  import { formatEuros } from '../../shared/money/formatEuros';
  import { splitShares } from '../../shared/money/splitShares';
  import type { Expense, Group, LedgerEntry, Viewer } from '../../shared/types';
  import { currentDay } from '../../ui/currentDay.svelte';
  import Avatar from '../../ui/Avatar.svelte';
  import { groupByDay } from '../../shared/groupByDay';
  import { newestFirst } from './ledgerOrder';

  const SHOWN_PARTICIPANT_AVATARS = 6;

  type Props = {
    group: Group;
    ledger: LedgerEntry[];
    unsyncedEntryIds: Set<string>;
    viewer: Viewer;
    onOpenEntry: (entry: LedgerEntry) => void;
  };
  let { group, ledger, unsyncedEntryIds, viewer, onOpenEntry }: Props = $props();

  const days = $derived(groupByDay(newestFirst(ledger), (entry) => entry.date));

  function isSplitBetweenEveryone(expense: Expense): boolean {
    const members = group.members;
    return (
      members.length > 0 &&
      expense.participantIds.length === members.length &&
      members.every((member) => expense.participantIds.includes(member.id))
    );
  }
</script>

{#each days as day (day.date)}
  <div class="day-label">{dayLabel(day.date, currentDay())}</div>
  <div class="list">
    {#each day.items as entry (entry.id)}
      {#if entry.kind === 'payment'}
        <button class="row" onclick={() => onOpenEntry(entry)}>
          <Avatar name={memberOrUnknown(group, entry.fromId).name} colorIndex={memberOrUnknown(group, entry.fromId).colorIndex} />
          <span class="row-main">
            <span class="row-title">{memberOrUnknown(group, entry.fromId).name} paid {memberOrUnknown(group, entry.toId).name}</span>
            <span class="row-detail">
              Payment
              {#if unsyncedEntryIds.has(entry.id)}<span class="unsynced">not synced yet</span>{/if}
            </span>
          </span>
          <span class="row-amount"><b>{formatEuros(entry.amountCents)}</b></span>
        </button>
      {:else}
        <button class="row" onclick={() => onOpenEntry(entry)}>
          <Avatar name={memberOrUnknown(group, entry.payerId).name} colorIndex={memberOrUnknown(group, entry.payerId).colorIndex} />
          <span class="row-main">
            <span class="row-title">{entry.description || 'Expense'}</span>
            <span class="row-detail">
              {memberOrUnknown(group, entry.payerId).name} paid ·
              <span class="participants">
                {#each entry.participantIds.slice(0, SHOWN_PARTICIPANT_AVATARS) as participantId (participantId)}
                  <Avatar name={memberOrUnknown(group, participantId).name} colorIndex={memberOrUnknown(group, participantId).colorIndex} size="tiny" />
                {/each}
              </span>
              {#if entry.participantIds.length > SHOWN_PARTICIPANT_AVATARS}
                +{entry.participantIds.length - SHOWN_PARTICIPANT_AVATARS}
              {/if}
              {#if isSplitBetweenEveryone(entry)}everyone{/if}
              {#if unsyncedEntryIds.has(entry.id)}<span class="unsynced">not synced yet</span>{/if}
            </span>
          </span>
          <span class="row-amount">
            <b>{formatEuros(entry.amountCents)}</b>
            {#if viewer.kind === 'member'}
              {@const myShareCents = splitShares(entry)[viewer.member.id] ?? 0}
              <small>{myShareCents > 0 ? `your share ${formatEuros(myShareCents)}` : 'not you'}</small>
            {/if}
          </span>
        </button>
      {/if}
    {/each}
  </div>
{:else}
  <div class="empty"><b>No expenses yet</b>Tap Add expense.</div>
{/each}

<style>
  .participants {
    display: inline-flex;
  }
  .unsynced {
    font-size: 11px;
    font-weight: 600;
    padding: 1px 7px;
    border-radius: 9px;
    background: var(--owe-soft);
    color: var(--owe);
    /* Online, a change syncs within moments; the delay keeps the label from flashing on every save. */
    animation: appear 0s 1.5s both;
  }
  @keyframes appear {
    from {
      visibility: hidden;
    }
    to {
      visibility: visible;
    }
  }
  .participants :global(.avatar + .avatar) {
    margin-left: -5px;
  }
</style>
