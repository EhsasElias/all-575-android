import { useTranslation } from 'react-i18next';
import { formatNumber, useLanguage } from '@/shared/i18n';
import { Icon } from '@/shared/ui';
import { MAX_RATING } from './StarRating';
import styles from './StarsDisplay.module.css';

const STARS = [1, 2, 3, 4, 5];

/** A saved rating, read out as "Rated 4 out of 5" rather than as five separate pictures. */
export function StarsDisplay({ rating }: { rating: number }) {
  const { t } = useTranslation('orders');
  const { language } = useLanguage();

  return (
    <span
      role="img"
      className={styles.stars}
      aria-label={t('reviews.rated', {
        rating: formatNumber(rating, language),
        max: formatNumber(MAX_RATING, language),
      })}
    >
      {STARS.map((star) => (
        <Icon key={star} name={star <= rating ? 'star-filled' : 'star'} size={24} />
      ))}
    </span>
  );
}
