import { useState } from 'react';
import { SpendingFilters } from './SpendingFilters';
import type { SpendingFilters as ReportFilters } from '../api/ordersApi';
import { useTranslation } from 'react-i18next';
import { isApiError } from '@/shared/api';
import { routePaths } from '@/shared/lib';
import { ButtonLink, EmptyState, ErrorState } from '@/shared/ui';
import type { DateRange } from '../types';
import { CsvExport } from './CsvExport';
import { PeriodFilter } from './PeriodFilter';
import { SpendingRows } from './SpendingRows';
import { SpendingSkeleton } from './SpendingSkeleton';
import { SpendingSummary } from './SpendingSummary';
import { usePeriodFilter } from './usePeriodFilter';
import { useSpendingReport } from './useSpendingReport';
import styles from './SpendingScreen.module.css';

function ReportContent({
  range,
  usable,
  filters,
}: {
  range: DateRange;
  usable: boolean;
  filters: ReportFilters;
}) {
  const { t } = useTranslation('orders');
  const { t: tCommon } = useTranslation('common');
  const report = useSpendingReport(range, usable, filters);

  if (!usable) return null;
  if (report.isPending) return <SpendingSkeleton />;

  if (report.data === undefined) {
    const badDates = isApiError(report.error) && report.error.kind === 'validation';
    return (
      <ErrorState
        onRetry={() => void report.refetch()}
        title={t('spending.errorTitle')}
        message={badDates ? t('spending.badDates') : t('spending.errorMessage')}
      />
    );
  }

  if (report.data.rows.length === 0) {
    return (
      <EmptyState
        icon="receipt"
        title={t('spending.emptyTitle')}
        message={t('spending.emptyMessage')}
        action={<ButtonLink to={routePaths.home}>{tCommon('actions.startShopping')}</ButtonLink>}
      />
    );
  }

  return (
    <>
      <SpendingSummary report={report.data} />
      <SpendingRows rows={report.data.rows} />
    </>
  );
}

/** `/account/spending`: what the customer paid, got back and saved over a period, with a CSV to keep. */
export function SpendingScreen() {
  const { t } = useTranslation('orders');
  const filter = usePeriodFilter();
  const [filters, setFilters] = useState<ReportFilters>({});

  return (
    <div className={styles.page}>
      <ButtonLink to={routePaths.account} variant="ghost" className={styles.back}>
        {t('spending.back')}
      </ButtonLink>
      <h1 className={styles.title}>{t('spending.title')}</h1>
      <p className={styles.intro}>{t('spending.intro')}</p>
      <PeriodFilter
        period={filter.period}
        range={filter.range}
        today={filter.today}
        usable={filter.usable}
        onSelect={filter.select}
        onChangeDay={filter.setCustomDay}
      />
      <SpendingFilters value={filters} onChange={setFilters} />
      <CsvExport range={filter.range} disabled={!filter.usable} filters={filters} />
      <ReportContent range={filter.range} usable={filter.usable} filters={filters} />
    </div>
  );
}
