export type Day<Item> = { date: string; items: Item[] };

/** Expects items already sorted by day, so each day's items are next to each other. */
export function groupByDay<Item>(sortedItems: Item[], dayOf: (item: Item) => string): Day<Item>[] {
  const days: Day<Item>[] = [];
  for (const item of sortedItems) {
    const date = dayOf(item);
    const lastDay = days.at(-1);
    if (lastDay?.date === date) lastDay.items.push(item);
    else days.push({ date, items: [item] });
  }
  return days;
}
