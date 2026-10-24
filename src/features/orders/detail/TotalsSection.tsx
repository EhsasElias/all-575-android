import { useTranslation } from 'react-i18next';
import { formatMoney, useLanguage } from '@/shared/i18n';
import { Fact, Facts } from '../components/Facts';
import { Section } from '../components/Section';
import type { OrderDetail } from '../types';
import styles from './TotalsSection.module.css';

/** The amounts exactly as the server charged them. Every price already includes VAT. */
export function TotalsSection({ order }: { order: OrderDetail }) {
  const { t } = useTranslation('orders');
  const { language } = useLanguage();
  const { amounts } = order;

  return (
    <Section title={t('totals.title')}>
      <Facts>
        <Fact label={t('totals.subtotal')}>{formatMoney(amounts.subtotal, language)}</Fact>
        {amounts.discount > 0 && (
          <Fact
            label={
              order.promo_code === null
                ? t('totals.discount')
                : t('totals.discountWithCode', { code: order.promo_code })
            }
          >
            {`− ${formatMoney(amounts.discount, language)}`}
          </Fact>
        )}
        <Fact label={t('totals.delivery')}>
          {amounts.delivery_fee === 0
            ? t('totals.free')
            : formatMoney(amounts.delivery_fee, language)}
        </Fact>
        <Fact label={t('totals.total')} strong>
          {formatMoney(amounts.total, language)}
        </Fact>
        <Fact label={t('totals.vat')}>{formatMoney(amounts.vat_included, language)}</Fact>
      </Facts>
      <p className={styles.note}>{t('totals.vatIncluded')}</p>
    </Section>
  );
}
