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
  const [status, setStatus] = useState(params.get('status') ?? '');
  const [from, setFrom] = useState(params.get('from') ?? '');
  const [to, setTo] = useState(params.get('to') ?? '');
  const [period, setPeriod] = useState(params.has('from') || params.has('to') ? 'custom' : 'all');
  const reversed = from !== '' && to !== '' && to < from;
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
            if (reversed) return;
            const next = new URLSearchParams();
            for (const [key, value] of Object.entries({ q: number.trim(), status, from, to })) {
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
            <Button type="submit" disabled={reversed}>
              {t('orderFilters.apply')}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setNumber('');
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
