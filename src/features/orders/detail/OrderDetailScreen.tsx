import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { isApiError } from '@/shared/api';
import { routePaths } from '@/shared/lib';
import { ButtonLink, EmptyState, ErrorState } from '@/shared/ui';
import { DetailSkeleton } from './DetailSkeleton';
import { OrderDetailView } from './OrderDetailView';
import { useOrder } from './useOrder';

function OrderNotFound() {
  const { t } = useTranslation('orders');

  return (
    <EmptyState
      headingLevel={1}
      icon="receipt"
      title={t('detail.notFoundTitle')}
      message={t('detail.notFoundMessage')}
      action={<ButtonLink to={routePaths.orders}>{t('detail.backToOrders')}</ButtonLink>}
    />
  );
}

/** `/orders/:orderId`. Another customer's order answers 404 and looks exactly like an order that does not exist. */
export function OrderDetailScreen() {
  const { t } = useTranslation('orders');
  const { orderId = '' } = useParams();
  const order = useOrder(orderId);

  if (order.isPending) return <DetailSkeleton />;

  if (order.data === undefined) {
    const missing =
      isApiError(order.error) &&
      (order.error.kind === 'not-found' || order.error.kind === 'forbidden');
    if (missing) return <OrderNotFound />;
    return (
      <ErrorState
        headingLevel={1}
        onRetry={() => void order.refetch()}
        title={t('detail.errorTitle')}
        message={t('detail.errorMessage')}
      />
    );
  }

  return <OrderDetailView order={order.data} />;
}
