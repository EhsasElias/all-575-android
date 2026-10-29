import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { routePaths } from '@/shared/lib';
import { Button, Icon } from '@/shared/ui';
import { fieldId, MAX_ADDRESSES } from './addressFields';
import { AddressFormFields } from './AddressFormFields';
import { AddressSavedPanel } from './AddressSavedPanel';
import type { Address } from './api';
import { LocationPicker } from './LocationPicker';
import { useAddressForm } from './useAddressForm';
import { useProblemMessage } from './useProblemMessage';
import styles from './AddressForm.module.css';

type AddressFormProps = {
  /** The address being edited, or null for a new one. */
  address: Address | null;
  nextPath: string | null;
};

export function AddressForm({ address, nextPath }: AddressFormProps) {
  const { t } = useTranslation('addresses');
  const message = useProblemMessage();
  const form = useAddressForm(address);
  const focusPinOnReturn = useRef(false);

  // After "Edit the pin" the form is shown again; its pin button is the natural place for the focus.
  useEffect(() => {
    if (form.saved === null && focusPinOnReturn.current) {
      focusPinOnReturn.current = false;
      document.getElementById(fieldId('pin'))?.focus();
    }
  });

  if (form.saved) {
    return (
      <AddressSavedPanel
        address={form.saved}
        isNew={form.isNew}
        nextPath={nextPath}
        onEditPin={() => {
          focusPinOnReturn.current = true;
          form.dismissSaved();
        }}
      />
    );
  }

  const showMakeDefault = !address?.is_default;

  return (
    <form
      noValidate
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        const firstProblem = form.submit();
        if (firstProblem !== null) document.getElementById(fieldId(firstProblem))?.focus();
      }}
    >
      {form.failure && (
        <div className={styles.summary} role="alert">
          <Icon name="alert-circle" size={20} />
          <span>
            {form.failure === 'limit' && t('form.limitReached', { max: MAX_ADDRESSES })}
            {form.failure === 'fields' && t('form.errors.summary')}
            {form.failure === 'network' && t('form.failed')}
          </span>
          {form.failure === 'limit' && (
            <Link to={routePaths.addresses} className={styles.summaryLink}>
              {t('titles.list')}
            </Link>
          )}
        </div>
      )}
      {Object.keys(form.problems).length > 0 && !form.failure && (
        <div className={styles.summary} role="alert">
          <Icon name="alert-circle" size={20} />
          <span>{t('form.errors.summary')}</span>
        </div>
      )}

      <AddressFormFields values={form.values} problems={form.problems} onChange={form.setField} />
      <LocationPicker
        pin={form.pin}
        onPinChange={form.placePin}
        error={message('pin', form.problems.pin)}
        lookupStatus={form.lookupStatus}
        onRetryLookup={form.retryLookup}
      />

      {showMakeDefault && (
        <label className={styles.check}>
          <input
            type="checkbox"
            className={styles.checkInput}
            checked={form.makeDefault}
            onChange={(event) => {
              form.setMakeDefault(event.target.checked);
            }}
          />
          {t('form.makeDefault')}
        </label>
      )}

      <div className={styles.actions}>
        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={form.isSaving}
          disabled={form.lookupStatus === 'loading'}
        >
          {address === null ? t('form.submit.create') : t('form.submit.update')}
        </Button>
      </div>
    </form>
  );
}
