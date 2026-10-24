import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/shared/i18n';
import { routePaths } from '@/shared/lib';
import { Button, ButtonLink, Icon, Sheet, useToast } from '@/shared/ui';
import { pickText } from '../lib/localized';
import type { PositionFailure } from './currentPosition';
import { useChooseArea, type AreaOutcome, type AreaPhase } from './useChooseArea';
import { useDeliveryZone } from './useDeliveryZone';
import styles from './DeliverySheet.module.css';

type DeliverySheetProps = {
  open: boolean;
  onClose: () => void;
};

const LOCATION_FAILURE_KEYS = {
  denied: 'delivery.errors.denied',
  unavailable: 'delivery.errors.unavailable',
  timeout: 'delivery.errors.timeout',
} as const satisfies Record<PositionFailure, string>;

function failureKey(outcome: AreaOutcome | null) {
  if (outcome === null) return null;
  switch (outcome.kind) {
    case 'chosen':
      return null;
    case 'not-serviceable':
      return 'delivery.errors.notServiceable';
    case 'location-failed':
      return LOCATION_FAILURE_KEYS[outcome.reason];
    case 'request-failed':
      return 'delivery.errors.failed';
  }
}

const PHASE_KEYS = {
  locating: 'delivery.locating',
  checking: 'delivery.checking',
} as const satisfies Record<Exclude<AreaPhase, 'idle'>, string>;

export function DeliverySheet({ open, onClose }: DeliverySheetProps) {
  const { t } = useTranslation('catalog');
  const { language } = useLanguage();
  const { showToast } = useToast();
  const { zone, source } = useDeliveryZone();

  const { phase, outcome, choose, forgetOutcome } = useChooseArea((chosen) => {
    showToast({
      message: t('delivery.saved', { zone: pickText(chosen.name, language) }),
      variant: 'success',
    });
    onClose();
  });

  const close = () => {
    forgetOutcome();
    onClose();
  };

  const busy = phase !== 'idle';
  const failure = failureKey(outcome);
  const zoneName = zone ? pickText(zone.name, language) : '';

  return (
    <Sheet open={open} onClose={close} title={t('delivery.sheetTitle')}>
      <div className={styles.content}>
        <p>{zone ? t('delivery.introZone', { zone: zoneName }) : t('delivery.introNone')}</p>

        {source === 'address' ? (
          <p className={styles.note}>{t('delivery.fromAddress')}</p>
        ) : (
          <>
            <Button fullWidth size="lg" loading={busy} onClick={choose}>
              <Icon name="locate" />
              {t('delivery.useLocation')}
            </Button>
            <p className={styles.note}>{t('delivery.privacyNote')}</p>
          </>
        )}

        <p role="status" className={styles.status}>
          {busy && t(PHASE_KEYS[phase])}
          {failure && (
            <span className={styles.failure}>
              <Icon name="alert-circle" size={20} />
              <span>{t(failure)}</span>
            </span>
          )}
        </p>

        <ButtonLink variant="ghost" to={routePaths.addresses} onClick={close}>
          {t('delivery.manageAddresses')}
        </ButtonLink>
      </div>
    </Sheet>
  );
}
