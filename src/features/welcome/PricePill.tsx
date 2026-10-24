import { useTranslation } from 'react-i18next';
import { formatMoney, useLanguage } from '@/shared/i18n';
import { PROMISE_PRICE_HALALAS } from './welcomeSlides';
import styles from './PricePill.module.css';

export function PricePill() {
  const { t } = useTranslation('welcome');
  const { language } = useLanguage();

  return (
    <p className={styles.pill}>
      {t('priceLine', { amount: formatMoney(PROMISE_PRICE_HALALAS, language) })}
    </p>
  );
}
