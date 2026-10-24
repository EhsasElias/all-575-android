import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { routePaths } from '@/shared/lib';
import type { SessionUser } from '@/shared/session';
import { Icon } from '@/shared/ui';
import { formatPhone } from '../formatPhone';
import styles from './ProfileSummary.module.css';

type ProfileSummaryProps = {
  user: SessionUser;
};

/** Who is signed in: name, mobile number and email. The number is shown in full to its owner. */
export function ProfileSummary({ user }: ProfileSummaryProps) {
  const { t } = useTranslation('account');

  return (
    <section aria-label={t('summary.label')} className={styles.summary}>
      <span className={styles.avatar}>
        <Icon name="user" size={32} />
      </span>
      <div className={styles.details}>
        {user.name ? (
          <p className={styles.name}>{user.name}</p>
        ) : (
          <>
            <p className={styles.name}>{t('summary.noName')}</p>
            <Link to={routePaths.profile} className={styles.addName}>
              {t('summary.addName')}
            </Link>
          </>
        )}
        {user.phone && (
          <p className={styles.contact}>
            <bdi dir="ltr">{formatPhone(user.phone)}</bdi>
          </p>
        )}
        {user.email && (
          <p className={styles.contact}>
            <bdi dir="ltr">{user.email}</bdi>
          </p>
        )}
      </div>
    </section>
  );
}
