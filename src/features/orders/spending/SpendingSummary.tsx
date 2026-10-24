import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { formatMoney, formatNumber, useLanguage } from '@/shared/i18n';
import { formatDay } from '../format/dateTime';
import type { SpendingReport } from '../types';
import styles from './SpendingSummary.module.css';

type TileProps = { label: string; value: string; hint?: string };

function Tile({ label, value, hint }: TileProps) {
  return (
    <div className={styles.tile}>
      <dt className={styles.label}>{label}</dt>
      <dd className={styles.value}>{value}</dd>
      {hint !== undefined && <dd className={styles.hint}>{hint}</dd>}
    </div>
  );
}

/** The totals the API computed for the period, with the period itself named so there is no doubt. */
export function SpendingSummary({ report }: { report: SpendingReport }) {
  const { t } = useTranslation('orders');
  const { language } = useLanguage();
  const { summary } = report;
  const titleId = useId();
  const money = (halalas: number) => formatMoney(halalas, language);

  return (
    <section aria-labelledby={titleId} className={styles.summary}>
      <h2 id={titleId} className={styles.title}>
        {t('spending.summaryTitle', {
          from: formatDay(report.from, language),
          to: formatDay(report.to, language),
        })}
      </h2>
      <div className={styles.hero}>
        <p className={styles.label}>{t('spending.netSpent')}</p>
        <p className={styles.heroValue}>{money(summary.net_spent)}</p>
        <p className={styles.hint}>{t('spending.netSpentHint')}</p>
      </div>
      <dl className={styles.tiles}>
        <Tile label={t('spending.orders')} value={formatNumber(summary.orders, language)} />
        <Tile label={t('spending.paid')} value={money(summary.paid)} />
        <Tile
          label={t('spending.refunded')}
          value={money(summary.refunded)}
          hint={t('spending.refundedHint')}
        />
        <Tile label={t('spending.vat')} value={money(summary.vat_included)} />
        <Tile label={t('spending.savings')} value={money(summary.savings)} />
        <Tile label={t('spending.deliveryFees')} value={money(summary.delivery_fees)} />
      </dl>
    </section>
  );
}
