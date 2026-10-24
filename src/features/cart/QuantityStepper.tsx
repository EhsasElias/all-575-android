import { formatNumber, useLanguage } from '@/shared/i18n';
import { Icon, IconButton } from '@/shared/ui';
import styles from './QuantityStepper.module.css';

type QuantityStepperProps = {
  value: number;
  min: number;
  max: number;
  /** Names the whole control, e.g. "Quantity of Biscuits". */
  label: string;
  decreaseLabel: string;
  increaseLabel: string;
  onChange: (next: number) => void;
};

/**
 * Minus, the quantity, plus. A button at its limit stays focusable (aria-disabled instead of disabled), so a
 * keyboard user pressing "plus" up to the limit does not lose their place.
 */
export function QuantityStepper({
  value,
  min,
  max,
  label,
  decreaseLabel,
  increaseLabel,
  onChange,
}: QuantityStepperProps) {
  const { language } = useLanguage();
  const atMin = value <= min;
  const atMax = value >= max;

  return (
    <div role="group" aria-label={label} className={styles.stepper}>
      <IconButton
        label={decreaseLabel}
        className={styles.step}
        aria-disabled={atMin || undefined}
        onClick={() => {
          if (!atMin) onChange(value - 1);
        }}
      >
        <Icon name="minus" size={20} />
      </IconButton>
      <span className={styles.value} aria-live="polite" aria-atomic="true">
        {formatNumber(value, language)}
      </span>
      <IconButton
        label={increaseLabel}
        className={styles.step}
        aria-disabled={atMax || undefined}
        onClick={() => {
          if (!atMax) onChange(value + 1);
        }}
      >
        <Icon name="plus" size={20} />
      </IconButton>
    </div>
  );
}
