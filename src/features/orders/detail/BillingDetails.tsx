import { useTranslation } from 'react-i18next';
import type { OrderDetail } from '../types';
import { Section } from '../components/Section';
import { Facts, Fact } from '../components/Facts';
export function BillingDetails({ order }: { order: OrderDetail }) {
  const { t } = useTranslation('customer');
  const details = order.billing_details;
  if (!details && !order.purchase_order_reference) return null;
  return (
    <Section title={t('billing')}>
      <Facts>
        {details?.buyer_type === 'business' && (
          <>
            <Fact label={t('company')}>{details.company_name}</Fact>
            {details.registration_number && (
              <Fact label={t('registration')}>{details.registration_number}</Fact>
            )}
            {details.vat_number && <Fact label={t('vat')}>{details.vat_number}</Fact>}
            <Fact label={t('address')}>{details.billing_address}</Fact>
          </>
        )}
        {order.purchase_order_reference && (
          <Fact label={t('po')}>{order.purchase_order_reference}</Fact>
        )}
      </Facts>
    </Section>
  );
}
