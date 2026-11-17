<script lang="ts">
  import { groupLink } from '../../routing/route.svelte';
  import type { Transfer } from '../../shared/money/settleUp';
  import type { Group } from '../../shared/types';
  import Sheet from '../../ui/Sheet.svelte';
  import { showToast } from '../../ui/toastMessage.svelte';
  import { shareSummary } from './shareSummary';

  type Props = { group: Group; transfers: Transfer[]; onClose: () => void };
  let { group, transfers, onClose }: Props = $props();

  const link = $derived(groupLink(group));
  const summary = $derived(shareSummary(group, transfers, link));
  const summaryRows = $derived(Math.min(14, summary.split('\n').length + 1));

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied');
    } catch {
      showToast('Copying does not work (HTTP)');
    }
  }
</script>

<Sheet title="Share" {onClose}>
  <div class="column">
    <label class="field-label" for="share-link">Link to this group</label>
    <div class="input-row">
      <input class="input" id="share-link" readonly value={link} />
      <button class="button compact fit" onclick={() => copy(link)}>Copy</button>
    </div>
    <label class="field-label" for="share-summary">Summary for a chat</label>
    <textarea class="input summary" id="share-summary" readonly rows={summaryRows} value={summary}></textarea>
    <div class="actions">
      <button class="button primary" onclick={() => copy(summary)}>Copy summary</button>
    </div>
  </div>
</Sheet>

<style>
  .summary {
    height: auto;
    padding: 10px 12px;
    resize: none;
    font: 13px/1.45 ui-monospace, Menlo, Consolas, monospace;
  }
</style>
