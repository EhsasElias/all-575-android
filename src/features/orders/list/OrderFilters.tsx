import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Button, TextField } from '@/shared/ui';
import { presetRange } from '../format/period';
import styles from './OrderFilters.module.css';

const STATUSES = ['pending_payment', 'confirmed', 'completed', 'cancelled'] as const;

export function OrderFilters() {
  const { t } = useTranslation('orders');
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [number, setNumber] = useState(params.get('q') ?? '');
  const [product, setProduct] = useState(params.get('product') ?? '');
  const [seller, setSeller] = useState(params.get('seller') ?? '');
  const [branch, setBranch] = useState(params.get('branch') ?? '');
  const [payment, setPayment] = useState(params.get('payment_method') ?? '');
  const [minPrice, setMinPrice] = useState(params.get('min_price') ?? '');
  const [maxPrice, setMaxPrice] = useState(params.get('max_price') ?? '');
  const [status, setStatus] = useState(params.get('status') ?? '');
  const [from, setFrom] = useState(params.get('from') ?? '');
  const [to, setTo] = useState(params.get('to') ?? '');
  const [period, setPeriod] = useState(params.has('from') || params.has('to') ? 'custom' : 'all');
  const reversed = from !== '' && to !== '' && to < from;
  const reversedPrice = minPrice !== '' && maxPrice !== '' && Number(maxPrice) < Number(minPrice);
  return (
    <details
      className={styles.panel}
      onToggle={(event) => {
        setOpen(event.currentTarget.open);
      }}
    >
      <summary>{t('orderFilters.title')}</summary>
      {open && (
        <form
          className={styles.fields}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (reversed || reversedPrice) return;
            const next = new URLSearchParams();
            for (const [key, value] of Object.entries({ q: number.trim(), product: product.trim(), seller: seller.trim(), branch: branch.trim(), payment_method: payment, min_price: minPrice, max_price: maxPrice, status, from, to })) {
              if (value) next.set(key, value);
            }
            setParams(next, { replace: true });
          }}
        >
          <TextField
            type="search"
            label={t('orderFilters.number')}
            maxLength={80}
            value={number}
            onChange={(event) => {
              setNumber(event.target.value);
            }}
          />
          <TextField type="search" label="Product name / اسم المنتج" maxLength={120}
            value={product} onChange={(event) => setProduct(event.target.value)} />
          <TextField type="search" label="Company name / اسم الشركة" maxLength={120}
            value={seller} onChange={(event) => setSeller(event.target.value)} />
          <TextField type="search" label="Branch name / اسم الفرع" maxLength={120}
            value={branch} onChange={(event) => setBranch(event.target.value)} />
          <div className={styles.dates}>
            <TextField type="number" label="Min price (SAR) / أقل سعر" value={minPrice}
              min="0" onChange={(event) => setMinPrice(event.target.value)} />
            <TextField type="number" label="Max price (SAR) / أعلى سعر" value={maxPrice}
              min="0" error={reversedPrice ? 'Maximum must be greater than minimum' : undefined}
              onChange={(event) => setMaxPrice(event.target.value)} />
          </div>
          <label>
            Payment type / نوع الدفع
            <select value={payment} onChange={(event) => setPayment(event.target.value)}>
              <option value="">All / الكل</option>
              <option value="mada">Mada</option>
              <option value="card">Card (Visa / Mastercard)</option>
              <option value="apple_pay">Apple Pay</option>
              <option value="cash_on_delivery">Cash on delivery / الدفع عند الاستلام</option>
            </select>
          </label>
          <label>
            {t('orderFilters.status')}
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
              }}
            >
              <option value="">{t('orderFilters.all')}</option>
              {STATUSES.map((value) => (
                <option key={value} value={value}>
                  {t(`status.order.${value}`)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t('spending.period')}
            <select
              value={period}
              onChange={(event) => {
                const value = event.target.value;
                setPeriod(value);
                if (value === 'all') {
                  setFrom('');
                  setTo('');
                } else if (value === 'week' || value === 'month') {
                  const range = presetRange(value, new Date());
                  setFrom(range.from);
                  setTo(range.to);
                }
              }}
            >
              <option value="all">{t('orderFilters.allDates')}</option>
              <option value="week">{t('spending.periods.week')}</option>
              <option value="month">{t('spending.periods.month')}</option>
              <option value="custom">{t('spending.periods.custom')}</option>
            </select>
          </label>
          {period === 'custom' && (
            <div className={styles.dates}>
              <TextField
                type="date"
                label={t('spending.from')}
                value={from}
                onChange={(event) => {
                  setFrom(event.target.value);
                }}
              />
              <TextField
                type="date"
                label={t('spending.to')}
                value={to}
                error={reversed ? t('spending.endBeforeStart') : undefined}
                onChange={(event) => {
                  setTo(event.target.value);
                }}
              />
            </div>
          )}
          <p className={styles.hint}>{t('orderFilters.dateBasis')}</p>
          <div className={styles.actions}>
            <Button type="submit" disabled={reversed || reversedPrice}>
              {t('orderFilters.apply')}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setNumber('');
                setProduct(''); setSeller(''); setBranch(''); setPayment('');
                setMinPrice(''); setMaxPrice('');
                setStatus('');
                setFrom('');
                setTo('');
                setPeriod('all');
                setParams({}, { replace: true });
              }}
            >
              {t('orderFilters.clear')}
            </Button>
          </div>
        </form>
      )}
    </details>
  );
}
