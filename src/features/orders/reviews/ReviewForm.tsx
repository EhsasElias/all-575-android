import { useState, type SyntheticEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui';
import type { ReviewInput } from '../api/ordersApi';
import { CommentField } from './CommentField';
import { StarRating } from './StarRating';
import styles from './ReviewForm.module.css';

export const MAX_COMMENT_LENGTH = 1000;

type ReviewFormProps = {
  itemName: string;
  initial: { rating: number; body: string | null } | null;
  submitLabel: string;
  pending: boolean;
  /** Why the last attempt failed, already in the customer's language. */
  errorMessage: string | null;
  onSubmit: (input: ReviewInput) => void;
  onCancel: (() => void) | null;
};

export function ReviewForm({
  itemName,
  initial,
  submitLabel,
  pending,
  errorMessage,
  onSubmit,
  onCancel,
}: ReviewFormProps) {
  const { t } = useTranslation('orders');
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [body, setBody] = useState(initial?.body ?? '');
  const [missingRating, setMissingRating] = useState(false);

  const handleSubmit = (event: SyntheticEvent) => {
    event.preventDefault();
    if (rating === 0) {
      setMissingRating(true);
      return;
    }
    const trimmed = body.trim();
    onSubmit({ rating, body: trimmed === '' ? null : trimmed });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className={styles.form}>
      <StarRating
        legend={t('reviews.ratingLegend', { item: itemName })}
        value={rating}
        onChange={(next) => {
          setRating(next);
          setMissingRating(false);
        }}
        error={missingRating ? t('reviews.errors.ratingRequired') : null}
      />
      <CommentField
        label={t('reviews.commentLabel')}
        hint={t('reviews.commentHint', { max: MAX_COMMENT_LENGTH })}
        value={body}
        maxLength={MAX_COMMENT_LENGTH}
        onChange={(event) => {
          setBody(event.target.value);
        }}
      />
      {errorMessage !== null && (
        <p role="alert" className={styles.error}>
          {errorMessage}
        </p>
      )}
      <div className={styles.buttons}>
        <Button type="submit" loading={pending}>
          {submitLabel}
        </Button>
        {onCancel !== null && (
          <Button variant="ghost" onClick={onCancel}>
            {t('reviews.cancel')}
          </Button>
        )}
      </div>
    </form>
  );
}
