import { useState } from 'react';
import { isUsableRange, presetRange, todayInRiyadh, type PresetPeriod } from '../format/period';
import type { DateRange } from '../types';

export type Period = PresetPeriod | 'custom';

const DEFAULT_PERIOD: PresetPeriod = 'month';

/** The period the report is about: last 7 days, last 30 days, or two dates the customer picks. */
export function usePeriodFilter() {
  const [now] = useState(() => new Date());
  const [period, setPeriod] = useState<Period>(DEFAULT_PERIOD);
  const [custom, setCustom] = useState<DateRange>(() => presetRange(DEFAULT_PERIOD, new Date()));

  const range = period === 'custom' ? custom : presetRange(period, now);

  return {
    period,
    range,
    /** False while custom dates are incomplete or the end is before the start. */
    usable: isUsableRange(range),
    today: todayInRiyadh(now),
    select: (next: Period) => {
      // Switching to "custom" starts from the dates the customer was just looking at.
      if (next === 'custom') setCustom(range);
      setPeriod(next);
    },
    setCustomDay: (edge: keyof DateRange, day: string) => {
      setCustom((current) => ({ ...current, [edge]: day }));
    },
  };
}
