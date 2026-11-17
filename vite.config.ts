import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ command, mode }) => {
  // Without this a build succeeds and the deployed app fails at runtime. Tests run without Firebase.
  if (command === 'build' && !loadEnv(mode, process.cwd()).VITE_FIREBASE_PROJECT_ID) {
    throw new Error(`VITE_FIREBASE_PROJECT_ID is missing: create .env.${mode} from .env.example.`);
  }
  return {
    plugins: [
      svelte(),
      // Service worker that keeps the built app and its fonts on the device, so the page opens offline,
      // and the manifest that makes it installable.
      VitePWA({
        // A downloaded update waits until the user taps Reload in the update notice.
        registerType: 'prompt',
        includeAssets: ['icon.svg', 'apple-touch-icon.png'],
        manifest: {
          name: 'Group expenses',
          short_name: 'Expenses',
          description: 'Split expenses for a trip or an event. No sign-up, just share the link.',
          start_url: '/',
          display: 'standalone',
          // The dark page background; once the app is running, the theme-color meta tag follows the actual theme.
          background_color: '#0d111b',
          theme_color: '#0d111b',
          icons: [
            { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
            // The mark sits inside the centre safe zone, so the same image works when Android crops it to a shape.
            { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          navigateFallback: '/index.html',
          runtimeCaching: [
            { urlPattern: /^https:\/\/fonts\.googleapis\.com\//, handler: 'StaleWhileRevalidate' },
            { urlPattern: /^https:\/\/fonts\.gstatic\.com\//, handler: 'CacheFirst' },
          ],
        },
      }),
    ],
  };
});
