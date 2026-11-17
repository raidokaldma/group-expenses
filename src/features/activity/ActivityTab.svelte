<script lang="ts">
  import { dayLabel, timeOfDay, toIsoDate } from '../../shared/dates';
  import { groupByDay } from '../../shared/groupByDay';
  import { currentVersionOf } from '../../shared/members';
  import type { ActivityEntry, Group, Viewer } from '../../shared/types';
  import { currentDay } from '../../ui/currentDay.svelte';
  import Avatar from '../../ui/Avatar.svelte';
  import { affectsMember } from './affectsMember';
  import { membersOfChange } from './membersOfChange';
  import { describeChange } from './describeChange';

  const SHOWN_INVOLVED_AVATARS = 6;

  type Shown = 'everything' | 'affectingMe';

  type Props = {
    group: Group;
    activity: ActivityEntry[];
    viewer: Viewer;
    onOpenEntry: (entry: ActivityEntry) => void;
  };
  let { group, activity, viewer, onOpenEntry }: Props = $props();

  let shown = $state<Shown>('everything');

  const rows = $derived(activity.map((entry) => ({ entry, involved: membersOfChange(entry.change, group) })));

  const shownRows = $derived.by(() => {
    if (shown === 'everything' || viewer.kind !== 'member') return rows;
    const memberId = viewer.member.id;
    return rows.filter((row) => affectsMember(row.entry, memberId, row.involved));
  });

  // Activity arrives newest first, so it is already sorted by day.
  const days = $derived(groupByDay(shownRows, (row) => toIsoDate(new Date(row.entry.createdAtMillis))));
</script>

{#if viewer.kind === 'member' && activity.length > 0}
  <div class="chips">
    <button class="chip" aria-pressed={shown === 'everything'} onclick={() => (shown = 'everything')}>Everything</button>
    <button class="chip" aria-pressed={shown === 'affectingMe'} onclick={() => (shown = 'affectingMe')}>Affects me</button>
  </div>
{/if}

{#each days as day (day.date)}
  <div class="day-label">{dayLabel(day.date, currentDay())}</div>
  <div class="list">
    {#each day.items as { entry, involved } (entry.id)}
      {@const actor = currentVersionOf(group, entry.actor)}
      <button class="row" onclick={() => onOpenEntry(entry)}>
        <Avatar name={actor.name} colorIndex={actor.colorIndex} />
        <span class="row-main">
          <span class="text"><b>{actor.name}</b> {describeChange(entry.change, group)}</span>
          <span class="row-detail">
            {#if involved.length > 0}
              <span class="involved">
                {#each involved.slice(0, SHOWN_INVOLVED_AVATARS) as involvedMember (involvedMember.id)}
                  <Avatar name={involvedMember.name} colorIndex={involvedMember.colorIndex} size="tiny" />
                {/each}
              </span>
              {#if involved.length > SHOWN_INVOLVED_AVATARS}+{involved.length - SHOWN_INVOLVED_AVATARS}{/if}
              ·
            {/if}
            {timeOfDay(entry.createdAtMillis)}
          </span>
        </span>
      </button>
    {/each}
  </div>
{:else}
  {#if activity.length > 0}
    <div class="empty"><b>Nothing about you yet</b>Changes you make, and changes to expenses you are part of, show up here.</div>
  {:else}
    <div class="empty"><b>Nothing yet</b>Changes to this group show up here.</div>
  {/if}
{/each}

<style>
  .text {
    overflow-wrap: anywhere;
  }
  .involved {
    display: inline-flex;
  }
  .involved :global(.avatar + .avatar) {
    margin-left: -5px;
  }
</style>
