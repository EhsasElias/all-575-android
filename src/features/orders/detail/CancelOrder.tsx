import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatMoney, useLanguage } from '@/shared/i18n';
import { Button, Sheet, useToast } from '@/shared/ui';
import type { OrderDetail } from '../types';
import { cancelFailureOf, useCancelOrder } from './useCancelOrder';
import styles from './CancelOrder.module.css';

type CancelOrderProps = {
  order: OrderDetail;
  onCancelled: () => void;
};

/** The cancel button, and a sheet that says what happens to the money before anything is cancelled. */
export function CancelOrder({ order, onCancelled }: CancelOrderProps) {
  const { t } = useTranslation('orders');
  const { language } = useLanguage();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const cancel = useCancelOrder(order.id, () => {
    setOpen(false);
    showToast({ message: t('cancel.done'), variant: 'success' });
    onCancelled();
  });

  const paid = order.status === 'confirmed';
  const failure = cancel.isError ? cancelFailureOf(cancel.error) : null;
  const canConfirm = order.can_cancel && failure !== 'not_cancellable';

  const close = () => {
    setOpen(false);
    cancel.reset();
  };

  return (
    <>
      {order.can_cancel && (
        <Button
          variant="secondary"
          onClick={() => {
            setOpen(true);
          }}
        >
          {t('cancel.button')}
        </Button>
      )}
      <Sheet
        open={open}
        onClose={close}
        title={t('cancel.title')}
        footer={
          <>
            {canConfirm && (
              <Button
                loading={cancel.isPending}
                onClick={() => {
                  cancel.mutate();
                }}
              >
                {t('cancel.confirm')}
              </Button>
            )}
            <Button variant="ghost" onClick={close}>
              {canConfirm ? t('cancel.keep') : t('cancel.close')}
            </Button>
          </>
        }
      >
        <div className={styles.body}>
          <p>
            {paid
              ? t('cancel.paidExplanation', { amount: formatMoney(order.total, language) })
              : t('cancel.unpaidExplanation')}
          </p>
          {paid && <p className={styles.note}>{t('cancel.refundNote')}</p>}
          {failure !== null && (
            <p role="alert" className={styles.error}>
              {failure === 'not_cancellable' ? t('cancel.notCancellable') : t('cancel.failed')}
            </p>
          )}
        </div>
      </Sheet>
    </>
  );
}
