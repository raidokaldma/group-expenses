// The browser reports "online" whenever a network is connected, even one without internet access.
let online = $state(navigator.onLine);

window.addEventListener('online', () => (online = true));
window.addEventListener('offline', () => (online = false));

export function isOnline(): boolean {
  return online;
}
