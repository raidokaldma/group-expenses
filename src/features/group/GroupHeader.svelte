<script lang="ts">
  import { dayAndTime } from '../../shared/dates';
  import type { Viewer } from '../../shared/types';
  import { currentDay } from '../../ui/currentDay.svelte';
  import Avatar from '../../ui/Avatar.svelte';
  import ThemeToggle from '../../ui/ThemeToggle.svelte';

  type Props = {
    groupName: string;
    updatedAtMillis: number;
    viewer: Viewer;
    onSwitchGroup: () => void;
    onChooseIdentity: () => void;
    onEditGroup: () => void;
    onShare: () => void;
  };
  let { groupName, updatedAtMillis, viewer, onSwitchGroup, onChooseIdentity, onEditGroup, onShare }: Props = $props();
</script>

<header class="screen-header">
  <div class="header-row">
    <button class="group-switcher" onclick={onSwitchGroup} aria-label="Switch group">
      <span>{groupName}</span>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>
    {#if viewer.kind === 'member'}
      <button class="identity" onclick={onChooseIdentity} aria-label="You are {viewer.member.name}. Change">
        <Avatar name={viewer.member.name} colorIndex={viewer.member.colorIndex} size="small" />
        <span class="identity-name">{viewer.member.name}</span>
      </button>
    {:else}
      <button class="identity unknown" onclick={onChooseIdentity}>Who are you?</button>
    {/if}
    <ThemeToggle />
  </div>
  <div class="header-row">
    <button class="pill" onclick={onEditGroup}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
      </svg>
      Edit group
    </button>
    <button class="pill" onclick={onShare}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13" />
      </svg>
      Share
    </button>
    <span class="updated">Updated {dayAndTime(updatedAtMillis, currentDay())}</span>
  </div>
</header>

<style>
  .group-switcher {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    flex: 1;
    font: 700 22px/1.15 var(--display);
    text-align: left;
  }
  .group-switcher span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .group-switcher svg {
    flex: none;
    color: var(--muted);
  }
  .identity {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 38px;
    padding: 0 12px 0 4px;
    border-radius: 19px;
    background: var(--surface);
    border: 1px solid var(--line);
    font-weight: 500;
    flex: none;
    max-width: 150px;
  }
  .identity-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .identity.unknown {
    padding: 0 12px;
    background: var(--accent);
    color: var(--accent-ink);
    border-color: transparent;
  }
  .updated {
    margin-left: auto;
    font-size: 12px;
    color: var(--muted);
    text-align: right;
  }
  .pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 36px;
    padding: 0 14px;
    border-radius: 18px;
    background: var(--surface);
    border: 1px solid var(--line);
    font-weight: 600;
    font-size: 14px;
  }
</style>
