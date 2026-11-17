import { registerSW } from 'virtual:pwa-register';
import { onReturnToApp } from './returnToApp';

// The service worker serves the cached app first, so a new deploy only shows after a reload.
// It downloads the new version in the background and reports here when it is ready.
// Browsers check for a new version only now and then, so the app also asks whenever it is reopened.

type AppUpdate = 'none' | 'ready';

let appUpdate = $state<AppUpdate>('none');

const activateNewVersion = registerSW({
  onNeedRefresh() {
    appUpdate = 'ready';
  },
  onRegisteredSW(_serviceWorkerUrl, registration) {
    if (registration) onReturnToApp(() => registration.update().catch(() => {}));
  },
});

export function isAppUpdateReady(): boolean {
  return appUpdate === 'ready';
}

export function reloadIntoNewVersion() {
  activateNewVersion(true);
}
