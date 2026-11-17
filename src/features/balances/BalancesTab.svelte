<script lang="ts">
  import { memberOrUnknown } from '../../shared/members';
  import type { Balances } from '../../shared/money/computeBalances';
  import { formatEuros } from '../../shared/money/formatEuros';
  import type { Transfer } from '../../shared/money/settleUp';
  import type { Group, Viewer } from '../../shared/types';
  import Avatar from '../../ui/Avatar.svelte';

  type Props = {
    group: Group;
    balances: Balances;
    transfers: Transfer[];
    viewer: Viewer;
    onShowItems: (memberId: string) => void;
    onSettle: (transfer: Transfer) => void;
  };
  let { group, balances, transfers, viewer, onShowItems, onSettle }: Props = $props();

  const membersByBalance = $derived([...group.members].sort((first, second) => netCentsOf(second.id) - netCentsOf(first.id)));

  function involvesViewer(transfer: Transfer): boolean {
    return viewer.kind === 'member' && (transfer.fromId === viewer.member.id || transfer.toId === viewer.member.id);
  }

  function netCentsOf(memberId: string): number {
    return balances.netByMember[memberId] ?? 0;
  }
</script>

<div class="list">
  {#each membersByBalance as member (member.id)}
    {@const netCents = netCentsOf(member.id)}
    {@const isViewer = viewer.kind === 'member' && viewer.member.id === member.id}
    <button class="row" class:viewer={isViewer} onclick={() => onShowItems(member.id)}>
      <Avatar name={member.name} colorIndex={member.colorIndex} />
      <span class="row-main">
        <span class="row-title">{member.name}{#if isViewer}<span class="you">You</span>{/if}</span>
        <span class="row-detail numeric">
          paid {formatEuros(balances.paidByMember[member.id] ?? 0)} · share {formatEuros(balances.shareByMember[member.id] ?? 0)}
        </span>
      </span>
      <span class="row-amount">
        <b class:gets-back={netCents > 0} class:owes={netCents < 0}>
          {netCents > 0 ? '+' : netCents < 0 ? '−' : ''}{formatEuros(Math.abs(netCents))}
        </b>
        <small>{netCents > 0 ? 'gets back' : netCents < 0 ? 'owes' : 'even'}</small>
      </span>
    </button>
  {:else}
    <div class="empty">No members yet. Add them in Edit group.</div>
  {/each}
</div>

<h3 class="day-label">Who pays whom</h3>
<section class="list" aria-label="Who pays whom">
  {#each transfers as transfer (transfer.fromId + transfer.toId)}
    <button class="row" class:viewer={involvesViewer(transfer)} onclick={() => onSettle(transfer)}>
      <span class="who">
        <span class="person">
          <Avatar name={memberOrUnknown(group, transfer.fromId).name} colorIndex={memberOrUnknown(group, transfer.fromId).colorIndex} size="small" />
          {memberOrUnknown(group, transfer.fromId).name}
        </span>
        <svg class="arrow" role="img" aria-label="pays" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
        <span class="person">
          <Avatar name={memberOrUnknown(group, transfer.toId).name} colorIndex={memberOrUnknown(group, transfer.toId).colorIndex} size="small" />
          {memberOrUnknown(group, transfer.toId).name}
        </span>
      </span>
      <span class="amount numeric">{formatEuros(transfer.amountCents)}</span>
      <span class="go" aria-hidden="true">›</span>
    </button>
  {:else}
    <div class="row"><span class="who">Nobody owes anything.</span></div>
  {/each}
</section>

<style>
  .viewer {
    background: var(--accent-soft);
    box-shadow: inset 3px 0 0 var(--accent);
  }
  .you {
    font-size: 11px;
    font-weight: 600;
    padding: 1px 7px;
    border-radius: 9px;
    background: var(--accent);
    color: var(--accent-ink);
    margin-left: 6px;
    vertical-align: 1px;
  }
  .who {
    flex: 1;
    min-width: 0;
    font-weight: 500;
    overflow-wrap: anywhere;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px 0;
  }
  .person {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .arrow {
    color: var(--muted);
    margin: 0 8px;
    flex: none;
  }
  .amount {
    font-weight: 600;
    white-space: nowrap;
  }
  .go {
    color: var(--muted);
    font-size: 18px;
    line-height: 1;
  }
</style>
