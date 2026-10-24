import { Icon } from '@/shared/ui';
import type { AuthFailure } from './authFailure';
import type { Channel } from './contact';
import { useFailureText } from './useFailureText';
import styles from './StepLayout.module.css';

type FailureAlertProps = {
  failure: AuthFailure;
  channel: Channel;
};

/** A problem that belongs to the whole step rather than to one field. */
export function FailureAlert({ failure, channel }: FailureAlertProps) {
  const failureText = useFailureText();

  return (
    <div role="alert" className={styles.alert}>
      <Icon name="alert-circle" size={22} />
      <p>{failureText(failure, channel)}</p>
    </div>
  );
}
