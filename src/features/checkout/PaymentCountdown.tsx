import { useTranslation } from 'react-i18next';
import { formatNumber, useLanguage } from '@/shared/i18n';
import { Icon } from '@/shared/ui';
import { useNow } from './useNow';
import styles from './PaymentCountdown.module.css';

/** "08:42": minutes and seconds left, with Latin digits. */
export function formatCountdown(msLeft: number, language: 'ar' | 'en'): string {
  const totalSeconds = Math.max(0, Math.ceil(msLeft / 1000));
  const pad = (value: number) => formatNumber(value, language).padStart(2, '0');
  return `${pad(Math.floor(totalSeconds / 60))}:${pad(totalSeconds % 60)}`;
}

/** How long the items stay held for this payment. */
export function PaymentCountdown({ endsAtMs }: { endsAtMs: number }) {
  const { t } = useTranslation('checkout');
  const { language } = useLanguage();
  const now = useNow(1000);
  const left = endsAtMs - now;

  return (
    <p className={styles.countdown}>
      <Icon name="clock" size={20} />
      <span>{left > 0 ? t('payment.timeLeft') : t('payment.timeUp')}</span>
      {left > 0 && (
        <strong role="timer" className={styles.time} dir="ltr">
          {formatCountdown(left, language)}
        </strong>
      )}
    </p>
  );
}
