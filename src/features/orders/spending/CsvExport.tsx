import { Capacitor } from '@capacitor/core';
import { useTranslation } from 'react-i18next';
import { Button, Icon } from '@/shared/ui';
import type { SpendingFilters } from '../api/ordersApi';
import type { DateRange } from '../types';
import { useCsvExport } from './useCsvExport';
import styles from './CsvExport.module.css';

type CsvExportProps = {
  range: DateRange;
  disabled: boolean;
  filters?: SpendingFilters;
};

function CsvDownloadButton({ range, disabled, filters }: CsvExportProps) {
  const { t } = useTranslation('orders');
  const { state, start } = useCsvExport(range, filters);

  return (
    <div className={styles.export}>
      <Button
        variant="secondary"
        disabled={disabled}
        loading={state.status === 'loading'}
        onClick={() => {
          void start();
        }}
      >
        <Icon name="download" size={20} />
        {t('export.button')}
      </Button>
      <p role="status" className={styles.note}>
        {state.status === 'done' && t('export.done', { filename: state.filename })}
      </p>
      {state.status === 'error' && (
        <p role="alert" className={styles.error}>
          {t(`export.errors.${state.reason}`)}
        </p>
      )}
    </div>
  );
}

/**
 * The CSV works through a browser download. Inside the Android app that path is not reliable, so the
 * button is replaced by an honest note instead of one that may do nothing.
 */
export function CsvExport(props: CsvExportProps) {
  const { t } = useTranslation('orders');

  if (Capacitor.isNativePlatform()) {
    return (
      <p className={styles.native}>
        <Icon name="info" size={20} />
        {t('export.nativeNote')}
      </p>
    );
  }

  // A new period starts a fresh export, so "done" for the old one never lingers.
  return (
    <CsvDownloadButton
      key={`${props.range.from}:${props.range.to}:${JSON.stringify(props.filters ?? {})}`}
      {...props}
    />
  );
}
