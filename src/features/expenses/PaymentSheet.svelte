<script lang="ts">
  import { deleteLedgerEntry } from '../../data/ledgerRepository';
  import { dayLabel } from '../../shared/dates';
  import { paymentChange } from '../../shared/activityChanges';
  import { memberOrUnknown } from '../../shared/members';
  import { formatEuros } from '../../shared/money/formatEuros';
  import type { Group, Member, Payment } from '../../shared/types';
  import { saveInBackground } from '../../ui/saveInBackground';
  import { currentDay } from '../../ui/currentDay.svelte';
  import Sheet from '../../ui/Sheet.svelte';
  import { showToast } from '../../ui/toastMessage.svelte';

  type Props = { group: Group; actor: Member; payment: Payment; onClose: () => void };
  let { group, actor, payment, onClose }: Props = $props();

  const fromName = $derived(memberOrUnknown(group, payment.fromId).name);
  const toName = $derived(memberOrUnknown(group, payment.toId).name);

  function deletePayment() {
    saveInBackground(
      deleteLedgerEntry(group.id, payment.id, { actor: actor, change: paymentChange('paymentDeleted', group, payment) }),
    );
    showToast('Payment deleted');
    onClose();
  }
</script>

<Sheet title="Payment" {onClose}>
  <div class="column">
    <p class="statement">
      {fromName} paid {toName} <b class="numeric">{formatEuros(payment.amountCents)}</b> on {dayLabel(payment.date, currentDay())}.
    </p>
    <div class="actions">
      <button class="button danger" onclick={deletePayment}>Delete payment</button>
      <button class="button" onclick={onClose}>Keep</button>
    </div>
  </div>
</Sheet>

<style>
  .statement {
    margin: 0;
  }
</style>
