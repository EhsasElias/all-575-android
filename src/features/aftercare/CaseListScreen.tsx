import { useInfiniteQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { routePaths, routeTo } from '@/shared/lib';
import { Button, ButtonLink, EmptyState, ErrorState } from '@/shared/ui';
import { fetchCases } from './api';
import { caseStatusKey } from './statusKey';
import { CareLoading } from './CareLoading';
import styles from './Care.module.css';

const FIRST_PAGE: string | null = null;

export function CaseListScreen() {
  const { t } = useTranslation('aftercare');
  const query = useInfiniteQuery({
    queryKey: ['aftercare', 'list'],
    queryFn: ({ pageParam, signal }) => fetchCases(pageParam, signal),
    initialPageParam: FIRST_PAGE,
    getNextPageParam: (page) => page.meta.next_cursor ?? undefined,
  });
  const cases = query.data?.pages.flatMap((page) => page.data) ?? [];
  return (
    <div className={styles.page}>
      <ButtonLink to={routePaths.account} variant="ghost">
        {t('backToAccount')}
      </ButtonLink>
      <h1>{t('title')}</h1>
      <p>{t('intro')}</p>
      <ButtonLink to={routePaths.orders}>{t('orders')}</ButtonLink>
      {query.isPending && <CareLoading />}
      {query.isError && <ErrorState title={t('error')} onRetry={() => void query.refetch()} />}
      {query.isSuccess && cases.length === 0 && (
        <EmptyState icon="receipt" title={t('empty')} message={t('emptyHint')} />
      )}
      <ul className={styles.list}>
        {cases.map((item) => (
          <li className={styles.card} key={item.id}>
            <Link to={routeTo.customerCase(item.id)}>{item.subject}</Link>
            <p>
              {t(item.kind === 'return' ? 'return' : 'support')} · {t(caseStatusKey(item.status))}
            </p>
            <p>{t('reference', { id: item.id })}</p>
          </li>
        ))}
      </ul>
      {query.hasNextPage && (
        <Button loading={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()}>
          {t('more')}
        </Button>
      )}
    </div>
  );
}
