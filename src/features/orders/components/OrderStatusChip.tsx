import { useTranslation } from 'react-i18next';
import { ORDER_STATUS_LOOK } from '../status/statusLook';
import type { OrderStatus } from '../types';
import { StatusChip } from './StatusChip';

export function OrderStatusChip({ status }: { status: OrderStatus }) {
  const { t } = useTranslation('orders');
  const look = ORDER_STATUS_LOOK[status];

  return (
    <StatusChip icon={look.icon} tone={look.tone}>
      {t(`status.order.${status}`)}
    </StatusChip>
  );
}
