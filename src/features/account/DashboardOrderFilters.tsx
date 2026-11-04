import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { routePaths } from '@/shared/lib';
import styles from './CustomerDashboard.module.css';

type FilterValues = {
  product: string;
  status: string;
  min_price: string;
  max_price: string;
  from: string;
  to: string;
  seller: string;
  branch: string;
  payment_method: string;
};

const emptyFilters = (): FilterValues => ({
  product: '', status: '', min_price: '', max_price: '',
  from: '', to: '', seller: '', branch: '', payment_method: '',
});

type FilterKey = keyof FilterValues;

export function DashboardOrderFilters() {
  const { t } = useTranslation('account');
  const navigate = useNavigate();
  const [values, setValues] = useState<FilterValues>(emptyFilters);
  const [advanced, setAdvanced] = useState(false);
  const set = (key: FilterKey, value: string) =>
    setValues((previous) => ({ ...previous, [key]: value }));

  const datesValid = !values.from || !values.to || values.from <= values.to;
  const pricesValid = !values.min_price || !values.max_price ||
    Number(values.min_price) <= Number(values.max_price);
  const valid = datesValid && pricesValid;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!valid) return;

    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(values)) {
      if (value.trim()) query.set(key, value.trim());
    }
    void navigate(routePaths.orders + (query.size ? '?' + query.toString() : ''));
  };

  return (
    <section className={styles.filterSection} aria-label={t('dashboard.filters.filterLabel')}>
      <div className={styles.filterHeading}>
        <div>
          <h2>{t('dashboard.filters.title')}</h2>
          <p>{t('dashboard.filters.hint')}</p>
        </div>
      </div>
      <form className={styles.filterForm} onSubmit={submit} noValidate>
        <div className={styles.filterGrid}>
          <label className={styles.filterField}>
            <span>{t('dashboard.filters.product')}</span>
            <input type="search" value={values.product}
              placeholder={t('dashboard.filters.productHint')}
              onChange={(event) => set('product', event.target.value)} maxLength={120} />
          </label>
          <label className={styles.filterField}>
            <span>{t('dashboard.filters.status')}</span>
            <select value={values.status} onChange={(event) => set('status', event.target.value)}>
              <option value="">{t('dashboard.filters.all')}</option>
              <option value="pending_payment">{t('dashboard.filters.pending')}</option>
              <option value="confirmed">{t('dashboard.filters.confirmed')}</option>
              <option value="completed">{t('dashboard.filters.completed')}</option>
              <option value="cancelled">{t('dashboard.filters.cancelled')}</option>
            </select>
          </label>
          <label className={styles.filterField}>
            <span>{t('dashboard.filters.from')}</span>
            <input type="date" value={values.from}
              max={values.to || undefined}
              onChange={(event) => set('from', event.target.value)} />
          </label>
          <label className={styles.filterField}>
            <span>{t('dashboard.filters.to')}</span>
            <input type="date" value={values.to}
              min={values.from || undefined}
              onChange={(event) => set('to', event.target.value)} />
          </label>
        </div>
        <button type="button" className={styles.filterMore}
          aria-expanded={advanced}
          onClick={() => setAdvanced((current) => !current)}>
          {t('dashboard.filters.advanced')}
          <span aria-hidden="true">{advanced ? '−' : '+'}</span>
        </button>
        {advanced && (
          <div className={styles.filterGrid}>
            <label className={styles.filterField}>
              <span>{t('dashboard.filters.minimum')}</span>
              <input type="number" min="0" step="0.01" inputMode="decimal"
                value={values.min_price} onChange={(event) => set('min_price', event.target.value)} />
            </label>
            <label className={styles.filterField}>
              <span>{t('dashboard.filters.maximum')}</span>
              <input type="number" min="0" step="0.01" inputMode="decimal"
                value={values.max_price} onChange={(event) => set('max_price', event.target.value)} />
            </label>
            <label className={styles.filterField}>
              <span>{t('dashboard.filters.seller')}</span>
              <input type="search" maxLength={120} value={values.seller}
                onChange={(event) => set('seller', event.target.value)} />
            </label>
            <label className={styles.filterField}>
              <span>{t('dashboard.filters.branch')}</span>
              <input type="search" maxLength={120} value={values.branch}
                onChange={(event) => set('branch', event.target.value)} />
            </label>
            <label className={styles.filterField}>
              <span>{t('dashboard.filters.payment')}</span>
              <select value={values.payment_method}
                onChange={(event) => set('payment_method', event.target.value)}>
                <option value="">{t('dashboard.filters.allPayments')}</option>
                <option value="mada">Mada</option>
                <option value="card">{t('dashboard.filters.card')}</option>
                <option value="apple_pay">Apple Pay</option>
                <option value="cash_on_delivery">{t('dashboard.filters.cash')}</option>
              </select>
            </label>
          </div>
        )}
        {!valid && <p role="alert" className={styles.filterError}>{t('dashboard.filters.invalid')}</p>}
        <div className={styles.filterActions}>
          <button type="submit" className={styles.filterSubmit} disabled={!valid}>
            {t('dashboard.filters.search')}
          </button>
          <button type="button" className={styles.filterReset}
            onClick={() => { setValues(emptyFilters()); setAdvanced(false); }}>
            {t('dashboard.filters.clear')}
          </button>
        </div>
      </form>
    </section>
  );
}
