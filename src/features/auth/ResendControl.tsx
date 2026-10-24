import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui';
import { formatCountdown } from './formatCountdown';
import { useResendCountdown } from './useResendCountdown';
import styles from './CodeStep.module.css';

type ResendControlProps = {
  resendAt: number;
  pending: boolean;
  onResend: () => void;
};

/** A visible countdown, then a button: the server allows one new code per cooldown. */
export function ResendControl({ resendAt, pending, onResend }: ResendControlProps) {
  const { t } = useTranslation('auth');
  const secondsLeft = useResendCountdown(resendAt);

  return (
    <div className={styles.resend}>
      {secondsLeft > 0 && (
        <p className={styles.countdown}>
          {t('code.resendIn', { time: formatCountdown(secondsLeft) })}
        </p>
      )}
      {/* Announced once, when the button appears. The ticking numbers above are not a live region. */}
      <div aria-live="polite">
        {secondsLeft === 0 && (
          <Button variant="secondary" fullWidth loading={pending} onClick={onResend}>
            {t('code.resend')}
          </Button>
        )}
      </div>
    </div>
  );
}
