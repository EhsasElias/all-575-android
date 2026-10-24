import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { routePaths } from '@/shared/lib';
import { Button, ButtonLink, Icon } from '@/shared/ui';
import type { Address } from './api';
import styles from './AddressSavedPanel.module.css';

type AddressSavedPanelProps = {
  address: Address;
  isNew: boolean;
  /** Where the customer came from (e.g. checkout), if they should go back there. */
  nextPath: string | null;
  onEditPin: () => void;
};

/** After saving: an honest answer on whether we deliver to this address. */
export function AddressSavedPanel({ address, isNew, nextPath, onEditPin }: AddressSavedPanelProps) {
  const { t } = useTranslation('addresses');
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const destination = nextPath ?? routePaths.addresses;

  if (address.serviceable) {
    return (
      <section className={styles.panel} aria-labelledby="address-saved-heading">
        <Icon name="check-circle" size={36} className={styles.good} />
        <h2 id="address-saved-heading" ref={headingRef} tabIndex={-1} className={styles.title}>
          {isNew ? t('saved.titleNew') : t('saved.titleEdit')}
        </h2>
        <p role="status">{t('saved.deliverable')}</p>
        <ButtonLink to={destination} size="lg" fullWidth>
          {nextPath ? t('saved.continue') : t('saved.back')}
        </ButtonLink>
      </section>
    );
  }

  return (
    <section className={styles.panel} aria-labelledby="address-saved-heading">
      <Icon name="alert-circle" size={36} className={styles.warn} />
      <h2 id="address-saved-heading" ref={headingRef} tabIndex={-1} className={styles.title}>
        {t('saved.notDeliverableTitle')}
      </h2>
      <p role="status">{t('saved.notDeliverable')}</p>
      <Button size="lg" fullWidth onClick={onEditPin}>
        {t('saved.editPin')}
      </Button>
      <ButtonLink to={destination} variant="secondary" size="lg" fullWidth>
        {t('saved.chooseAnother')}
      </ButtonLink>
    </section>
  );
}
