import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/shared/i18n';
import { ErrorState } from '@/shared/ui';
import { fetchCareItems, type CustomerCase } from './api';
import { CareLoading } from './CareLoading';

export function ReturnSummary({ item }: { item: CustomerCase }) {
  const { t } = useTranslation('aftercare');
  const { language } = useLanguage();
  const query = useQuery({
    queryKey: ['aftercare', 'items', item.order_id],
    queryFn: ({ signal }) => fetchCareItems(item.order_id, signal),
  });
  const line = query.data?.find((entry) => entry.id === item.order_item_id);
  if (query.isPending) return <CareLoading />;
  if (query.isError) return <ErrorState title={t('error')} onRetry={() => void query.refetch()} />;
  if (line === undefined) return null;
  const name = language === 'ar' ? line.name.ar : line.name.en;
  const variant = language === 'ar' ? line.variant_name.ar : line.variant_name.en;
  return (
    <p>
      {t('returnSummary', { item: `${name} ${variant ?? ''}`.trim(), quantity: item.quantity })}
    </p>
  );
}
