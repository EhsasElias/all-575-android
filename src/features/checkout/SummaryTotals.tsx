import { useTranslation } from 'react-i18next';
import { formatMoney, useLanguage } from '@/shared/i18n';
import { cx } from '@/shared/lib';
import type { DeliveryZone } from './api';
import type { Quote } from './quote';
import styles from './SummaryTotals.module.css';

type SummaryTotalsProps = { quote: Quote; zone: DeliveryZone | null };

/** The itemized price: goods, discount, delivery, the VAT already inside the total, and the total itself. */
export function SummaryTotals({ quote, zone }: SummaryTotalsProps) {
  const { t } = useTranslation('checkout');
  const { language } = useLanguage();
  const money = (halalas: number) => formatMoney(halalas, language);
  const threshold = zone?.free_delivery_threshold ?? null;
  const deliveryKnown = quote.issues.length === 0;

  return (
    <dl className={styles.totals}>
      <div className={styles.row}>
        <dt>{t('summary.subtotal')}</dt>
        <dd>{money(quote.subtotal)}</dd>
      </div>
      {quote.discount > 0 && (
        <div className={styles.row}>
          <dt>
            {quote.promoCode
              ? t('summary.discountWithCode', { code: quote.promoCode })
              : t('summary.discount')}
          </dt>
          <dd className={styles.saving}>−{money(quote.discount)}</dd>
        </div>
      )}
      <div className={styles.row}>
        <dt>
          {t('summary.delivery')}
          {deliveryKnown && threshold !== null && (
            <span className={styles.note}>
              {t('summary.freeOver', { amount: money(threshold) })}
            </span>
          )}
        </dt>
        <dd>
          {!deliveryKnown && t('summary.deliveryPending')}
          {deliveryKnown &&
            (quote.deliveryFee === 0 ? t('summary.free') : money(quote.deliveryFee))}
        </dd>
      </div>
      <div className={styles.row}>
        <dt>{t('summary.vat')}</dt>
        <dd className={styles.muted}>{money(quote.vatIncluded)}</dd>
      </div>
      <div className={cx(styles.row, styles.total)}>
        <dt>{t('summary.total')}</dt>
        <dd>{money(quote.total)}</dd>
      </div>
    </dl>
  );
}
