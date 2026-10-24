import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { routeTo } from '@/shared/lib';
import { Button, Icon } from '@/shared/ui';
import type { Address } from './api';
import styles from './AddressCard.module.css';

type AddressCardProps = {
  address: Address;
  name: string;
  settingDefault: boolean;
  onSetDefault: (address: Address) => void;
  onDelete: (address: Address) => void;
};

export function AddressCard({
  address,
  name,
  settingDefault,
  onSetDefault,
  onDelete,
}: AddressCardProps) {
  const { t } = useTranslation('addresses');

  return (
    <article className={styles.card} aria-labelledby={`address-name-${address.id}`}>
      <header className={styles.header}>
        <h2 id={`address-name-${address.id}`} className={styles.name}>
          {name}
        </h2>
        {address.is_default && (
          <span className={styles.badge}>
            <Icon name="check" size={16} />
            {t('list.default')}
          </span>
        )}
      </header>

      <p className={styles.recipient}>
        {address.recipient_name} · <bdi dir="ltr">{address.recipient_phone}</bdi>
      </p>
      <p>
        {address.street}, {address.district}, {address.city}, {address.region}
      </p>
      <p className={styles.details}>
        {t('card.building', {
          building: address.building_number,
          additional: address.additional_number,
        })}
        {' · '}
        {t('card.postal', { code: address.postal_code })}
        {address.short_address && (
          <>
            {' · '}
            {t('card.shortAddress', { code: address.short_address })}
          </>
        )}
      </p>

      <p className={address.serviceable ? styles.good : styles.warn}>
        <Icon name={address.serviceable ? 'truck' : 'alert-circle'} size={18} />
        {address.serviceable ? t('list.deliverable') : t('list.notDeliverable')}
      </p>
      {!address.serviceable && <p className={styles.details}>{t('list.notDeliverableHelp')}</p>}

      <div className={styles.actions}>
        {!address.is_default && (
          <Button
            variant="secondary"
            loading={settingDefault}
            aria-label={t('list.setDefaultNamed', { name })}
            onClick={() => {
              onSetDefault(address);
            }}
          >
            {t('list.setDefault')}
          </Button>
        )}
        <Link
          to={routeTo.addressEdit(address.id)}
          className={styles.link}
          aria-label={t('list.editNamed', { name })}
        >
          <Icon name="edit" size={18} />
          {t('list.edit')}
        </Link>
        <Button
          variant="ghost"
          aria-label={t('list.deleteNamed', { name })}
          onClick={() => {
            onDelete(address);
          }}
        >
          <Icon name="trash" size={18} />
          {t('list.delete')}
        </Button>
      </div>
    </article>
  );
}
