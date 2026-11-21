<script lang="ts">
  import { dayLabel } from '../../shared/dates';
  import { memberOrUnknown } from '../../shared/members';
  import { formatEuros } from '../../shared/money/formatEuros';
  import { isSplitEvenly, splitShares } from '../../shared/money/splitShares';
  import type { Expense, Group, LedgerEntry, Viewer } from '../../shared/types';
  import { currentDay } from '../../ui/currentDay.svelte';
  import Avatar from '../../ui/Avatar.svelte';
  import Sheet from '../../ui/Sheet.svelte';
  import { newestFirst } from './ledgerOrder';

  type Props = {
    group: Group;
    ledger: LedgerEntry[];
    viewer: Viewer;
    memberId: string;
    onOpenExpense: (expense: Expense) => void;
    onClose: () => void;
  };
  let { group, ledger, viewer, memberId, onOpenExpense, onClose }: Props = $props();

  const isViewer = $derived(viewer.kind === 'member' && viewer.member.id === memberId);
  const name = $derived(memberOrUnknown(group, memberId).name);
  const items = $derived(
    newestFirst(ledger.filter((entry) => entry.kind === 'expense'))
      .filter((expense) => expense.participantIds.includes(memberId))
      .map((expense) => ({ expense, shareCents: splitShares(expense)[memberId] ?? 0 })),
  );
  const totalShareCents = $derived(items.reduce((sum, item) => sum + item.shareCents, 0));
</script>

<Sheet title={isViewer ? 'Your items' : `Items for ${name}`} {onClose}>
  <div class="items">
    {#each items as { expense, shareCents } (expense.id)}
      <button class="row" onclick={() => onOpenExpense(expense)}>
        <Avatar name={memberOrUnknown(group, expense.payerId).name} colorIndex={memberOrUnknown(group, expense.payerId).colorIndex} size="small" />
        <span class="row-main">
          <span class="row-title">{expense.description || 'Expense'}</span>
          <span class="row-detail">
            {dayLabel(expense.date, currentDay())} · {memberOrUnknown(group, expense.payerId).name} paid {formatEuros(expense.amountCents)} · split {expense.participantIds.length}{isSplitEvenly(expense) ? '' : ' by weight'}
          </span>
        </span>
        <span class="row-amount"><b>{formatEuros(shareCents)}</b></span>
      </button>
    {:else}
      <div class="empty">{isViewer ? 'You have' : `${name} has`} no share in any expense yet.</div>
    {/each}
  </div>
  <div class="row total">
    <span class="row-main">
      <span class="row-title">{isViewer ? 'Your spending' : `${name}'s spending`}</span>
      <span class="row-detail">{items.length} {items.length === 1 ? 'expense' : 'expenses'}</span>
    </span>
    <span class="row-amount"><b>{formatEuros(totalShareCents)}</b></span>
  </div>
</Sheet>

<style>
  .items .row {
    padding: 10px 0;
  }
  .total {
    border-top: 2px solid var(--ink);
    padding: 12px 0 0 38px;
  }
</style>
