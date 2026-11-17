<script lang="ts">
  import { deleteLedgerEntry, saveLedgerEntry } from '../../data/ledgerRepository';
  import { todayIsoDate, yesterdayIsoDate } from '../../shared/dates';
  import { MAXIMUM_DESCRIPTION_LENGTH } from '../../shared/limits';
  import { expenseChange } from '../../shared/activityChanges';
  import { formatEuros } from '../../shared/money/formatEuros';
  import { parseAmount } from '../../shared/money/parseAmount';
  import { randomId } from '../../shared/randomId';
  import type { Expense, Group, LedgerEntry, Member } from '../../shared/types';
  import MemberChip from '../../ui/MemberChip.svelte';
  import { saveInBackground } from '../../ui/saveInBackground';
  import Sheet from '../../ui/Sheet.svelte';
  import { showToast } from '../../ui/toastMessage.svelte';
  import { initialExpenseDraft, type ExpenseEditing } from './expenseDraft';

  type Props = { group: Group; ledger: LedgerEntry[]; actor: Member; editing: ExpenseEditing; onClose: () => void };
  let { group, ledger, actor, editing, onClose }: Props = $props();

  // The form edits a snapshot taken when the sheet opens; live updates must not overwrite what is being typed.
  // svelte-ignore state_referenced_locally
  const draft = $state(initialExpenseDraft(group, ledger, actor, editing));
  // Live, so a member removed while the form is open disappears from the choices.
  const members = $derived(group.members);
  const today = todayIsoDate();
  const yesterday = yesterdayIsoDate();

  let amountRejected = $state(false);
  let amountInput: HTMLInputElement;
  let descriptionInput: HTMLInputElement;

  const parsedAmount = $derived(parseAmount(draft.amountText));
  const everyoneSelected = $derived(members.every((member) => draft.participantIds.includes(member.id)));
  const amountHint = $derived.by(() => {
    if (amountRejected) return 'Enter an amount above zero, like 12,50 or 10+2.5.';
    if (draft.amountText.trim() === '') return 'Type an amount. 12,50 and 10+2.5 both work.';
    if (parsedAmount.kind === 'invalid') return "That isn't an amount yet.";

    const participantCount = draft.participantIds.length;
    const total = formatEuros(parsedAmount.cents);
    if (participantCount === 0) return total;
    if (participantCount === 1) return `${total} · all on one person`;
    const lowerShare = Math.floor(parsedAmount.cents / participantCount);
    const splitsEvenly = parsedAmount.cents % participantCount === 0;
    const shareText = splitsEvenly ? formatEuros(lowerShare) : `${formatEuros(lowerShare)}–${formatEuros(lowerShare + 1)}`;
    return `${total} · ${shareText} each, ${participantCount} people`;
  });

  function toggleParticipant(memberId: string) {
    draft.participantIds = draft.participantIds.includes(memberId)
      ? draft.participantIds.filter((id) => id !== memberId)
      : [...draft.participantIds, memberId];
  }

  function toggleEveryone() {
    draft.participantIds = everyoneSelected ? [] : members.map((member) => member.id);
  }

  function insertPlus() {
    draft.amountText += '+';
    amountRejected = false;
    amountInput.focus();
  }

  function save(afterSaving: 'close' | 'addNext') {
    if (parsedAmount.kind === 'invalid') {
      amountRejected = true;
      return amountInput.focus();
    }
    // Someone may have removed a member while this form was open.
    const memberIds = new Set(group.members.map((member) => member.id));
    const participantIds = draft.participantIds.filter((participantId) => memberIds.has(participantId));
    if (participantIds.length === 0) return showToast('Pick who shares it.');
    if (!memberIds.has(draft.payerId)) return showToast('Pick who paid.');

    const description = draft.description.trim();
    const expense: Expense = {
      kind: 'expense',
      id: editing.kind === 'existing' ? editing.expense.id : randomId(),
      amountCents: parsedAmount.cents,
      description,
      date: draft.date,
      createdAtMillis: editing.kind === 'existing' ? editing.expense.createdAtMillis : Date.now(),
      payerId: draft.payerId,
      participantIds,
    };
    if (editing.kind === 'existing' && isUnchanged(editing.expense, expense)) return onClose();

    const amount = formatEuros(expense.amountCents);
    const changeKind = editing.kind === 'existing' ? 'expenseEdited' : 'expenseAdded';

    saveInBackground(saveLedgerEntry(group.id, expense, { actor, change: expenseChange(changeKind, group, expense) }));
    showToast(editing.kind === 'existing' ? 'Expense updated' : `Saved ${amount}`);

    if (afterSaving === 'addNext') {
      draft.amountText = '';
      draft.description = '';
      amountInput.focus();
    } else {
      onClose();
    }
  }

  function isUnchanged(before: Expense, after: Expense): boolean {
    const sameParticipants =
      before.participantIds.length === after.participantIds.length &&
      before.participantIds.every((participantId) => after.participantIds.includes(participantId));
    return (
      sameParticipants &&
      before.amountCents === after.amountCents &&
      before.description === after.description &&
      before.date === after.date &&
      before.payerId === after.payerId
    );
  }

  function deleteExpense(expense: Expense) {
    saveInBackground(
      deleteLedgerEntry(group.id, expense.id, { actor, change: expenseChange('expenseDeleted', group, expense) }),
    );
    showToast('Expense deleted');
    onClose();
  }

  // Enter must not save: people and date are still to be picked after typing.
  function moveOnInsteadOfSubmitting(event: KeyboardEvent) {
    if (event.key !== 'Enter' || !(event.target instanceof HTMLInputElement)) return;
    event.preventDefault();
    if (event.target === amountInput) descriptionInput.focus();
    else event.target.blur();
  }

  function submit(event: SubmitEvent) {
    event.preventDefault();
    save('close');
  }
