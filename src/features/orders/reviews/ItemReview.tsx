import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { useLanguage } from '@/shared/i18n';
import { routeTo } from '@/shared/lib';
import { Button } from '@/shared/ui';
import { formatDateTime, formatTimeLeft } from '../format/dateTime';
import { useNow } from '../hooks/useNow';
import { ReviewForm } from './ReviewForm';
import { StarsDisplay } from './StarsDisplay';
import { useItemReview, type ReviewFailure } from './useItemReview';
import styles from './ItemReview.module.css';

type ItemReviewProps = {
  orderId: string;
  productSlug: string;
  itemName: string;
};

const MINUTE_MS = 60_000;

function failureKey(failure: Exclude<ReviewFailure, 'exists'>) {
  return `reviews.errors.${failure}` as const;
}

/** Rate a delivered item once, and change the rating or comment while the edit window is open. */
export function ItemReview({ orderId, productSlug, itemName }: ItemReviewProps) {
  const { t } = useTranslation('orders');
  const { language } = useLanguage();
  const now = useNow(MINUTE_MS);
  const [editing, setEditing] = useState(false);
  const { review, save, failure } = useItemReview(orderId, productSlug, () => {
    setEditing(false);
  });

  const message = failure === null || failure === 'exists' ? null : t(failureKey(failure));
  const until = review?.editable_until;
  const timeLeft = until === undefined ? null : formatTimeLeft(until, now, language);
  const canEdit = review !== undefined && timeLeft !== null && failure !== 'windowClosed';

  if (failure === 'exists') {
    return (
      <div className={styles.review}>
        <p>{t('reviews.exists')}</p>
        <Link to={routeTo.product(productSlug)}>{t('reviews.seeOnProduct')}</Link>
      </div>
    );
  }

  if (review === undefined || (editing && canEdit)) {
    return (
      <div className={styles.review}>
        <ReviewForm
          itemName={itemName}
          initial={review === undefined ? null : { rating: review.rating, body: review.body }}
          submitLabel={review === undefined ? t('reviews.submit') : t('reviews.save')}
          pending={save.isPending}
          errorMessage={message}
          onSubmit={(input) => {
            save.mutate(input);
          }}
          onCancel={
            review === undefined
              ? null
              : () => {
                  setEditing(false);
                  save.reset();
                }
          }
        />
      </div>
    );
  }

  return (
    <div className={styles.review}>
      <div className={styles.saved}>
        <StarsDisplay rating={review.rating} />
        {review.body !== null && <p className={styles.body}>{review.body}</p>}
      </div>
      {message !== null && (
        <p role="alert" className={styles.error}>
          {message}
        </p>
      )}
      {canEdit && until !== undefined ? (
        <>
          <p className={styles.hint}>
            {t('reviews.editUntil', { date: formatDateTime(until, language), left: timeLeft })}
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              setEditing(true);
            }}
          >
            {t('reviews.edit')}
          </Button>
        </>
      ) : (
        <p className={styles.hint}>{t('reviews.editClosed')}</p>
      )}
    </div>
  );
}
