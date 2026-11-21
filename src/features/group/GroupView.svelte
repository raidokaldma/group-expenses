<script lang="ts">
  import { recordActivity } from '../../data/activityRepository';
  import { clearChosenMemberId, memberChoiceFor, storeChosenMemberId } from '../../local/chosenMember.svelte';
  import { findMember } from '../../shared/members';
  import { ledgerOfMembers } from '../../shared/ledgerOfMembers';
  import { computeBalances } from '../../shared/money/computeBalances';
  import { settleUpAfterPayments } from '../../shared/money/settleUp';
  import type { ActivityDraft, ActivityEntry, Expense, Group, LedgerEntry, Member, Payment, Viewer } from '../../shared/types';
  import { showGroupNameInAddress } from '../../routing/route.svelte';
  import { saveInBackground } from '../../ui/saveInBackground';
  import { showToast } from '../../ui/toastMessage.svelte';
  import ActivityTab from '../activity/ActivityTab.svelte';
  import BalancesTab from '../balances/BalancesTab.svelte';
  import ConfirmSettleSheet from '../balances/ConfirmSettleSheet.svelte';
  import ExpenseSheet from '../expenses/ExpenseSheet.svelte';
  import ExpensesTab from '../expenses/ExpensesTab.svelte';
  import MemberItemsSheet from '../expenses/MemberItemsSheet.svelte';
  import PaymentSheet from '../expenses/PaymentSheet.svelte';
  import { consumeCreatedHere } from '../groups/createdHere';
  import EditGroupSheet from '../groups/EditGroupSheet.svelte';
  import GroupsSheet from '../groups/GroupsSheet.svelte';
  import NewGroupSheet from '../groups/NewGroupSheet.svelte';
  import WhoAreYouSheet from '../identity/WhoAreYouSheet.svelte';
  import ShareSheet from '../share/ShareSheet.svelte';
  import GroupHeader from './GroupHeader.svelte';
  import SummaryHero from './SummaryHero.svelte';

  type OpenSheet =
    | { name: 'none' }
    // "then" is what the viewer was trying to do when they were asked who they are.
    | { name: 'whoAreYou'; then: OpenSheet }
    | { name: 'groups' }
    | { name: 'newGroup' }
    | { name: 'editGroup' }
    | { name: 'share' }
    | { name: 'addExpense' }
    | { name: 'editExpense'; expense: Expense }
    | { name: 'payment'; payment: Payment }
    | { name: 'memberItems'; memberId: string }
    | { name: 'confirmSettle'; fromId: string; toId: string };

  const TABS = ['expenses', 'balances', 'activity'] as const;
  type Tab = (typeof TABS)[number];

  type Props = { group: Group; ledger: LedgerEntry[]; unsyncedEntryIds: Set<string>; activity: ActivityEntry[] };
  let { group, ledger: storedLedger, unsyncedEntryIds, activity }: Props = $props();

  // Every screen below works from this, so they all agree on what counts.
  const ledger = $derived(ledgerOfMembers(storedLedger, group.members));

  const viewer: Viewer = $derived.by(() => {
    const choice = memberChoiceFor(group.id);
    // The chosen member may have been removed by someone else since.
    const member = choice.kind === 'member' ? findMember(group, choice.memberId) : undefined;
    return member ? { kind: 'member', member } : { kind: 'onlooker' };
  });
  const balances = $derived(computeBalances(group.members, ledger));
  const payments = $derived(ledger.filter((entry) => entry.kind === 'payment'));
  const transfers = $derived(settleUpAfterPayments(balances.netByMember, payments));

  let selectedTab = $state<Tab>('expenses');
  let openSheet = $state<OpenSheet>(firstSheet());

  $effect(() => {
    document.title = group.name;
    showGroupNameInAddress(group);
  });

  function firstSheet(): OpenSheet {
    const shouldAskWhoTheyAre = viewer.kind === 'onlooker' && group.members.length > 0;
    return shouldAskWhoTheyAre ? { name: 'whoAreYou', then: { name: 'none' } } : { name: 'none' };
  }

  function closeSheet() {
    openSheet = { name: 'none' };
  }

  /** Changes are logged under a name, so they need the viewer to have picked one. */
  function asMember(nextSheet: OpenSheet) {
    openSheet = viewer.kind === 'member' ? nextSheet : { name: 'whoAreYou', then: nextSheet };
  }

  function becomeMember(member: Member) {
    storeChosenMemberId(group.id, member.id);
    openSheet = openSheet.name === 'whoAreYou' ? openSheet.then : { name: 'none' };
    showToast(`You are ${member.name}`);
    if (consumeCreatedHere(group.id)) {
      const creation: ActivityDraft = { actor: member, change: { kind: 'groupCreated' } };
      saveInBackground(recordActivity(group.id, creation));
    }
  }

  function showItemsOf(memberId: string) {
    openSheet = { name: 'memberItems', memberId };
  }

  function justLook() {
    const wasMember = viewer.kind === 'member';
    clearChosenMemberId(group.id);
    closeSheet();
    if (wasMember) showToast('View only. Pick your name to make changes.');
  }

  function openLedgerEntry(entry: LedgerEntry) {
    asMember(entry.kind === 'payment' ? { name: 'payment', payment: entry } : { name: 'editExpense', expense: entry });
  }

  function openActivityEntry({ change }: ActivityEntry) {
    switch (change.kind) {
      case 'expenseAdded':
      case 'expenseEdited':
      case 'expenseDeleted':
        return openLoggedLedgerEntry(change.expenseId, 'expense');
      case 'paymentRecorded':
      case 'paymentDeleted':
        return openLoggedLedgerEntry(change.paymentId, 'payment');
      default:
        return asMember({ name: 'editGroup' });
    }
  }

  function openLoggedLedgerEntry(entryId: string, kindName: 'expense' | 'payment') {
    const entry = ledger.find((candidate) => candidate.id === entryId);
    if (entry) openLedgerEntry(entry);
    else showToast(`That ${kindName} has been deleted.`);
  }
