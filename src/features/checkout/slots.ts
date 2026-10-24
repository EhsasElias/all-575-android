import type { Language } from '@/shared/i18n';
import type { Slot } from './api';
import { formatRiyadhDay, formatRiyadhTime, riyadhDayKey } from './riyadhTime';

export type SlotDay = { key: string; label: string; slots: Slot[] };

/** Slots grouped by Saudi calendar day, in the order the server sent them. */
export function groupSlotsByDay(slots: readonly Slot[], language: Language): SlotDay[] {
  const days = new Map<string, SlotDay>();
  for (const slot of slots) {
    const key = riyadhDayKey(slot.starts_at);
    const day = days.get(key) ?? {
      key,
      label: formatRiyadhDay(slot.starts_at, language),
      slots: [],
    };
    day.slots.push(slot);
    days.set(key, day);
  }
  return [...days.values()];
}

/** "9:00 AM – 11:00 AM" */
export function describeSlotTimes(slot: Slot, language: Language): string {
  return `${formatRiyadhTime(slot.starts_at, language)} – ${formatRiyadhTime(slot.ends_at, language)}`;
}
