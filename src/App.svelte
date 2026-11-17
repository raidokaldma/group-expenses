<script lang="ts">
  import GroupScreen from './features/group/GroupScreen.svelte';
  import HomeScreen from './features/home/HomeScreen.svelte';
  import { currentRoute } from './routing/route.svelte';
  import OfflineBanner from './ui/OfflineBanner.svelte';
  import Toast from './ui/Toast.svelte';
  import UpdateNotice from './ui/UpdateNotice.svelte';

  const route = $derived(currentRoute());
</script>

<OfflineBanner />
<UpdateNotice />
{#if route.name === 'group'}
  {#key route.groupId}
    <GroupScreen groupId={route.groupId} />
  {/key}
{:else}
  <HomeScreen />
{/if}
<Toast />
