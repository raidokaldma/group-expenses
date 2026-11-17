import { groupSlug } from './groupSlug';

export type Route = { name: 'home' } | { name: 'group'; groupId: string };

type GroupAddress = { id: string; name: string };

// /g/{groupId}/{slug}: only the ID identifies the group. The slug is for humans and may be stale or missing.
function parseRoute(path: string): Route {
  const groupMatch = /^\/g\/([A-Za-z0-9]+)(?:\/[^/]*)?\/?$/.exec(path);
  return groupMatch ? { name: 'group', groupId: groupMatch[1] } : { name: 'home' };
}

function groupPath(group: GroupAddress): string {
  const slug = groupSlug(group.name);
  return slug === '' ? `/g/${group.id}` : `/g/${group.id}/${slug}`;
}

let route = $state<Route>(parseRoute(location.pathname));

window.addEventListener('popstate', () => {
  route = parseRoute(location.pathname);
});

export function currentRoute(): Route {
  return route;
}

export function groupLink(group: GroupAddress): string {
  return location.origin + groupPath(group);
}

export function navigateToGroup(group: GroupAddress) {
  history.pushState(null, '', groupPath(group));
  route = { name: 'group', groupId: group.id };
}

/** For redirects that shouldn't leave the start page in the back history. */
export function replaceWithGroup(group: GroupAddress) {
  history.replaceState(null, '', groupPath(group));
  route = { name: 'group', groupId: group.id };
}

/** Keeps the address bar's slug in step with the group's current name. */
export function showGroupNameInAddress(group: GroupAddress) {
  const path = groupPath(group);
  if (location.pathname !== path) history.replaceState(null, '', path);
}

export function navigateHome() {
  history.pushState(null, '', '/');
  route = { name: 'home' };
}
