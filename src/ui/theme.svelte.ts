import { readStoredText, writeStoredText } from '../local/deviceStorage';

type ThemeChoice = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'groupExpenses.theme';
const systemDarkQuery = matchMedia('(prefers-color-scheme: dark)');

function readStoredChoice(): ThemeChoice {
  const stored = readStoredText(STORAGE_KEY);
  return stored === 'light' || stored === 'dark' ? stored : 'system';
}

let choice = $state<ThemeChoice>(readStoredChoice());
let systemIsDark = $state(systemDarkQuery.matches);

systemDarkQuery.addEventListener('change', (event) => {
  systemIsDark = event.matches;
  matchBrowserBarsToPage();
});

/** The phone's status bar, and the bars around the installed app, take their colour from the theme-color meta tag. */
function matchBrowserBarsToPage() {
  const pageBackground = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  if (pageBackground === '') return;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', pageBackground);
}

function applyChoice() {
  if (choice === 'system') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = choice;
  matchBrowserBarsToPage();
}

applyChoice();

export function isDarkTheme(): boolean {
  return choice === 'system' ? systemIsDark : choice === 'dark';
}

export function toggleTheme() {
  choice = isDarkTheme() ? 'light' : 'dark';
  writeStoredText(STORAGE_KEY, choice);
  applyChoice();
}
