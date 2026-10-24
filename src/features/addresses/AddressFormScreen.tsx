import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, useSearchParams } from 'react-router';
import { isApiError } from '@/shared/api';
import { routePaths, safeNextPath } from '@/shared/lib';
import { ButtonLink, EmptyState, ErrorState, Skeleton } from '@/shared/ui';
import { AddressForm } from './AddressForm';
import { getAddress } from './api';
import { addressKeys } from './queryKeys';
import styles from './AddressFormScreen.module.css';

function parseAddressId(raw: string): number | null {
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function NotFound() {
  const { t } = useTranslation('addresses');
  return (
    <EmptyState
      icon="map-pin"
      title={t('form.notFound.title')}
      message={t('form.notFound.message')}
      action={<ButtonLink to={routePaths.addresses}>{t('form.notFound.action')}</ButtonLink>}
    />
  );
}

function EditAddress({ addressId, nextPath }: { addressId: number; nextPath: string | null }) {
  const { t: tCommon } = useTranslation();
  const query = useQuery({
    queryKey: addressKeys.detail(addressId),
    queryFn: ({ signal }) => getAddress(addressId, signal),
  });

  if (query.isPending) {
    return (
      <div role="status" aria-busy="true" aria-label={tCommon('states.loading')}>
        <Skeleton height="24rem" />
      </div>
    );
  }
  if (query.isError) {
    // Someone else's address answers 404 as well, so the two cases look the same to the customer.
    if (isApiError(query.error) && query.error.kind === 'not-found') return <NotFound />;
    return (
      <ErrorState
        headingLevel={2}
        onRetry={() => {
          void query.refetch();
        }}
      />
    );
  }
  return <AddressForm key={query.data.id} address={query.data} nextPath={nextPath} />;
}

/** Add a new address (`/account/addresses/new`) or edit one (`/account/addresses/:addressId`). */
export function AddressFormScreen() {
  const { t } = useTranslation('addresses');
  const { addressId } = useParams();
  const [searchParams] = useSearchParams();
  const next = searchParams.get('next');
  const nextPath = next === null ? null : safeNextPath(next);
  const editing = addressId !== undefined;
  const id = editing ? parseAddressId(addressId) : null;

  return (
    <div className={styles.screen}>
      <h1 className={styles.title}>{editing ? t('titles.edit') : t('titles.new')}</h1>
      {!editing && <AddressForm address={null} nextPath={nextPath} />}
      {editing && id === null && <NotFound />}
      {editing && id !== null && <EditAddress addressId={id} nextPath={nextPath} />}
    </div>
  );
}
