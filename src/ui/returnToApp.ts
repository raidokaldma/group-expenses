/** Runs the callback whenever the app comes back to the foreground, like reopening the browser on a phone. */
export function onReturnToApp(callback: () => void) {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') callback();
  });
}
