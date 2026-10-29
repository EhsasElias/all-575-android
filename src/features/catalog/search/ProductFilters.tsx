import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { http, type Data } from '@/shared/api';
import { formatMoney, useLanguage } from '@/shared/i18n';
import { Button } from '@/shared/ui';
import type { Category, Seller } from '../api/types';
import { useCategories } from '../api/useCatalogQueries';
import { pickText } from '../lib/localized';
import styles from './ProductFilters.module.css';
function flatten(categories: Category[]): Category[] {
  return categories.flatMap((c) => [c, ...flatten(c.children ?? [])]);
}
export function useCatalogFilters() {
  const [params] = useSearchParams();
  return {
    category: params.get('category') ?? undefined,
    seller: params.get('seller') ?? undefined,
    sort: params.get('sort') ?? undefined,
    inStock: params.get('in_stock') === '1',
    minPrice: params.get('min_price') ? Number(params.get('min_price')) : undefined,
    maxPrice: params.get('max_price') ? Number(params.get('max_price')) : undefined,
  };
}
export function ProductFilters({
  zoneId,
  showCategory = true,
}: {
  zoneId: number | null;
  showCategory?: boolean;
}) {
  const { t } = useTranslation('catalog');
  const { language } = useLanguage();
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const categories = useCategories();
  const sellers = useQuery({
    queryKey: ['catalog', 'sellers'],
    enabled: open,
    queryFn: async ({ signal }) => (await http.get<Data<Seller[]>>('/sellers', { signal })).data,
  });
  const change = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key === 'min_price' && Number(value) > Number(next.get('max_price') ?? 575))
      next.delete('max_price');
    if (key === 'max_price' && value && Number(value) < Number(next.get('min_price') ?? 100))
      next.delete('min_price');
    setParams(next, { replace: true });
  };
  return (
    <details
      className={styles.panel}
      onToggle={(event) => {
        setOpen(event.currentTarget.open);
      }}
    >
      <summary>{t('filters.title')}</summary>
      {open && (
        <div className={styles.fields}>
          {showCategory && (
            <label>
              {t('filters.category')}
              <select
                value={params.get('category') ?? ''}
                onChange={(e) => {
                  change('category', e.target.value);
                }}
              >
                <option value="">{t('filters.all')}</option>
                {flatten(categories.data ?? []).map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {pickText(c.name, language)}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label>
            {t('filters.seller')}
            <select
              value={params.get('seller') ?? ''}
              onChange={(e) => {
                change('seller', e.target.value);
              }}
            >
              <option value="">{t('filters.all')}</option>
              {sellers.data?.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {pickText(s.name, language)}
                </option>
              ))}
            </select>
          </label>
          {(categories.isError || sellers.isError) && (
            <p role="alert">
              {t('filters.failed')}{' '}
              <Button
                variant="ghost"
                onClick={() => {
                  void categories.refetch();
                  void sellers.refetch();
                }}
              >
                {t('saved.retry')}
              </Button>
            </p>
          )}
          <label>
            {t('filters.sort')}
            <select
              value={params.get('sort') ?? 'featured'}
              onChange={(e) => {
                change('sort', e.target.value);
              }}
            >
              <option value="featured">{t('filters.featured')}</option>
              <option value="newest">{t('filters.newest')}</option>
              <option value="best_selling">{t('filters.bestSelling')}</option>
              <option value="price_asc">{t('filters.priceAsc')}</option>
              <option value="price_desc">{t('filters.priceDesc')}</option>
              <option value="rating">{t('filters.rating')}</option>
            </select>
          </label>
          <div className={styles.priceRange}>
            {(['min_price', 'max_price'] as const).map((key) => (
              <label key={key}>
                {t(key === 'min_price' ? 'filters.minimumPrice' : 'filters.price')}
                <select
                  value={params.get(key) ?? ''}
                  onChange={(e) => {
                    change(key, e.target.value);
                  }}
                >
                  <option value="">{t('filters.all')}</option>
                  {[100, 200, 300, 400, 500, 575].map((value) => (
                    <option key={value} value={value}>
                      {formatMoney(value, language)}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <p className={styles.hint}>{t('filters.samePrice')}</p>
          <label className={styles.check}>
            <input
              type="checkbox"
              disabled={zoneId === null}
              checked={zoneId !== null && params.get('in_stock') === '1'}
              onChange={(e) => {
                change('in_stock', e.target.checked ? '1' : '');
              }}
            />
            {t('filters.available')}
          </label>
          {zoneId === null && <p className={styles.hint}>{t('filters.needArea')}</p>}
          <Button
            variant="ghost"
            onClick={() => {
              const next = new URLSearchParams(params);
              ['category', 'seller', 'sort', 'min_price', 'max_price', 'in_stock'].forEach(
                (key) => {
                  next.delete(key);
                },
              );
              setParams(next, { replace: true });
            }}
          >
            {t('filters.clear')}
          </Button>
        </div>
      )}
    </details>
  );
}
