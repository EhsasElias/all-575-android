import { useTranslation } from 'react-i18next';
import { useStoreInfo } from '@/shared/storeInfo';
import { Button, Skeleton } from '@/shared/ui';
import styles from './LegalVersion.module.css';

type LegalVersionProps = {
  document: 'terms' | 'privacy';
};

/** The version the server currently asks customers to accept. */
export function LegalVersion({ document }: LegalVersionProps) {
  const { t } = useTranslation('account');
  const { t: tCommon } = useTranslation();
  const store = useStoreInfo();

  if (store.isPending) return <Skeleton height="1.5rem" width="10rem" />;

  if (store.isError) {
    return (
      <div className={styles.unavailable}>
        <p>{t('legal.versionUnavailable')}</p>
        <Button
          variant="ghost"
          onClick={() => {
            void store.refetch();
          }}
        >
          {tCommon('actions.retry')}
        </Button>
      </div>
    );
  }

  const version = document === 'terms' ? store.data.terms_version : store.data.privacy_version;
  return <p className={styles.version}>{t('legal.version', { version })}</p>;
}
