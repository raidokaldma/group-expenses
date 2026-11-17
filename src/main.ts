import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';
import { listRememberedGroups } from './local/rememberedGroups';
import { currentRoute, replaceWithGroup } from './routing/route.svelte';

// Returning visitors land straight in the group they opened last.
const lastOpenedGroup = listRememberedGroups()[0];
if (currentRoute().name === 'home' && lastOpenedGroup) {
  replaceWithGroup(lastOpenedGroup);
}

mount(App, { target: document.getElementById('app')! });
