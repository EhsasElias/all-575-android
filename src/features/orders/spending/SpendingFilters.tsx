import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { http, type Data, type Schemas } from '@/shared/api';
import { useLanguage } from '@/shared/i18n';
import { Button } from '@/shared/ui';
import type { SpendingFilters as Filters } from '../api/ordersApi';
import styles from '../list/OrderFilters.module.css';

type Category = Schemas['CategoryResource'];
const flatten = (categories: Category[]): Category[] =>
  categories.flatMap((category) => [category, ...flatten(category.children ?? [])]);

export function SpendingFilters({
  value,
  onChange,
}: {
  value: Filters;
  onChange: (filters: Filters) => void;
}) {
  const { t } = useTranslation('orders');
  const { t: common } = useTranslation('common');
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const choices = useQuery({
    queryKey: ['spending-filter-choices'],
    enabled: open,
    retry: 1,
    queryFn: async ({ signal }) => {
      const [categories, sellers] = await Promise.all([
        http.get<Data<Category[]>>('/categories', { signal }),
        http.get<Data<Schemas['SellerResource'][]>>('/sellers', { signal }),
      ]);
      return { categories: flatten(categories.data), sellers: sellers.data };
    },
  });
  const textLanguage = language === 'ar' ? 'ar' : 'en';
  return (
    <details
      className={styles.panel}
      onToggle={(event) => {
        setOpen(event.currentTarget.open);
      }}
    >
      <summary>{t('spendingFilters.title')}</summary>
      {open && (
        <div className={styles.fields}>
          <label>
            {t('spendingFilters.category')}
            <select
              disabled={choices.isPending}
              value={value.category ?? ''}
              onChange={(event) => {
                onChange({ ...value, category: event.target.value || undefined });
              }}
            >
              <option value="">{t('spendingFilters.all')}</option>
              {choices.data?.categories.map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name[textLanguage]}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t('spendingFilters.seller')}
            <select
              disabled={choices.isPending}
              value={value.seller ?? ''}
              onChange={(event) => {
                onChange({ ...value, seller: event.target.value || undefined });
              }}
            >
              <option value="">{t('spendingFilters.all')}</option>
              {choices.data?.sellers.map((seller) => (
                <option key={seller.slug} value={seller.slug}>
                  {seller.name[textLanguage]}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t('orderFilters.status')}
            <select
              value={value.status ?? ''}
              onChange={(event) => {
                onChange({ ...value, status: event.target.value || undefined });
              }}
            >
              <option value="">{t('orderFilters.all')}</option>
              {(['confirmed', 'completed', 'cancelled'] as const).map((status) => (
                <option key={status} value={status}>
                  {t(`status.order.${status}`)}
                </option>
              ))}
            </select>
          </label>
          <p className={styles.hint}>{t('spendingFilters.scope')}</p>
          {choices.isPending && <p role="status">{common('states.loading')}</p>}
          {choices.isError && (
            <div role="alert">
              <p>{t('spendingFilters.failed')}</p>
              <Button variant="ghost" onClick={() => void choices.refetch()}>
                {common('actions.retry')}
              </Button>
            </div>
          )}
          <Button
            variant="ghost"
            onClick={() => {
              onChange({});
            }}
          >
            {t('orderFilters.clear')}
          </Button>
        </div>
      )}
    </details>
  );
}