</script>

<Sheet title={editing.kind === 'existing' ? 'Edit expense' : 'Add expense'} {onClose}>
  <!-- The form only listens for Enter bubbling up from its inputs. -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <form onsubmit={submit} onkeydown={moveOnInsteadOfSubmitting} novalidate>
    <div class="amount-field" class:rejected={amountRejected}>
      <input
        inputmode="decimal"
        autocomplete="off"
        placeholder="0,00"
        aria-label="Amount in euros. Sums like 10+2,5 work"
        bind:value={draft.amountText}
        bind:this={amountInput}
        enterkeyhint="next"
        oninput={() => (amountRejected = false)}
      />
      <span class="euro-sign">€</span>
      <button type="button" class="plus" aria-label="Insert plus sign" onclick={insertPlus}>+</button>
    </div>
    <p class="hint numeric" class:owes={amountRejected}>{amountHint}</p>

    <input class="input" maxlength={MAXIMUM_DESCRIPTION_LENGTH} placeholder="What for? (optional)" aria-label="Description, optional" autocomplete="off" enterkeyhint="done" bind:value={draft.description} bind:this={descriptionInput} />

    <div class="field-label">When</div>
    <div class="chips">
      <button type="button" class="chip" aria-pressed={draft.date === today} onclick={() => (draft.date = today)}>Today</button>
      <button type="button" class="chip" aria-pressed={draft.date === yesterday} onclick={() => (draft.date = yesterday)}>Yesterday</button>
      <label class="chip" class:selected={draft.date !== today && draft.date !== yesterday}>
        <input
          type="date"
          class="date"
          max="2100-12-31"
          aria-label="Other date"
          value={draft.date}
          onchange={(event) => event.currentTarget.value && (draft.date = event.currentTarget.value)}
        />
      </label>
    </div>

    <div class="field-label">Paid by</div>
    <div class="chips">
      {#each members as member (member.id)}
        <MemberChip {member} selected={draft.payerId === member.id} onSelect={() => (draft.payerId = member.id)} />
      {/each}
    </div>

    <div class="field-label">
      Split between
      <button type="button" class="toggle" aria-pressed={everyoneSelected} onclick={toggleEveryone}>Everyone</button>
    </div>
    <div class="chips">
      {#each members as member (member.id)}
        <MemberChip {member} selected={draft.participantIds.includes(member.id)} onSelect={() => toggleParticipant(member.id)} />
      {/each}
    </div>
    {#if draft.participantIds.length === 0}
      <p class="hint owes" role="alert">Pick at least one person to split between.</p>
    {/if}

    <div class="actions">
      {#if editing.kind === 'existing'}
        <button type="button" class="button danger" onclick={() => deleteExpense(editing.expense)}>Delete</button>
      {:else}
        <button type="button" class="button" onclick={() => save('addNext')}>Save + next</button>
      {/if}
      <button class="button primary">Save</button>
    </div>
  </form>
</Sheet>

<style>
  .amount-field {
    display: flex;
    align-items: center;
    gap: 8px;
    border: 1.5px solid var(--line);
    background: var(--bg);
    border-radius: 14px;
    padding: 0 8px 0 14px;
  }
  /* The inner inputs have no outline of their own, so the ring is drawn around their container. */
  .amount-field:has(input:focus),
  label.chip:focus-within {
    outline: 3px solid var(--accent);
    outline-offset: -3px;
  }
  .amount-field.rejected {
    border-color: var(--owe);
  }
  .amount-field input {
    flex: 1;
    min-width: 0;
    height: 60px;
    border: 0;
    background: none;
    font: 700 32px var(--display);
    font-variant-numeric: tabular-nums;
    outline: none;
  }
  .euro-sign {
    font: 700 24px var(--display);
    color: var(--muted);
  }
  .plus {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: var(--surface);
    border: 1px solid var(--line);
    font-size: 22px;
    font-weight: 600;
  }
  .hint {
    margin: -4px 2px 0;
    font-size: 13px;
    color: var(--muted);
    min-height: 18px;
  }
  .hint.owes {
    color: var(--owe);
  }
  .date {
    border: 0;
    background: none;
    height: 34px;
    font-size: 15px;
    outline: none;
    max-width: 150px;
  }
</style>
