import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { routePaths } from '@/shared/lib';
import { ButtonLink, EmptyState, ErrorState, Icon, Skeleton } from '@/shared/ui';
import { MAX_ADDRESSES } from './addressFields';
import { AddressCard } from './AddressCard';
import { DeleteAddressSheet } from './DeleteAddressSheet';
import { useAddressBook } from './useAddressBook';
import styles from './AddressesScreen.module.css';

function AddressListSkeleton({ label }: { label: string }) {
  return (
    <div className={styles.skeletons} role="status" aria-busy="true" aria-label={label}>
      <Skeleton height="9rem" />
      <Skeleton height="9rem" />
    </div>
  );
}

export function AddressesScreen() {
  const { t } = useTranslation('addresses');
  const headingRef = useRef<HTMLHeadingElement>(null);
  const book = useAddressBook();
  const { list } = book;
  const addresses = list.data ?? [];
  const previousCount = useRef(addresses.length);

  // A deleted card takes the focus with it, so the heading takes it over once the list has shrunk.
  useEffect(() => {
    if (addresses.length < previousCount.current) headingRef.current?.focus();
    previousCount.current = addresses.length;
  }, [addresses.length]);
  const atLimit = addresses.length >= MAX_ADDRESSES;

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1 ref={headingRef} tabIndex={-1} className={styles.title}>
          {t('list.heading')}
        </h1>
        <p className={styles.intro}>{t('list.intro', { max: MAX_ADDRESSES })}</p>
      </header>

      {list.isPending && <AddressListSkeleton label={t('list.loading')} />}
      {list.isError && (
        <ErrorState
          headingLevel={2}
          onRetry={() => {
            void list.refetch();
          }}
        />
      )}
      {list.isSuccess && addresses.length === 0 && (
        <EmptyState
          headingLevel={2}
          icon="map-pin"
          title={t('list.empty.title')}
          message={t('list.empty.message')}
          action={
            <ButtonLink to={routePaths.addressNew}>
              <Icon name="plus" size={20} />
              {t('list.empty.action')}
            </ButtonLink>
          }
        />
      )}

      {addresses.length > 0 && (
        <>
          <ul className={styles.list}>
            {addresses.map((address) => (
              <li key={address.id}>
                <AddressCard
                  address={address}
                  name={book.addressName(address)}
                  settingDefault={book.settingDefaultId === address.id}
                  onSetDefault={book.setDefault}
                  onDelete={book.askToDelete}
                />
              </li>
            ))}
          </ul>
          {atLimit ? (
            <p className={styles.limit} role="status">
              <Icon name="info" size={20} />
              {t('list.limitReached', { max: MAX_ADDRESSES })}
            </p>
          ) : (
            <ButtonLink to={routePaths.addressNew} size="lg" fullWidth>
              <Icon name="plus" size={20} />
              {t('list.add')}
            </ButtonLink>
          )}
        </>
      )}

      <DeleteAddressSheet
        name={book.pendingDelete ? book.addressName(book.pendingDelete) : null}
        deleting={book.isDeleting}
        onCancel={book.cancelDelete}
        onConfirm={book.confirmDelete}
      />
    </div>
  );
}
