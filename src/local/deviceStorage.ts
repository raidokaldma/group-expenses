// localStorage throws in some private modes; the app must still work without it.

export function readStoredText(key: string): string | undefined {
  try {
    return localStorage.getItem(key) ?? undefined;
  } catch {
    return undefined;
  }
}

export function writeStoredText(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Not remembered on this device.
  }
}

export function removeStoredText(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Nothing was stored.
  }
}
