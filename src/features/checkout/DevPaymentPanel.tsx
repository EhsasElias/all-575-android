import { useMutation, useQueryClient } from '@tanstack/react-query';
import { http } from '@/shared/api';
import { Button } from '@/shared/ui';
import { checkoutKeys } from './queryKeys';
import styles from './DevPaymentPanel.module.css';

type Outcome = 'succeed' | 'fail';

/**
 * Plays the payment provider on the local server (`POST /dev/payments/{id}/simulate`). The route does not exist
 * anywhere else, and this module is only ever loaded when `import.meta.env.DEV` is true, so it never ships.
 */
export function DevPaymentPanel({ paymentId }: { paymentId: string }) {
  const queryClient = useQueryClient();
  const simulate = useMutation({
    mutationFn: (outcome: Outcome) =>
      http.post<unknown>(`/dev/payments/${encodeURIComponent(paymentId)}/simulate`, { outcome }),
    // Ask the real endpoint straight away instead of waiting for the next poll.
    onSettled: () => queryClient.invalidateQueries({ queryKey: checkoutKeys.payment(paymentId) }),
  });

  return (
    <section className={styles.panel} aria-label="Development only">
      <p className={styles.label}>Development only: play the payment provider</p>
      <div className={styles.buttons}>
        <Button
          variant="secondary"
          loading={simulate.isPending}
          onClick={() => {
            simulate.mutate('succeed');
          }}
        >
          Simulate success
        </Button>
        <Button
          variant="secondary"
          loading={simulate.isPending}
          onClick={() => {
            simulate.mutate('fail');
          }}
        >
          Simulate failure
        </Button>
      </div>
      {simulate.isError && <p role="alert">The simulator did not answer.</p>}
    </section>
  );
}
