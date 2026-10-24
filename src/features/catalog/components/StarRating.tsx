import { useTranslation } from 'react-i18next';
import { formatNumber, useLanguage } from '@/shared/i18n';
import { cx } from '@/shared/lib';
import { Icon, VisuallyHidden } from '@/shared/ui';
import styles from './StarRating.module.css';

const MAX_STARS = 5;
const STAR_POSITIONS = [1, 2, 3, 4, 5] as const;

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

type StarRatingProps = {
  /** Between 0 and 5. */
  value: number;
  size?: number;
  className?: string | undefined;
};

/** Five stars with a text alternative: "Rated 4.5 out of 5". */
export function StarRating({ value, size = 18, className }: StarRatingProps) {
  const { t } = useTranslation('catalog');
  const { language } = useLanguage();
  const clamped = Math.min(Math.max(value, 0), MAX_STARS);
  const filled = Math.round(clamped);

  return (
    <span
      role="img"
      aria-label={t('rating.outOf', { value: formatNumber(roundToOneDecimal(clamped), language) })}
      className={cx(styles.stars, className)}
    >
      {STAR_POSITIONS.map((position) => (
        <Icon
          key={position}
          name={position <= filled ? 'star-filled' : 'star'}
          size={size}
          className={position <= filled ? styles.filled : styles.empty}
        />
      ))}
    </span>
  );
}

type RatingSummaryProps = {
  average: number;
  count: number;
  /** One star and a number, for product cards. A product without ratings shows nothing then. */
  compact?: boolean;
};

export function RatingSummary({ average, count, compact = false }: RatingSummaryProps) {
  const { t } = useTranslation('catalog');
  const { language } = useLanguage();

  if (count === 0) {
    return compact ? null : <p className={styles.none}>{t('rating.none')}</p>;
  }

  const average1 = formatNumber(roundToOneDecimal(average), language);
  const countText = formatNumber(count, language);
  const ratingSentence = t('rating.outOf', { value: average1 });
  const countSentence = t('rating.count', { total: countText });
  // The stars of the full version already say the rating; the compact one has to say everything itself.
  const spoken = compact ? `${ratingSentence}. ${countSentence}` : countSentence;

  return (
    <p className={styles.summary}>
      {compact ? (
        <Icon name="star-filled" size={16} className={styles.filled} />
      ) : (
        <StarRating value={average} />
      )}
      <span aria-hidden="true">{`${average1} (${countText})`}</span>
      <VisuallyHidden>{spoken}</VisuallyHidden>
    </p>
  );
}
