import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui';
import type { LookupStatus } from './useMapAddressLookup';

export function MapAddressStatus({
  status,
  onRetry,
}: {
  status: LookupStatus;
  onRetry: () => void;
}) {
  const { t } = useTranslation('addresses');
  if (status === 'idle') return null;
  return (
    <div aria-live="polite" aria-busy={status === 'loading'}>
      <p role="status">{t(`form.pin.lookup.${status}`)}</p>
      {(status === 'failed' || status === 'empty') && (
        <Button variant="secondary" onClick={onRetry}>
          {t('form.pin.lookup.retry')}
        </Button>
      )}
    </div>
  );
}
