import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { formatMoney, formatNumber, useLanguage } from '@/shared/i18n';
import { routePaths } from '@/shared/lib';
import { Icon } from '@/shared/ui';
import type { CustomerDashboard } from './useCustomerDashboard';
import styles from './CustomerDashboard.module.css';

const METRICS = [
  { key: 'orders_total', label: 'orders', status: '' },
  { key: 'orders_active', label: 'active', status: 'confirmed' },
  { key: 'orders_awaiting_payment', label: 'awaiting', status: 'pending_payment' },
  { key: 'orders_completed', label: 'completed', status: 'completed' },
] as const;

export function DashboardSummary({ data }: { data: CustomerDashboard }) {
  const { t } = useTranslation('account');
  const { language } = useLanguage();
  return (
    <section aria-label={t('dashboard.allTime')} className={styles.section}>
      <p className={styles.muted}>{t('dashboard.allTime')}</p>
      <div className={styles.metrics}>
        {METRICS.map((metric) => (
          <Link
            key={metric.key}
            to={`${routePaths.orders}${metric.status ? `?status=${metric.status}` : ''}`}
            className={styles.metric}
          >
            <span>{t(`dashboard.${metric.label}`)}</span>
            <strong>{formatNumber(data[metric.key], language)}</strong>
          </Link>
        ))}
      </div>
      <Link to={routePaths.spending} className={styles.balance}>
        <Icon name="receipt" size={28} />
        <div>
          <span>{t('dashboard.net')}</span>
          <strong>{formatMoney(data.net_spent, language)}</strong>
          <p>{t('dashboard.paid', { amount: formatMoney(data.paid_total, language) })}</p>
          <p>{t('dashboard.refunded', { amount: formatMoney(data.refunded_total, language) })}</p>
        </div>
      </Link>
      <p className={styles.muted}>{t('dashboard.cashHint')}</p>
    </section>
  );
}
