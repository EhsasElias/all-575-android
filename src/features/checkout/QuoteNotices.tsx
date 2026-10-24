import { useTranslation } from 'react-i18next';
import { formatMoney, useLanguage } from '@/shared/i18n';
import { Button, Icon } from '@/shared/ui';
import { formatRiyadhTime } from './riyadhTime';
import styles from './QuoteNotices.module.css';

type QuoteNoticesProps = {
  expiresAtMs: number;
  expired: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  /** The server changed the prices while the customer was looking: how far the total moved. */
  change: { from: number; to: number } | null;
};

/** Everything the customer must know about how long these prices hold, and when they moved. */
export function QuoteNotices({
  expiresAtMs,
  expired,
  refreshing,
  onRefresh,
  change,
}: QuoteNoticesProps) {
  const { t } = useTranslation('checkout');
  const { language } = useLanguage();

  return (
    <div className={styles.notices}>
      {change && (
        <p className={styles.warning} role="alert">
          <Icon name="alert-circle" size={20} />
          <span>
            {t('quote.changed', {
              from: formatMoney(change.from, language),
              to: formatMoney(change.to, language),
            })}
          </span>
        </p>
      )}
      {expired ? (
        <div className={styles.warning} role="alert">
          <Icon name="clock" size={20} />
          <span>{t('quote.expired')}</span>
          <Button variant="secondary" loading={refreshing} onClick={onRefresh}>
            {t('quote.refresh')}
          </Button>
        </div>
      ) : (
        <p className={styles.validity}>
          <Icon name="clock" size={16} />
          {t('quote.validUntil', { time: formatRiyadhTime(expiresAtMs, language) })}
        </p>
      )}
      <p className={styles.visuallyLive} role="status">
        {refreshing && !expired ? t('quote.updating') : ''}
      </p>
    </div>
  );
}
