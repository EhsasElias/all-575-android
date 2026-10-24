import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { errorCode, isApiError } from '@/shared/api';
import { createReview, updateReview, type ReviewInput } from '../api/ordersApi';
import { ordersKeys } from '../api/queryKeys';
import type { Review } from '../types';

export type ReviewFailure = 'notAllowed' | 'exists' | 'windowClosed' | 'invalid' | 'failed';

const FAILURE_BY_CODE = new Map<string, ReviewFailure>([
  ['review_not_allowed', 'notAllowed'],
  ['review_exists', 'exists'],
  ['review_window_closed', 'windowClosed'],
]);

export function reviewFailureOf(error: unknown): ReviewFailure {
  const code = errorCode(error);
  const known = code === null ? undefined : FAILURE_BY_CODE.get(code);
  if (known !== undefined) return known;
  return isApiError(error) && error.kind === 'validation' ? 'invalid' : 'failed';
}

/**
 * The review the customer wrote on this page. The order carries no review of its own, so the API's answer to
 * "save" is kept in the query cache (this tab, until sign-out) and that is what makes editing possible.
 */
function useSavedReview(orderId: string, productSlug: string) {
  const queryClient = useQueryClient();
  const queryKey = ordersKeys.review(orderId, productSlug);
  const { data } = useQuery<Review>({
    queryKey,
    queryFn: skipToken,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  return {
    review: data,
    remember: (review: Review) => {
      queryClient.setQueryData(queryKey, review);
    },
  };
}

/** Creates the review the first time and edits it afterwards. */
export function useItemReview(orderId: string, productSlug: string, onSaved: () => void) {
  const { review, remember } = useSavedReview(orderId, productSlug);

  const save = useMutation({
    mutationFn: (input: ReviewInput) =>
      review === undefined
        ? createReview(orderId, productSlug, input)
        : updateReview(review.id, input),
    onSuccess: (saved) => {
      remember(saved);
      onSaved();
    },
  });

  return {
    review,
    save,
    failure: save.isError ? reviewFailureOf(save.error) : null,
  };
}
