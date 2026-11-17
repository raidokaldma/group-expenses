<script lang="ts">
  import type { Member } from '../shared/types';
  import Avatar from './Avatar.svelte';

  type Props = { member: Member; selected: boolean; onSelect: () => void };
  let { member, selected, onSelect }: Props = $props();
</script>

<button type="button" class="chip member-chip" aria-pressed={selected} onclick={onSelect}>
  <Avatar name={member.name} colorIndex={member.colorIndex} size="small" />
  <span class="label">{member.name}</span>
</button>

<style>
  .member-chip {
    padding: 0 12px 0 5px;
  }
  .label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
