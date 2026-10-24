import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { formatMoney, useLanguage } from '@/shared/i18n';
import { Fact, Facts } from '../components/Facts';
import { OrderStatusChip } from '../components/OrderStatusChip';
import { formatDateTime } from '../format/dateTime';
import { isOrderStatus } from '../status/statusLook';
import type { SpendingRow } from '../types';
import styles from './SpendingRows.module.css';

function Row({ row }: { row: SpendingRow }) {
  const { t } = useTranslation('orders');
  const { language } = useLanguage();
  const money = (halalas: number) => formatMoney(halalas, language);
  const date = (iso: string | null) =>
    iso === null ? t('spending.none') : formatDateTime(iso, language);

  return (
    <li className={styles.row}>
      <div className={styles.top}>
        <h3 className={styles.number}>{t('list.orderNumber', { number: row.order_number })}</h3>
        {isOrderStatus(row.status) && <OrderStatusChip status={row.status} />}
      </div>
      {/* Three different moments, never merged into one "date". */}
      <Facts>
        <Fact label={t('detail.orderDate')}>{date(row.order_date)}</Fact>
        <Fact label={t('detail.paymentDate')}>{date(row.payment_date)}</Fact>
        <Fact label={t('detail.refundDate')}>{date(row.refund_date)}</Fact>
        <Fact label={t('totals.total')}>{money(row.total)}</Fact>
        <Fact label={t('totals.vat')}>{money(row.vat_included)}</Fact>
        <Fact label={t('spending.refunded')}>{money(row.refunded)}</Fact>
        <Fact label={t('spending.netSpent')} strong>
          {money(row.net_spent)}
        </Fact>
      </Facts>
    </li>
  );
}

/** One card per paid order in the period. The report lists only order numbers, so these do not link to the order. */
export function SpendingRows({ rows }: { rows: SpendingRow[] }) {
  const { t } = useTranslation('orders');
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} className={styles.section}>
      <h2 id={titleId} className={styles.title}>
        {t('spending.rowsTitle')}
      </h2>
      <ul className={styles.list}>
        {rows.map((row) => (
          <Row key={row.order_number} row={row} />
        ))}
      </ul>
    </section>
  );
}
