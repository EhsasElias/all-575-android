import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { routePaths } from '@/shared/lib';
import { ButtonLink } from '@/shared/ui';
import { isActiveOrder } from '../status/statusLook';
import type { OrderDetail } from '../types';
import { DeliveriesSection } from './DeliveriesSection';
import { OrderHeader } from './OrderHeader';
import { OrderTimeline } from './OrderTimeline';
import { PaymentsSection } from './PaymentsSection';
import { ShippingSection } from './ShippingSection';
import { TotalsSection } from './TotalsSection';
import styles from './OrderDetailView.module.css';

/** Everything about one order, top to bottom: where it is, what is in it, where it goes, what it cost. */
export function OrderDetailView({ order }: { order: OrderDetail }) {
  const { t } = useTranslation('orders');
  const [focusRequest, setFocusRequest] = useState(0);

  return (
    <div className={styles.page}>
      <ButtonLink to={routePaths.orders} variant="ghost" className={styles.back}>
        {t('detail.back')}
      </ButtonLink>
      <OrderHeader
        order={order}
        focusRequest={focusRequest}
        onCancelled={() => {
          setFocusRequest((count) => count + 1);
        }}
      />
      {isActiveOrder(order.status) && <p className={styles.live}>{t('detail.autoRefresh')}</p>}
      <DeliveriesSection order={order} />
      <OrderTimeline events={order.timeline} suborders={order.suborders} />
      <ShippingSection order={order} />
      <PaymentsSection payments={order.payments} refunds={order.refunds} />
      <TotalsSection order={order} />
    </div>
  );
}
