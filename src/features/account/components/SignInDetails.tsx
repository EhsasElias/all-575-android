import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import type { SessionUser } from '@/shared/session';
import { formatPhone } from '../formatPhone';
import styles from './SignInDetails.module.css';

type SignInDetailsProps = {
  user: SessionUser;
};

type DetailProps = {
  label: string;
  value: string;
  verified: boolean;
};

function Detail({ label, value, verified }: DetailProps) {
  const { t } = useTranslation('account');

  return (
    <div className={styles.detail}>
      <dt className={styles.label}>{label}</dt>
      <dd className={styles.value}>
        <bdi dir="ltr">{value}</bdi>
        <span className={styles.badge} data-verified={verified}>
          {t(verified ? 'profile.verified' : 'profile.notVerified')}
        </span>
      </dd>
    </div>
  );
}

/** The mobile number and email the customer signs in with. The API has no way to change them yet. */
export function SignInDetails({ user }: SignInDetailsProps) {
  const { t } = useTranslation('account');
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} className={styles.details}>
      <h2 id={titleId} className={styles.title}>
        {t('profile.contactTitle')}
      </h2>
      <dl className={styles.list}>
        {user.phone && (
          <Detail
            label={t('profile.phone')}
            value={formatPhone(user.phone)}
            verified={user.phone_verified}
          />
        )}
        {user.email && (
          <Detail label={t('profile.email')} value={user.email} verified={user.email_verified} />
        )}
      </dl>
      <p className={styles.note}>{t('profile.contactReadOnly')}</p>
    </section>
  );
}
