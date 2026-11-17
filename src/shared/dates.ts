export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function todayIsoDate(): string {
  return toIsoDate(new Date());
}

export function yesterdayIsoDate(): string {
  return dayBefore(todayIsoDate());
}

function dayBefore(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return toIsoDate(new Date(year, month - 1, day - 1));
}

/** "today" is passed in, so labels can be redrawn when the day changes. */
export function dayLabel(isoDate: string, today: string): string {
  if (isoDate === today) return 'Today';
  if (isoDate === dayBefore(today)) return 'Yesterday';
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return 'No date';
  const isThisYear = isoDate.slice(0, 4) === today.slice(0, 4);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: isThisYear ? undefined : 'numeric',
  });
}

/** For example "today, 14:32" or "Mon, 16 Nov, 14:32". */
export function dayAndTime(timestampMillis: number, today: string): string {
  const day = dayLabel(toIsoDate(new Date(timestampMillis)), today);
  const dayInSentence = day === 'Today' || day === 'Yesterday' ? day.toLowerCase() : day;
  return `${dayInSentence}, ${timeOfDay(timestampMillis)}`;
}

export function timeOfDay(timestampMillis: number): string {
  return new Date(timestampMillis).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}
