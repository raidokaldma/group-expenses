import { showToast } from './toastMessage.svelte';

export type SaveOutcome = 'saved' | 'failed';

export async function attemptSave(save: () => Promise<void>, successMessage?: string): Promise<SaveOutcome> {
  try {
    await save();
  } catch (error) {
    console.error(error);
    showToast('Not saved. Check your connection and try again.');
    return 'failed';
  }
  if (successMessage) showToast(successMessage);
  return 'saved';
}
