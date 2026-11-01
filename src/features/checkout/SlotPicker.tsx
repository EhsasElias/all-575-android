import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/shared/i18n';
import { ErrorState, Icon, Skeleton } from '@/shared/ui';
import type { Slot } from './api';
import section from './section.module.css';
import { describeSlotTimes, groupSlotsByDay } from './slots';
import styles from './SlotPicker.module.css';

type SlotPickerProps = {
  hasAddress: boolean;
  slots: readonly Slot[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  selectedId: number | null;
  onSelect: (slotId: number) => void;
  onClearSelection: () => void;
};

function shiftMonth(month: string, amount: number): string {
  const [year = 1970, number = 1] = month.split('-').map(Number);
  const shifted = new Date(Date.UTC(year, number - 1 + amount, 1));
  return shifted.toISOString().slice(0, 7);
}

function datesInMonth(month: string): (string | null)[] {
  const [year = 1970, number = 1] = month.split('-').map(Number);
  const prefix = Array<string | null>(
    new Date(Date.UTC(year, number - 1, 1)).getUTCDay(),
  ).fill(null);
  const count = new Date(Date.UTC(year, number, 0)).getUTCDate();
  for (let day = 1; day <= count; day++) {
    prefix.push(month + '-' + String(day).padStart(2, '0'));
  }
  return prefix;
}

export function SlotPicker({
  hasAddress, slots, isLoading, isError, onRetry,
  selectedId, onSelect, onClearSelection,
}: SlotPickerProps) {
  const { t } = useTranslation('checkout');
  const { language } = useLanguage();
  const headingId = useId();
  const days = groupSlotsByDay(slots, language);
  const availableDays = days.filter(day => day.slots.some(slot => slot.available));
  const selectedSlotDay = days.find(day => day.slots.some(slot => slot.id === selectedId))?.key;
  const [requestedDay, setRequestedDay] = useState<string | null>(null);
  const [requestedMonth, setRequestedMonth] = useState<string | null>(null);

  const activeDay = selectedSlotDay ??
    availableDays.find(day => day.key === requestedDay)?.key ??
    availableDays[0]?.key ?? null;
  const firstMonth = availableDays[0]?.key.slice(0, 7);
  const lastMonth = availableDays[availableDays.length - 1]?.key.slice(0, 7);
  const month = requestedMonth !== null &&
    firstMonth !== undefined && lastMonth !== undefined &&
    requestedMonth >= firstMonth && requestedMonth <= lastMonth
      ? requestedMonth : activeDay?.slice(0, 7) ?? '';

  const locale = language === 'ar' ? 'ar-SA' : language === 'fr' ? 'fr-FR' : 'en-US';
  const monthLabel = month
    ? new Intl.DateTimeFormat(locale, {
        month: 'long', year: 'numeric', calendar: 'gregory', numberingSystem: 'latn',
        timeZone: 'UTC',
      }).format(new Date(month + '-01T12:00:00Z'))
    : '';
  const weekdays = Array.from({ length: 7 }, (_, day) =>
    new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' })
      .format(new Date(Date.UTC(2023, 0, 1 + day))),
  );
  const visible = days.find(day => day.key === activeDay);
  const isAvailable = (key: string) =>
    days.some(day => day.key === key && day.slots.some(slot => slot.available));
  const chooseDay = (key: string) => {
    if (key === activeDay) return;
    onClearSelection();
    setRequestedDay(key);
  };

  const labels = {
    date: language === 'ar' ? 'اختر تاريخ التوصيل' : language === 'fr' ? 'Choisir la date' : 'Choose delivery date',
    time: language === 'ar' ? 'اختر فترة التوصيل' : language === 'fr' ? 'Choisir le créneau' : 'Choose delivery time',
    previous: language === 'ar' ? 'الشهر السابق' : 'Previous month',
    next: language === 'ar' ? 'الشهر التالي' : 'Next month',
  };

  return (
    <section className={section.section} aria-labelledby={headingId}>
      <h2 id={headingId} className={section.heading}>{t('slots.heading')}</h2>
      {!hasAddress && <p className={section.hint}>{t('slots.needAddress')}</p>}
      {hasAddress && isLoading && (
        <div role="status" aria-busy="true" aria-label={t('slots.loading')}>
          <Skeleton height="12rem" />
        </div>
      )}
      {hasAddress && isError && <ErrorState headingLevel={3} onRetry={onRetry} />}
      {hasAddress && !isLoading && !isError && availableDays.length === 0 && (
        <p className={section.hint}>{t('slots.none')}</p>
      )}
      {hasAddress && !isLoading && !isError && availableDays.length > 0 && (
        <div className={styles.calendar}>
          <h3 className={styles.label}>{labels.date}</h3>
          <div className={styles.monthHeader}>
            <button type="button" className={styles.navButton}
              aria-label={labels.previous} disabled={!firstMonth || month <= firstMonth}
              onClick={() => setRequestedMonth(shiftMonth(month, -1))}>‹</button>
            <strong>{monthLabel}</strong>
            <button type="button" className={styles.navButton}
              aria-label={labels.next} disabled={!lastMonth || month >= lastMonth}
              onClick={() => setRequestedMonth(shiftMonth(month, 1))}>›</button>
          </div>
          <div className={styles.calendarGrid} role="group" aria-label={labels.date}>
            {weekdays.map((day, index) => <span key={index} className={styles.weekday}>{day}</span>)}
            {datesInMonth(month).map((key, index) => key === null
              ? <span key={'blank-' + index} aria-hidden="true" />
              : <button key={key} type="button" className={styles.calendarDay}
                  disabled={!isAvailable(key)} aria-pressed={activeDay === key}
                  aria-label={key} data-selected={activeDay === key}
                  onClick={() => chooseDay(key)}>
                  {Number(key.slice(-2))}
                  {isAvailable(key) && <span className={styles.dayDot} aria-hidden="true" />}
                </button>,
            )}
          </div>
          <h3 className={styles.label}>{labels.time}</h3>
          {visible && <p className={styles.dayLabel}>{visible.label}</p>}
          <div className={styles.grid}>
            {visible?.slots.map(slot => (
              <label key={slot.id} className={styles.slot} data-full={!slot.available}>
                <input type="radio" name="checkout-slot" className={styles.input}
                  checked={slot.id === selectedId} disabled={!slot.available}
                  onChange={() => onSelect(slot.id)} />
                <span className={styles.times}>
                  <Icon name="check" size={16} className={styles.check} />
                  {describeSlotTimes(slot, language)}
                </span>
                {!slot.available && <span className={styles.full}>
                  <Icon name="clock" size={14} />{t('slots.full')}
                </span>}
              </label>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
