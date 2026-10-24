import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { routePaths, routeTo } from '@/shared/lib';
import { ButtonLink, EmptyState, ErrorState, Icon, Skeleton } from '@/shared/ui';
import { addressName } from './addressChoice';
import type { Address } from './api';
import choice from './choice.module.css';
import section from './section.module.css';

type AddressPickerProps = {
  addresses: readonly Address[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  selectedId: number | null;
  onSelect: (id: number) => void;
};

// After adding or fixing an address the customer comes back here.
const ADD_ADDRESS_PATH = `${routePaths.addressNew}?next=${encodeURIComponent(routePaths.checkout)}`;

function AddressOption({
  address,
  checked,
  onSelect,
}: {
  address: Address;
  checked: boolean;
  onSelect: (id: number) => void;
}) {
  const { t } = useTranslation('checkout');

  return (
    <div className={choice.card}>
      <label className={choice.label}>
        <input
          type="radio"
          name="checkout-address"
          className={choice.input}
          checked={checked}
          disabled={!address.serviceable}
          onChange={() => {
            onSelect(address.id);
          }}
        />
        <span className={choice.body}>
          <span className={choice.title}>
            {addressName(address)}
            {address.is_default && (
              <span className={choice.badge}>
                <Icon name="check" size={14} />
                {t('address.default')}
              </span>
            )}
          </span>
          <span className={choice.meta}>
            {address.street}, {address.district}, {address.city}
          </span>
          <span className={choice.meta}>
            {address.recipient_name} · <bdi dir="ltr">{address.recipient_phone}</bdi>
          </span>
          {!address.serviceable && (
            <span className={choice.reason}>
              <Icon name="alert-circle" size={18} />
              {t('address.notServiceable')}
            </span>
          )}
        </span>
      </label>
      {!address.serviceable && (
        <Link to={routeTo.addressEdit(address.id)} className={choice.link}>
          {t('address.editPin')}
        </Link>
      )}
    </div>
  );
}

export function AddressPicker({
  addresses,
  isLoading,
  isError,
  onRetry,
  selectedId,
  onSelect,
}: AddressPickerProps) {
  const { t } = useTranslation('checkout');
  const headingId = useId();

  return (
    <section className={section.section} aria-labelledby={headingId}>
      <h2 id={headingId} className={section.heading}>
        {t('address.heading')}
      </h2>

      {isLoading && (
        <div
          className={section.skeletons}
          role="status"
          aria-busy="true"
          aria-label={t('address.loading')}
        >
          <Skeleton height="5rem" />
          <Skeleton height="5rem" />
        </div>
      )}
      {isError && <ErrorState headingLevel={3} onRetry={onRetry} />}
      {!isLoading && !isError && addresses.length === 0 && (
        <EmptyState
          headingLevel={3}
          icon="map-pin"
          title={t('address.emptyTitle')}
          message={t('address.emptyMessage')}
          action={
            <ButtonLink to={ADD_ADDRESS_PATH}>
              <Icon name="plus" size={20} />
              {t('address.add')}
            </ButtonLink>
          }
        />
      )}

      {addresses.length > 0 && (
        <>
          <div role="radiogroup" aria-labelledby={headingId} className={choice.group}>
            {addresses.map((address) => (
              <AddressOption
                key={address.id}
                address={address}
                checked={address.id === selectedId}
                onSelect={onSelect}
              />
            ))}
          </div>
          {selectedId === null && <p className={section.hint}>{t('address.noneDeliverable')}</p>}
          <ButtonLink to={ADD_ADDRESS_PATH} variant="secondary">
            <Icon name="plus" size={20} />
            {t('address.add')}
          </ButtonLink>
        </>
      )}
    </section>
  );
}
