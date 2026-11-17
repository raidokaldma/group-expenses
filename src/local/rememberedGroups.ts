import { readStoredText, writeStoredText } from './deviceStorage';

// The database can't list groups, so the group switcher shows the ones this device has opened.

export type RememberedGroup = { id: string; name: string };

const STORAGE_KEY = 'groupExpenses.groups';

function isRememberedGroup(value: unknown): value is RememberedGroup {
  const group = value as RememberedGroup;
  return typeof group?.id === 'string' && typeof group?.name === 'string';
}

/** Most recently opened first. */
export function listRememberedGroups(): RememberedGroup[] {
  try {
    const stored: unknown = JSON.parse(readStoredText(STORAGE_KEY) ?? '[]');
    return Array.isArray(stored) ? stored.filter(isRememberedGroup) : [];
  } catch {
    return [];
  }
}

export function rememberGroup(group: RememberedGroup) {
  const otherGroups = listRememberedGroups().filter((remembered) => remembered.id !== group.id);
  writeStoredText(STORAGE_KEY, JSON.stringify([{ id: group.id, name: group.name }, ...otherGroups]));
}

export function forgetGroup(groupId: string) {
  const otherGroups = listRememberedGroups().filter((remembered) => remembered.id !== groupId);
  writeStoredText(STORAGE_KEY, JSON.stringify(otherGroups));
}
