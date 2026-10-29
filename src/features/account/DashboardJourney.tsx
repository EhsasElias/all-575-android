import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { formatNumber, useLanguage } from '@/shared/i18n';
import { routePaths } from '@/shared/lib';
import { Icon } from '@/shared/ui';
import type { CustomerDashboard } from './useCustomerDashboard';
import styles from './CustomerDashboard.module.css';

const STEPS = [
  { to: routePaths.categories, label: 'browse', hint: 'browseHint', icon: 'grid' },
  { to: routePaths.cart, label: 'basket', hint: 'basketHint', icon: 'cart' },
  { to: routePaths.addresses, label: 'address', hint: 'addressHint', icon: 'map-pin' },
  { to: routePaths.checkout, label: 'checkout', hint: 'checkoutHint', icon: 'credit-card' },
  { to: routePaths.orders, label: 'track', hint: 'trackHint', icon: 'package' },
  { to: routePaths.customerCases, label: 'help', hint: 'helpHint', icon: 'info' },
] as const;

export function DashboardJourney({ data }: { data: CustomerDashboard }) {
  const { t } = useTranslation('account');
  const { language } = useLanguage();
  const links = [
    {
      to: routePaths.savedProducts,
      label: 'saved',
      count: t('dashboard.count', { count: data.saved_products }),
    },
    {
      to: routePaths.addresses,
      label: 'addresses',
      count: t('dashboard.count', { count: data.addresses }),
    },
    {
      to: routePaths.customerCases,
      label: 'help',
      count: t('dashboard.openCount', { count: data.open_support }),
    },
    {
      to: routePaths.customerRequests,
      label: 'requests',
      count: t('dashboard.openCount', { count: data.open_requests }),
    },
    { to: routePaths.billing, label: 'billing', count: '' },
    { to: routePaths.account, label: 'settings', count: '' },
  ] as const;
  return (
    <>
      <section className={styles.section} aria-labelledby="dashboard-journey">
        <h2 id="dashboard-journey">{t('dashboard.journey')}</h2>
        <ol className={styles.steps}>
          {STEPS.map((step, index) => (
            <li key={step.label}>
              <Link to={step.to} className={styles.step}>
                <span className={styles.stepNumber}>{formatNumber(index + 1, language)}</span>
                <Icon name={step.icon} size={22} />
                <strong>{t(`dashboard.${step.label}`)}</strong>
                <span className={styles.muted}>{t(`dashboard.${step.hint}`)}</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
      <nav aria-label={t('dashboard.account')} className={styles.section}>
        <h2>{t('dashboard.account')}</h2>
        <div className={styles.links}>
          {links.map((link) => (
            <Link key={link.to} to={link.to} className={styles.accountLink}>
              <span>{t(`dashboard.${link.label}`)}</span>
              {link.count && <span className={styles.muted}>{link.count}</span>}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
