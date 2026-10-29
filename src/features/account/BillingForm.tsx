import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, TextField } from '@/shared/ui';
import { billingKey, putBilling, type BillingProfile } from './customerApi';
import styles from './CustomerForms.module.css';
export function BillingForm({ initial }: { initial: BillingProfile }) {
  const { t } = useTranslation('customer');
  const queryClient = useQueryClient();
  const [type, setType] = useState(initial.buyer_type);
  const [company, setCompany] = useState(initial.company_name ?? '');
  const [registration, setRegistration] = useState(initial.registration_number ?? '');
  const [vat, setVat] = useState(initial.vat_number ?? '');
  const [address, setAddress] = useState(initial.billing_address ?? '');
  const save = useMutation({
    mutationFn: putBilling,
    onSuccess: (data) => {
      queryClient.setQueryData(billingKey, data);
    },
  });
  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        if (save.isPending) return;
        save.mutate({
          buyer_type: type,
          company_name: company.trim() || null,
          registration_number: registration || null,
          vat_number: vat || null,
          billing_address: address.trim() || null,
        });
      }}
    >
      <p className={styles.hint}>{t('billingHint')}</p>
      <label>
        {t('buyerType')}
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            save.reset();
          }}
        >
          <option value="individual">{t('individual')}</option>
          <option value="business">{t('business')}</option>
        </select>
      </label>
      {type === 'business' && (
        <>
          <TextField
            label={t('company')}
            value={company}
            onChange={(e) => {
              setCompany(e.target.value);
              save.reset();
            }}
            maxLength={200}
            required
            autoComplete="organization"
          />
          <TextField
            label={t('registration')}
            value={registration}
            onChange={(e) => {
              setRegistration(e.target.value);
              save.reset();
            }}
            inputMode="numeric"
            pattern="[0-9]{10}"
            maxLength={10}
            dir="ltr"
          />
          <TextField
            label={t('vat')}
            hint={t('vatHint')}
            value={vat}
            onChange={(e) => {
              setVat(e.target.value);
              save.reset();
            }}
            inputMode="numeric"
            pattern="3[0-9]{13}3"
            maxLength={15}
            dir="ltr"
          />
          <label>
            {t('address')}
            <textarea
              value={address}
              maxLength={500}
              required
              onChange={(e) => {
                setAddress(e.target.value);
                save.reset();
              }}
            />
          </label>
        </>
      )}
      {save.isError && <p role="alert">{t('failed')}</p>}
      {save.isSuccess && <p role="status">{t('saved')}</p>}
      <Button type="submit" loading={save.isPending}>
        {t('save')}
      </Button>
    </form>
  );
}
