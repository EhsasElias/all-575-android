import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/shared/i18n';
import { cx } from '@/shared/lib';
import { Icon } from '@/shared/ui';
import { pickText } from '../lib/localized';
import { DeliverySheet } from './DeliverySheet';
import { useDeliveryZone } from './useDeliveryZone';
import styles from './DeliveryChip.module.css';

type DeliveryChipProps = {
  className?: string | undefined;
};

/** "Deliver to: Riyadh". Opens the sheet where the customer picks the area availability is shown for. */
export function DeliveryChip({ className }: DeliveryChipProps) {
  const { t } = useTranslation('catalog');
  const { language } = useLanguage();
  const { zone } = useDeliveryZone();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={cx(styles.chip, className)}
        aria-haspopup="dialog"
        onClick={() => {
          setOpen(true);
        }}
      >
        <Icon name="map-pin" size={20} className={styles.pin} />
        {zone ? (
          <>
            <span className={styles.label}>{t('delivery.chipLabel')}</span>
            <span className={styles.zone}>{pickText(zone.name, language)}</span>
          </>
        ) : (
          <span className={styles.zone}>{t('delivery.chipChoose')}</span>
        )}
        <Icon name="chevron-down" size={18} className={styles.caret} />
      </button>
      <DeliverySheet
        open={open}
        onClose={() => {
          setOpen(false);
        }}
      />
    </>
  );
}
