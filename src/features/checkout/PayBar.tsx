import { useId, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { formatMoney, useLanguage } from '@/shared/i18n';
import { Button, Icon } from '@/shared/ui';
import type { BlockedReason } from './payReadiness';
import styles from './PayBar.module.css';

type PayBarProps = {
  total: number | null;
  blocked: BlockedReason | null;
  placing: boolean;
  onPay: () => void;
  /** A refusal to show right above the button. */
  notice?: ReactNode | undefined;
  cashOnDelivery?: boolean;
};

/** Sticks to the bottom on a phone: the total and the pay button are always in reach, and always the same number. */
export function PayBar({
  total,
  blocked,
  placing,
  onPay,
  notice,
  cashOnDelivery = false,
}: PayBarProps) {
  const { t } = useTranslation('checkout');
  const { language } = useLanguage();
  const hintId = useId();
  const amount = total === null ? null : formatMoney(total, language);

  return (
    <div className={styles.bar}>
      {notice}
      <div className={styles.row}>
        <div className={styles.total}>
          <span className={styles.label}>{t('summary.total')}</span>
          <strong className={styles.amount}>{amount ?? '—'}</strong>
          <span className={styles.vat}>{t('summary.vatIncludedShort')}</span>
        </div>
        <Button
          size="lg"
          className={styles.pay}
          loading={placing}
          disabled={blocked !== null}
          aria-describedby={blocked ? hintId : undefined}
          onClick={onPay}
        >
          <Icon name="lock" size={20} />
          {amount === null
            ? t('pay.button')
            : t(cashOnDelivery ? 'pay.cashButton' : 'pay.buttonWithAmount', { amount })}
        </Button>
      </div>
      <p id={hintId} className={styles.hint}>
        {blocked ? t(`pay.blocked.${blocked}`) : t(cashOnDelivery ? 'pay.cashHint' : 'pay.secure')}
      </p>
    </div>
  );
}
