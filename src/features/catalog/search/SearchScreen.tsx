import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { routePaths } from '@/shared/lib';
import { ButtonLink, EmptyState } from '@/shared/ui';
import { useCategories } from '../api/useCatalogQueries';
import { useProductList } from '../api/useProductList';
import { CategoryChips } from '../components/CategoryChips';
import { ProductResults } from '../components/ProductResults';
import { DeliveryChip } from '../delivery/DeliveryChip';
import { useDeliveryZone } from '../delivery/useDeliveryZone';
import { ProductFilters, useCatalogFilters } from './ProductFilters';
import { SearchBox } from './SearchBox';
import { MIN_QUERY_LENGTH, useSearchInput } from './useSearchInput';
import styles from './SearchScreen.module.css';

const SUGGESTED_CATEGORIES = 8;

/** A few categories to try when a search has nothing to show, with a way to see them all. */
function CategorySuggestions() {
  const { t } = useTranslation('catalog');
  const categories = useCategories();
  const suggestions = categories.data?.slice(0, SUGGESTED_CATEGORIES) ?? [];

  return (
    <div className={styles.suggestions}>
      {suggestions.length > 0 && (
        <CategoryChips categories={suggestions} label={t('search.browseCategory')} />
      )}
      <ButtonLink to={routePaths.categories} variant="secondary">
        {t('search.browseAll')}
      </ButtonLink>
    </div>
  );
}

/** Server-side search. The query lives in the URL (`/search?q=`), so a result page can be shared and reloaded. */
export function SearchScreen() {
  const { t } = useTranslation('catalog');
  const { draft, query, change, submit, clear } = useSearchInput();
  const { zoneId } = useDeliveryZone();
  const inputRef = useRef<HTMLInputElement>(null);
  const filters = useCatalogFilters();
  const searchable =
    query.length >= MIN_QUERY_LENGTH ||
    [filters.category, filters.seller, filters.maxPrice, filters.inStock, filters.sort].some(
      Boolean,
    );
  const list = useProductList(
    { ...filters, q: query.length >= MIN_QUERY_LENGTH ? query : undefined, zoneId },
    searchable,
  );

  // Opening search from the home screen should be ready to type, like any search field.
  const [arrivedEmpty] = useState(query === '');
  useEffect(() => {
    if (arrivedEmpty) inputRef.current?.focus();
  }, [arrivedEmpty]);

  return (
    <div className={styles.screen}>
      <h1 className={styles.title}>{t('search.title')}</h1>
      <SearchBox
        value={draft}
        inputRef={inputRef}
        onChange={change}
        onSubmit={submit}
        onClear={clear}
      />
      <DeliveryChip className={styles.chip} />
      <ProductFilters zoneId={zoneId} />

      {searchable ? (
        <section aria-labelledby="search-results" className={styles.results}>
          <h2 id="search-results" className={styles.resultsTitle}>
            {t('search.results', { query })}
          </h2>
          <ProductResults
            list={list}
            hideUnknownAvailability={zoneId === null}
            empty={
              <EmptyState
                icon="search"
                title={t('search.noResultsTitle', { query })}
                message={t('search.noResultsMessage')}
                action={<CategorySuggestions />}
              />
            }
          />
        </section>
      ) : (
        <div className={styles.start}>
          <p className={query === '' ? styles.hint : styles.tooShort} role="status">
            {query === '' ? t('search.startMessage') : t('search.tooShort')}
          </p>
          <CategorySuggestions />
        </div>
      )}
    </div>
  );
}
