import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/shared/ui';
import styles from './Care.module.css';
export function CareLoading() {
  const { t } = useTranslation('aftercare');
  return (
    <div className={styles.card} role="status">
      <span>{t('loading')}</span>
      <Skeleton height="1.5rem" width="70%" />
      <Skeleton height="1rem" width="90%" />
      <Skeleton height="1rem" width="60%" />
    </div>
  );
}
