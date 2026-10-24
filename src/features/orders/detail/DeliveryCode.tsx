import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/shared/i18n';
import { Button, Icon, VisuallyHidden } from '@/shared/ui';
import { formatDateTime } from '../format/dateTime';
import { useDeliveryCode } from './useDeliveryCode';
import styles from './DeliveryCode.module.css';

type DeliveryCodeProps = {
  orderId: string;
  suborderId: string;
};

/** The six digits the courier asks for at the door. Shown only on request, then hidden again. */
export function DeliveryCode({ orderId, suborderId }: DeliveryCodeProps) {
  const { t } = useTranslation('orders');
  const { language } = useLanguage();
  const { state, show, hide } = useDeliveryCode(orderId, suborderId);

  if (state.status === 'shown') {
    return (
      <div className={styles.card}>
        <p className={styles.warning}>
          <Icon name="shield" size={20} />
          {t('code.warning')}
        </p>
        <p className={styles.digits} dir="ltr">
          <span aria-hidden="true">{state.code}</span>
          {/* Read digit by digit, not as one big number. */}
          <VisuallyHidden>{state.code.split('').join(' ')}</VisuallyHidden>
        </p>
        <p className={styles.hint}>
          {t('code.validUntil', { time: formatDateTime(state.expiresAt, language) })}
        </p>
        <p className={styles.hint}>{t('code.autoHide')}</p>
        <Button variant="secondary" onClick={hide}>
          {t('code.hide')}
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.request}>
      <Button
        variant="secondary"
        loading={state.status === 'loading'}
        onClick={() => {
          void show();
        }}
      >
        <Icon name="lock" size={20} />
        {t('code.show')}
      </Button>
      {state.status === 'error' && (
        <p role="alert" className={styles.error}>
          {state.reason === 'unavailable' ? t('code.unavailable') : t('code.failed')}
        </p>
      )}
    </div>
  );
}
