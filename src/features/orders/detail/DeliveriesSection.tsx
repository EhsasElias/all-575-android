import { useTranslation } from 'react-i18next';
import { Section } from '../components/Section';
import type { OrderDetail } from '../types';
import { SuborderCard } from './SuborderCard';
import styles from './DeliveriesSection.module.css';

/** Every seller delivers on its own, so each one gets its own card, status and time. */
export function DeliveriesSection({ order }: { order: OrderDetail }) {
  const { t } = useTranslation('orders');

  return (
    <Section title={t('deliveries.title')}>
      {order.suborders.length > 1 && <p className={styles.intro}>{t('deliveries.separate')}</p>}
      <div className={styles.list}>
        {order.suborders.map((suborder) => (
          <SuborderCard key={suborder.id} orderId={order.id} suborder={suborder} />
        ))}
      </div>
    </Section>
  );
}
