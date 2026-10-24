import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/shared/ui';
import styles from './DetailSkeleton.module.css';

export function DetailSkeleton() {
  const { t } = useTranslation();

  return (
    <div role="status" aria-busy="true" aria-label={t('states.loading')} className={styles.page}>
      <Skeleton height="2rem" width="70%" />
      <Skeleton height="6rem" />
      <Skeleton height="10rem" />
      <Skeleton height="8rem" />
    </div>
  );
}
