import { showToast } from './toastMessage.svelte';

/**
 * A change shows on this device at once and reaches the server whenever there is a connection,
 * which can be much later, so nothing waits for it. If the server rejects it, Firestore undoes it locally.
 */
export function saveInBackground(save: Promise<void>) {
  save.catch((error) => {
    console.error(error);
    showToast('A change could not be saved and was undone.');
  });
}
