<script lang="ts">
  import ThemeToggle from './ThemeToggle.svelte';
</script>

<header class="screen-header">
  <div class="header-row">
    <h1 class="title">Group expenses</h1>
    <ThemeToggle />
  </div>
</header>

<style>
  .title {
    flex: 1;
    min-width: 0;
    margin: 0;
    font: 700 22px/1.15 var(--display);
  }
</style>