</script>

<GroupHeader
  groupName={group.name}
  updatedAtMillis={group.updatedAtMillis}
  {viewer}
  onSwitchGroup={() => (openSheet = { name: 'groups' })}
  onChooseIdentity={() => (openSheet = { name: 'whoAreYou', then: { name: 'none' } })}
  onEditGroup={() => asMember({ name: 'editGroup' })}
  onShare={() => (openSheet = { name: 'share' })}
/>

<main class="screen-main">
  {#if viewer.kind === 'member'}
    <SummaryHero member={viewer.member} {balances} onShowMyItems={showItemsOf} />
  {/if}

  <div class="tabs" role="tablist">
    {#each TABS as tab (tab)}
      <button role="tab" aria-selected={selectedTab === tab} onclick={() => (selectedTab = tab)}>{tab}</button>
    {/each}
  </div>

  {#if selectedTab === 'expenses'}
    <ExpensesTab {group} {ledger} {unsyncedEntryIds} {viewer} onOpenEntry={openLedgerEntry} />
  {:else if selectedTab === 'balances'}
    <BalancesTab
      {group}
      {balances}
      {transfers}
      {viewer}
      onShowItems={showItemsOf}
      onSettle={(transfer) => asMember({ name: 'confirmSettle', fromId: transfer.fromId, toId: transfer.toId })}
    />
  {:else}
    <ActivityTab {group} {activity} {viewer} onOpenEntry={openActivityEntry} />
  {/if}
</main>

<footer>
  <button class="primary-action" onclick={() => asMember({ name: 'addExpense' })}>
    <span aria-hidden="true">+</span> Add expense
  </button>
</footer>

{#if openSheet.name === 'whoAreYou'}
  <WhoAreYouSheet {group} {viewer} onBecomeMember={becomeMember} onJustLook={justLook} onClose={closeSheet} />
{:else if openSheet.name === 'groups'}
  <GroupsSheet currentGroupId={group.id} onNewGroup={() => (openSheet = { name: 'newGroup' })} onClose={closeSheet} />
{:else if openSheet.name === 'newGroup'}
  <NewGroupSheet
    memberSuggestion={{ kind: 'sameAs', groupName: group.name, memberNames: group.members.map((member) => member.name) }}
    onClose={closeSheet}
  />
{:else if openSheet.name === 'share'}
  <ShareSheet {group} {transfers} onClose={closeSheet} />
{:else if openSheet.name === 'memberItems'}
  <MemberItemsSheet {group} {ledger} {viewer} memberId={openSheet.memberId} onOpenExpense={openLedgerEntry} onClose={closeSheet} />
{:else if viewer.kind === 'member'}
  {#if openSheet.name === 'editGroup'}
    <EditGroupSheet {group} {ledger} actor={viewer.member} onClose={closeSheet} />
  {:else if openSheet.name === 'addExpense'}
    <ExpenseSheet {group} {ledger} actor={viewer.member} editing={{ kind: 'new' }} onClose={closeSheet} />
  {:else if openSheet.name === 'editExpense'}
    <ExpenseSheet {group} {ledger} actor={viewer.member} editing={{ kind: 'existing', expense: openSheet.expense }} onClose={closeSheet} />
  {:else if openSheet.name === 'payment'}
    <PaymentSheet {group} actor={viewer.member} payment={openSheet.payment} onClose={closeSheet} />
  {:else if openSheet.name === 'confirmSettle'}
    <ConfirmSettleSheet {group} actor={viewer.member} fromId={openSheet.fromId} toId={openSheet.toId} {transfers} onClose={closeSheet} />
  {/if}
{/if}

<style>
  .tabs {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 3px;
    position: sticky;
    top: 8px;
    z-index: 2;
  }
  .tabs button {
    height: 36px;
    border-radius: 11px;
    font-weight: 600;
    font-size: 14px;
    color: var(--muted);
    text-transform: capitalize;
  }
  .tabs button[aria-selected='true'] {
    background: var(--ink);
    color: var(--bg);
  }
  footer {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    max-width: 540px;
    margin: 0 auto;
    padding: 0 16px 16px;
    z-index: 5;
  }
</style>
