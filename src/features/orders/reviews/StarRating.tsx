import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { formatNumber, useLanguage } from '@/shared/i18n';
import { Icon, VisuallyHidden } from '@/shared/ui';
import styles from './StarRating.module.css';

export const MAX_RATING = 5;
const STARS = [1, 2, 3, 4, 5];

type StarRatingProps = {
  legend: string;
  /** 0 means nothing chosen yet. */
  value: number;
  onChange: (rating: number) => void;
  error?: string | null;
};

/**
 * A group of five real radio buttons, so the arrow keys, Tab and screen readers work without any extra code.
 * The stars are only the picture of the choice.
 */
export function StarRating({ legend, value, onChange, error = null }: StarRatingProps) {
  const { t } = useTranslation('orders');
  const { language } = useLanguage();
  const groupName = useId();
  const errorId = useId();

  return (
    <fieldset className={styles.group} aria-describedby={error === null ? undefined : errorId}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.stars}>
        {STARS.map((star) => (
          <label key={star} className={styles.star}>
            <input
              type="radio"
              name={groupName}
              value={star}
              checked={value === star}
              onChange={() => {
                onChange(star);
              }}
              className={styles.input}
            />
            <span className={styles.face}>
              <Icon name={star <= value ? 'star-filled' : 'star'} size={32} />
            </span>
            <VisuallyHidden>
              {t('reviews.starLabel', {
                rating: formatNumber(star, language),
                max: formatNumber(MAX_RATING, language),
              })}
            </VisuallyHidden>
          </label>
        ))}
      </div>
      <p id={errorId} role="alert" className={styles.error}>
        {error}
      </p>
    </fieldset>
  );
}
