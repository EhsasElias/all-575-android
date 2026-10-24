import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/shared/i18n';
import type { Review } from '../api/types';
import { StarRating } from '../components/StarRating';
import { formatDate } from '../lib/formatDate';
import styles from './ReviewItem.module.css';

type ReviewItemProps = {
  review: Review;
  /** Takes the keyboard focus when it appears: the first review of a page the customer asked for. */
  focusOnMount?: boolean;
};

export function ReviewItem({ review, focusOnMount = false }: ReviewItemProps) {
  const { t } = useTranslation('catalog');
  const { language } = useLanguage();
  const articleRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (focusOnMount) articleRef.current?.focus();
  }, [focusOnMount]);

  return (
    <article ref={articleRef} tabIndex={-1} className={styles.review}>
      <div className={styles.head}>
        <StarRating value={review.rating} size={16} />
        <span className={styles.reviewer}>{review.reviewer ?? t('reviews.anonymous')}</span>
        {review.created_at !== null && (
          <time dateTime={review.created_at} className={styles.date}>
            {formatDate(review.created_at, language)}
          </time>
        )}
      </div>
      {review.body && <p className={styles.body}>{review.body}</p>}
    </article>
  );
}
