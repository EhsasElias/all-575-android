import { lazy, Suspense, useId, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Icon, Skeleton, VisuallyHidden } from '@/shared/ui';
import { fieldId } from './addressFields';
import { MapBoundary } from './MapBoundary';
import { MapAddressStatus } from './MapAddressStatus';
import type { LookupStatus } from './useMapAddressLookup';
import type { MapPin, PinMapLabels } from './mapTypes';
import { useCurrentLocation, type CurrentLocation } from './useCurrentLocation';
import { usePinZone } from './usePinZone';
import styles from './LocationPicker.module.css';

// Leaflet is large, so it is fetched only when this screen is opened, not with the main bundle.
const PinMap = lazy(() =>
  import('./LeafletMap').then((module) => ({ default: module.LeafletMap })),
);

type LocationPickerProps = {
  pin: MapPin | null;
  onPinChange: (pin: MapPin) => void;
  error: string | undefined;
  lookupStatus: LookupStatus;
  onRetryLookup: () => void;
};

function useLocationMessage(location: CurrentLocation): string | null {
  const { t } = useTranslation('addresses');
  if (location.status === 'found') return t('form.pin.found');
  if (location.status !== 'failed') return null;
  return location.reason === 'denied' ? t('form.pin.denied') : t('form.pin.unavailable');
}

function PinStatus({ pin, error }: { pin: MapPin | null; error: string | undefined }) {
  const { t } = useTranslation('addresses');
  const zone = usePinZone(pin);

  if (error) {
    return (
      <p className={styles.error} role="alert">
        <Icon name="alert-circle" size={18} />
        {error}
      </p>
    );
  }
  if (pin === null) return <p className={styles.status}>{t('form.pin.notSet')}</p>;

  return (
    <div className={styles.status} aria-live="polite">
      <p>
        <Icon name="map-pin" size={18} /> {t('form.pin.isSet')}
      </p>
      {zone.data && (
        <p className={zone.data.serviceable ? styles.good : styles.warn}>
          <Icon name={zone.data.serviceable ? 'check-circle' : 'alert-circle'} size={18} />{' '}
          {zone.data.serviceable ? t('form.pin.deliverable') : t('form.pin.notDeliverable')}
        </p>
      )}
    </div>
  );
}

/** The required map pin: tap the map, drag the pin, or use the device position (only when the button is tapped). */
export function LocationPicker({
  pin,
  onPinChange,
  error,
  lookupStatus,
  onRetryLookup,
}: LocationPickerProps) {
  const { t } = useTranslation('addresses');
  const { t: tCommon } = useTranslation();
  const headingId = useId();
  const { location, locate } = useCurrentLocation(onPinChange);
  const locationMessage = useLocationMessage(location);

  const labels = useMemo<PinMapLabels>(
    () => ({
      map: t('form.pin.mapLabel'),
      pin: t('form.pin.pinLabel'),
      zoomIn: t('form.pin.zoomIn'),
      zoomOut: t('form.pin.zoomOut'),
      placeAtCenter: t('form.pin.placeAtCenter'),
    }),
    [t],
  );

  return (
    <section className={styles.section} aria-labelledby={headingId}>
      <h2 id={headingId} className={styles.heading}>
        {t('form.pin.heading')}
      </h2>
      <p className={styles.help}>{t('form.pin.help')}</p>

      <Button
        id={fieldId('pin')}
        variant="secondary"
        loading={location.status === 'locating'}
        onClick={() => void locate()}
      >
        <Icon name="locate" size={20} />
        {t('form.pin.useMyLocation')}
      </Button>
      <p className={styles.locationMessage} role="status">
        {locationMessage}
      </p>

      <MapBoundary fallback={<p className={styles.warn}>{t('form.pin.mapFailed')}</p>}>
        <Suspense
          fallback={
            <div role="status" aria-busy="true">
              <Skeleton height="20rem" />
              <VisuallyHidden>{tCommon('states.loading')}</VisuallyHidden>
            </div>
          }
        >
          <PinMap pin={pin} labels={labels} onPinChange={onPinChange} />
        </Suspense>
      </MapBoundary>

      <PinStatus pin={pin} error={error} />
      <MapAddressStatus status={lookupStatus} onRetry={onRetryLookup} />
    </section>
  );
}
