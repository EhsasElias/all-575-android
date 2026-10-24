import { useTranslation } from 'react-i18next';
import { formatMoney, formatNumber, useLanguage } from '@/shared/i18n';
import { useStoreInfo } from '@/shared/storeInfo';
import styles from './CartSummary.module.css';

const BASIS_POINTS_PER_PERCENT = 100;

type CartSummaryProps = {
  items: number;
  /** Halalas, VAT included. Only the lines that can be bought. */
  subtotal: number;
  isGuest: boolean;
};

export function CartSummary({ items, subtotal, isGuest }: CartSummaryProps) {
  const { t } = useTranslation('cart');
  const { language } = useLanguage();
  const { data: store } = useStoreInfo();

  return (
    <section className={styles.summary} aria-labelledby="cart-summary-title">
      <h2 id="cart-summary-title" className={styles.title}>
        {t('summary.title')}
      </h2>
      <dl className={styles.totals}>
        <div className={styles.row}>
          <dt>{t('summary.items')}</dt>
          <dd>{formatNumber(items, language)}</dd>
        </div>
        <div className={styles.row}>
          <dt>{t('summary.subtotal')}</dt>
          <dd className={styles.subtotal}>{formatMoney(subtotal, language)}</dd>
        </div>
      </dl>

      {store && (
        <p className={styles.note}>
          {t('summary.vatIncluded', {
            rate: formatNumber(store.vat_rate_basis_points / BASIS_POINTS_PER_PERCENT, language),
          })}
        </p>
      )}
      <p className={styles.note}>{t('summary.decidedAtCheckout')}</p>
      {isGuest && <p className={styles.note}>{t('summary.guestNote')}</p>}
    </section>
  );
}
