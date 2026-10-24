import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/shared/i18n';
import { ErrorState, Icon, Skeleton } from '@/shared/ui';
import type { Slot } from './api';
import choice from './choice.module.css';
import section from './section.module.css';
import { describeSlotTimes, groupSlotsByDay } from './slots';
import styles from './SlotPicker.module.css';

type SlotPickerProps = {
  /** No address to deliver to yet: there is nothing to offer. */
  hasAddress: boolean;
  slots: readonly Slot[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  selectedId: number | null;
  onSelect: (slotId: number) => void;
};

export function SlotPicker({
  hasAddress,
  slots,
  isLoading,
  isError,
  onRetry,
  selectedId,
  onSelect,
}: SlotPickerProps) {
  const { t } = useTranslation('checkout');
  const { language } = useLanguage();
  const headingId = useId();
  const days = groupSlotsByDay(slots, language);

  return (
    <section className={section.section} aria-labelledby={headingId}>
      <h2 id={headingId} className={section.heading}>
        {t('slots.heading')}
      </h2>

      {!hasAddress && <p className={section.hint}>{t('slots.needAddress')}</p>}
      {hasAddress && isLoading && (
        <div role="status" aria-busy="true" aria-label={t('slots.loading')}>
          <Skeleton height="8rem" />
        </div>
      )}
      {hasAddress && isError && <ErrorState headingLevel={3} onRetry={onRetry} />}
      {hasAddress && !isLoading && !isError && days.length === 0 && (
        <p className={section.hint}>{t('slots.none')}</p>
      )}

      {days.map((day) => (
        <fieldset key={day.key} className={choice.group}>
          <legend className={styles.day}>{day.label}</legend>
          <div className={styles.grid}>
            {day.slots.map((slot) => (
              <label key={slot.id} className={styles.slot} data-full={!slot.available}>
                <input
                  type="radio"
                  name="checkout-slot"
                  className={styles.input}
                  checked={slot.id === selectedId}
                  disabled={!slot.available}
                  onChange={() => {
                    onSelect(slot.id);
                  }}
                />
                <span className={styles.times}>
                  <Icon name="check" size={16} className={styles.check} />
                  {describeSlotTimes(slot, language)}
                </span>
                {!slot.available && (
                  <span className={styles.full}>
                    <Icon name="clock" size={14} />
                    {t('slots.full')}
                  </span>
                )}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
    </section>
  );
}
