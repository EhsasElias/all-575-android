import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/shared/i18n';
import { Fact, Facts } from '../components/Facts';
import { Section } from '../components/Section';
import { formatDateTimeRange } from '../format/dateTime';
import type { OrderDetail } from '../types';
import styles from './ShippingSection.module.css';

type Address = OrderDetail['address'];

/** The address as written on the order, one line per part. Later edits to a saved address do not change it. */
function addressLines(address: Address, unitLabel: string, floorLabel: string): string[] {
  const place = [
    address.unit && `${unitLabel} ${address.unit}`,
    address.floor && `${floorLabel} ${address.floor}`,
  ];
  return [
    `${address.building_number} ${address.street}`,
    `${address.district}, ${address.city}`,
    `${address.region} ${address.postal_code}`,
    ...(address.short_address ? [address.short_address] : []),
    ...(place.some(Boolean) ? [place.filter(Boolean).join(', ')] : []),
  ];
}

export function ShippingSection({ order }: { order: OrderDetail }) {
  const { t } = useTranslation('orders');
  const { language } = useLanguage();
  const { address, slot } = order;
  const lines = addressLines(address, t('shipping.unit'), t('shipping.floor'));

  return (
    <Section title={t('shipping.title')}>
      <Facts>
        <Fact label={t('shipping.slot')}>
          {slot.starts_at === null
            ? t('shipping.noSlot')
            : formatDateTimeRange(slot.starts_at, slot.ends_at, language)}
        </Fact>
        <Fact label={t('shipping.recipient')}>{address.recipient_name}</Fact>
        <Fact label={t('shipping.phone')}>
          <span dir="ltr">{address.recipient_phone}</span>
        </Fact>
        <Fact label={t('shipping.address')}>
          {lines.map((line) => (
            <span key={line} className={styles.line}>
              {line}
            </span>
          ))}
        </Fact>
        {address.delivery_notes !== null && (
          <Fact label={t('shipping.notes')}>{address.delivery_notes}</Fact>
        )}
      </Facts>
    </Section>
  );
}
