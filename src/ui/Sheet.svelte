<script lang="ts" module>
  // Sheets overlap briefly while one replaces another, so the block is counted.
  let openSheetCount = 0;

  const OVERLAY_CLASSES = ['scrim', 'sheet', 'toast'];

  function elementsBehindSheets(): Element[] {
    return [...(document.getElementById('app')?.children ?? [])].filter(
      (element) => !OVERLAY_CLASSES.some((overlayClass) => element.classList.contains(overlayClass)),
    );
  }

  /** While a sheet is open the page behind it can't scroll, be clicked or be reached with Tab. */
  function blockPageBehind() {
    openSheetCount++;
    document.documentElement.classList.add('scroll-locked');
    for (const element of elementsBehindSheets()) element.toggleAttribute('inert', true);
  }

  function unblockPageBehind() {
    openSheetCount--;
    if (openSheetCount > 0) return;
    document.documentElement.classList.remove('scroll-locked');
    for (const element of elementsBehindSheets()) element.toggleAttribute('inert', false);
  }
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';
  import { fade, fly } from 'svelte/transition';

  type Props = { title: string; onClose: () => void; children: Snippet };
  let { title, onClose, children }: Props = $props();

  const slideMillis = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 220;

  let sheetElement: HTMLDivElement;

  $effect(() => {
    // Focus moves into the sheet so Tab continues from there, and returns to where it was on close.
    const focusedBeforeOpening = document.activeElement;
    blockPageBehind();
    sheetElement.focus({ preventScroll: true });
    return () => {
      unblockPageBehind();
      if (focusedBeforeOpening instanceof HTMLElement && focusedBeforeOpening.isConnected) {
        focusedBeforeOpening.focus({ preventScroll: true });
      }
    };
  });

  function closeOnEscape(event: KeyboardEvent) {
    if (event.key === 'Escape') onClose();
  }
</script>

<svelte:window onkeydown={closeOnEscape} />

<!-- Global, so a sheet still slides when it opens inside a block that is itself being created, like one sheet replacing another. -->
<div class="scrim" onclick={onClose} transition:fade|global={{ duration: slideMillis }} role="presentation"></div>
<div class="sheet" role="dialog" aria-modal="true" aria-label={title} tabindex="-1" bind:this={sheetElement} transition:fly|global={{ y: 500, duration: slideMillis, opacity: 1 }}>
  <div class="sheet-head">
    <h2>{title}</h2>
    <button class="close" onclick={onClose} aria-label="Close">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <path d="M6 6l12 12M18 6 6 18" />
      </svg>
    </button>
  </div>
  {@render children()}
</div>

<style>
  :global(html.scroll-locked),
  :global(html.scroll-locked body) {
    overflow: hidden;
  }
  .scrim {
    position: fixed;
    inset: 0;
    background: rgba(8, 12, 24, 0.5);
    z-index: 10;
    touch-action: none;
  }
  .sheet {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    margin: 0 auto;
    max-width: 540px;
    max-height: 92%;
    overflow-y: auto;
    overscroll-behavior: contain;
    background: var(--surface);
    border-radius: 22px 22px 0 0;
    padding: 0 16px 18px;
    z-index: 11;
    box-shadow: 0 -8px 40px rgba(0, 0, 0, 0.25);
  }
  /* Focused only to give Tab a starting point; the sheet itself needs no ring. */
  .sheet:focus {
    outline: none;
  }
  .sheet-head {
    position: sticky;
    top: 0;
    z-index: 3;
    background: var(--surface);
    margin: 0 -16px;
    padding: 14px 16px 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  h2 {
    margin: 0;
    font: 700 21px var(--display);
    text-wrap: balance;
  }
  .close {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: var(--bg);
    display: grid;
    place-items: center;
    flex: none;
  }
</style>
