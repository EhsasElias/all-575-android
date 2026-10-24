import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { TextField } from '@/shared/ui';
import type { DateRange } from '../types';
import type { Period } from './usePeriodFilter';
import styles from './PeriodFilter.module.css';

const PERIODS: readonly Period[] = ['week', 'month', 'custom'];

type PeriodFilterProps = {
  period: Period;
  range: DateRange;
  today: string;
  usable: boolean;
  onSelect: (period: Period) => void;
  onChangeDay: (edge: keyof DateRange, day: string) => void;
};

/** Radio buttons that look like chips: the arrow keys and screen readers work as for any radio group. */
export function PeriodFilter({
  period,
  range,
  today,
  usable,
  onSelect,
  onChangeDay,
}: PeriodFilterProps) {
  const { t } = useTranslation('orders');
  const groupName = useId();
  const endBeforeStart = range.from !== '' && range.to !== '' && range.to < range.from;

  return (
    <div className={styles.filter}>
      <fieldset className={styles.group}>
        <legend className={styles.legend}>{t('spending.period')}</legend>
        <div className={styles.chips}>
          {PERIODS.map((option) => (
            <label key={option} className={styles.chip}>
              <input
                type="radio"
                name={groupName}
                value={option}
                checked={period === option}
                onChange={() => {
                  onSelect(option);
                }}
                className={styles.input}
              />
              <span className={styles.face}>{t(`spending.periods.${option}`)}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {period === 'custom' && (
        <div className={styles.dates}>
          <TextField
            type="date"
            label={t('spending.from')}
            value={range.from}
            max={today}
            onChange={(event) => {
              onChangeDay('from', event.target.value);
            }}
          />
          <TextField
            type="date"
            label={t('spending.to')}
            value={range.to}
            max={today}
            {...(endBeforeStart ? { error: t('spending.endBeforeStart') } : {})}
            onChange={(event) => {
              onChangeDay('to', event.target.value);
            }}
          />
        </div>
      )}
      {period === 'custom' && !usable && !endBeforeStart && (
        <p role="status" className={styles.hint}>
          {t('spending.pickDates')}
        </p>
      )}
    </div>
  );
}
