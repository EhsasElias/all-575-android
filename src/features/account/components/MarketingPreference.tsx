import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import type { SessionUser } from '@/shared/session';
import { useMarketingConsent } from '../useMarketingConsent';
import styles from './Preferences.module.css';

type MarketingPreferenceProps = {
  user: SessionUser;
};

/** Marketing consent is its own choice, separate from the Terms and Privacy Policy, and is saved at once. */
export function MarketingPreference({ user }: MarketingPreferenceProps) {
  const { t } = useTranslation('account');
  const id = useId();
  const hintId = `${id}-hint`;
  const consent = useMarketingConsent();
  // While the server is answering, the switch already shows what was asked for.
  const checked = consent.isPending ? consent.variables : user.consents.marketing;

  return (
    <div className={styles.row}>
      <div className={styles.text}>
        <label htmlFor={id} className={styles.label}>
          {t('preferences.marketing')}
        </label>
        <p id={hintId} className={styles.hint}>
          {t('preferences.marketingHint')}
        </p>
      </div>
      <input
        id={id}
        type="checkbox"
        role="switch"
        className={styles.switch}
        checked={checked}
        disabled={consent.isPending}
        aria-describedby={hintId}
        onChange={(event) => {
          consent.mutate(event.target.checked);
        }}
      />
    </div>
  );
}
