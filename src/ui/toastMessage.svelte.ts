const VISIBLE_MILLIS = 2600;

type Toast = { state: 'hidden' } | { state: 'shown'; text: string };

let toast = $state<Toast>({ state: 'hidden' });
let hideTimer: ReturnType<typeof setTimeout>;

export function currentToast(): Toast {
  return toast;
}

export function showToast(text: string) {
  toast = { state: 'shown', text };
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    toast = { state: 'hidden' };
  }, VISIBLE_MILLIS);
}
