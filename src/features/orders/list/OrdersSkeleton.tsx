import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/shared/ui';
import styles from './OrdersSkeleton.module.css';

const PLACEHOLDER_CARDS = ['first', 'second', 'third'];

export function OrdersSkeleton() {
  const { t } = useTranslation();

  return (
    <div role="status" aria-busy="true" aria-label={t('states.loading')} className={styles.list}>
      {PLACEHOLDER_CARDS.map((id) => (
        <div key={id} className={styles.card}>
          <Skeleton height="1.5rem" width="60%" />
          <Skeleton height="1rem" width="90%" />
          <Skeleton height="3rem" />
        </div>
      ))}
    </div>
  );
}
