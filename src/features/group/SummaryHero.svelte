<script lang="ts">
  import type { Balances } from '../../shared/money/computeBalances';
  import { formatEuros } from '../../shared/money/formatEuros';
  import type { Member } from '../../shared/types';

  type Props = { member: Member; balances: Balances; onShowMyItems: (memberId: string) => void };
  let { member, balances, onShowMyItems }: Props = $props();

  const myNetCents = $derived(balances.netByMember[member.id] ?? 0);
</script>

<section class="hero" aria-label="Summary">
  <div>
    <div class="label">{myNetCents > 0 ? 'You get back' : myNetCents < 0 ? 'You owe' : 'Your balance'}</div>
    <div class="amount" class:gets-back={myNetCents > 0} class:owes={myNetCents < 0}>
      {myNetCents === 0 ? 'All even' : formatEuros(Math.abs(myNetCents))}
    </div>
  </div>
  <button class="my-items label" onclick={() => onShowMyItems(member.id)}>
    Your spending {formatEuros(balances.shareByMember[member.id] ?? 0)} · see your items ›
  </button>
</section>

<style>
  .hero {
    background: linear-gradient(160deg, var(--hero), color-mix(in srgb, var(--hero) 80%, black));
    color: var(--hero-ink);
    border-radius: 20px;
    padding: 16px 18px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .label {
    font-size: 13px;
    color: var(--hero-muted);
  }
  .amount {
    font: 700 40px/1 var(--display);
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.01em;
  }
  .amount.owes {
    color: var(--hero-owe);
  }
  .amount.gets-back {
    color: var(--hero-get);
  }
  .my-items {
    text-align: left;
    width: 100%;
  }
</style>
