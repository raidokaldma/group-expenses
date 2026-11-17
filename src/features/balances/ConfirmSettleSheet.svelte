<script lang="ts">
  import { saveLedgerEntry } from '../../data/ledgerRepository';
  import { todayIsoDate } from '../../shared/dates';
  import { paymentChange } from '../../shared/activityChanges';
  import { memberOrUnknown } from '../../shared/members';
  import { formatEuros } from '../../shared/money/formatEuros';
  import type { Transfer } from '../../shared/money/settleUp';
  import { randomId } from '../../shared/randomId';
  import type { Group, Member, Payment } from '../../shared/types';
  import { saveInBackground } from '../../ui/saveInBackground';
  import Sheet from '../../ui/Sheet.svelte';
  import { showToast } from '../../ui/toastMessage.svelte';

  /** `transfers` is live: someone else may settle or change the debt while this is open. */
  type Props = { group: Group; actor: Member; fromId: string; toId: string; transfers: Transfer[]; onClose: () => void };
  let { group, actor, fromId, toId, transfers, onClose }: Props = $props();

  type Debt = { state: 'open'; transfer: Transfer } | { state: 'settled' };

  const debt: Debt = $derived.by(() => {
    const transfer = transfers.find((candidate) => candidate.fromId === fromId && candidate.toId === toId);
    return transfer ? { state: 'open', transfer } : { state: 'settled' };
  });

  const fromName = $derived(memberOrUnknown(group, fromId).name);
  const toName = $derived(memberOrUnknown(group, toId).name);

  function markPaid(transfer: Transfer) {
    const payment: Payment = {
      kind: 'payment',
      id: randomId(),
      amountCents: transfer.amountCents,
      date: todayIsoDate(),
      createdAtMillis: Date.now(),
      fromId,
      toId,
    };
    saveInBackground(saveLedgerEntry(group.id, payment, { actor, change: paymentChange('paymentRecorded', group, payment) }));
    showToast('Payment recorded. Undo it from Expenses.');
    onClose();
  }
</script>

<Sheet title="Mark as paid?" {onClose}>
  <div class="column">
    {#if debt.state === 'open'}
      {@const transfer = debt.transfer}
      <p class="question">
        Has {fromName} paid {toName} <b class="numeric">{formatEuros(transfer.amountCents)}</b>? This records the payment and
        updates the balances.
      </p>
      <div class="actions">
        <button class="button" onclick={onClose}>Cancel</button>
        <button class="button primary" onclick={() => markPaid(transfer)}>Mark paid</button>
      </div>
    {:else}
      <p class="question">{fromName} no longer owes {toName} anything. Someone may have recorded it already.</p>
      <div class="actions">
        <button class="button primary" onclick={onClose}>Close</button>
      </div>
    {/if}
  </div>
</Sheet>

<style>
  .question {
    margin: 0;
  }
</style>
