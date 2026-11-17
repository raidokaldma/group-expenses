import { todayIsoDate } from '../shared/dates';
import { onReturnToApp } from './returnToApp';

// Labels like "Today" are drawn against this, so they turn into "Yesterday" when the app is reopened the next day.
let today = $state(todayIsoDate());

onReturnToApp(() => {
  today = todayIsoDate();
});

export function currentDay(): string {
  return today;
}
