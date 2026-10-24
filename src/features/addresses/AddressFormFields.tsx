import type { HTMLInputAutoCompleteAttribute, InputHTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';
import { TextField } from '@/shared/ui';
import { fieldId, type AddressField, type AddressValues } from './addressFields';
import type { en } from './locales.en';
import type { AddressProblems } from './splRules';
import { TextAreaField } from './TextAreaField';
import { useProblemMessage } from './useProblemMessage';
import styles from './AddressForm.module.css';

type FieldLabel = keyof typeof en.form.fields;

type FieldSpec = {
  field: AddressField;
  label: FieldLabel;
  hint?: FieldLabel;
  autoComplete: HTMLInputAutoCompleteAttribute;
  inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode'];
  /** Phone numbers and codes read left to right in Arabic too (a "+" would otherwise land on the wrong side). */
  ltr?: boolean;
};

const RECIPIENT_FIELDS: readonly FieldSpec[] = [
  { field: 'label', label: 'label', hint: 'labelHint', autoComplete: 'off' },
  { field: 'recipientName', label: 'recipientName', autoComplete: 'name' },
  {
    field: 'recipientPhone',
    label: 'recipientPhone',
    hint: 'recipientPhoneHint',
    autoComplete: 'tel',
    inputMode: 'tel',
    ltr: true,
  },
];

const NATIONAL_ADDRESS_FIELDS: readonly FieldSpec[] = [
  { field: 'region', label: 'region', autoComplete: 'address-level1' },
  { field: 'city', label: 'city', autoComplete: 'address-level2' },
  { field: 'district', label: 'district', autoComplete: 'address-level3' },
  { field: 'street', label: 'street', autoComplete: 'street-address' },
  {
    field: 'buildingNumber',
    label: 'buildingNumber',
    hint: 'buildingNumberHint',
    autoComplete: 'off',
    inputMode: 'numeric',
  },
  {
    field: 'additionalNumber',
    label: 'additionalNumber',
    hint: 'additionalNumberHint',
    autoComplete: 'off',
    inputMode: 'numeric',
  },
  {
    field: 'postalCode',
    label: 'postalCode',
    hint: 'postalCodeHint',
    autoComplete: 'postal-code',
    inputMode: 'numeric',
  },
  {
    field: 'shortAddress',
    label: 'shortAddress',
    hint: 'shortAddressHint',
    autoComplete: 'off',
    ltr: true,
  },
  { field: 'unit', label: 'unit', autoComplete: 'off' },
  { field: 'floor', label: 'floor', autoComplete: 'off' },
];

type FieldsProps = {
  values: AddressValues;
  problems: AddressProblems;
  onChange: (field: AddressField, value: string) => void;
};

function SpecField({ spec, values, problems, onChange }: FieldsProps & { spec: FieldSpec }) {
  const { t } = useTranslation('addresses');
  const message = useProblemMessage();
  const error = message(spec.field, problems[spec.field]);

  return (
    <TextField
      id={fieldId(spec.field)}
      label={t(`form.fields.${spec.label}`)}
      {...(spec.hint ? { hint: t(`form.fields.${spec.hint}`) } : {})}
      {...(error ? { error } : {})}
      value={values[spec.field]}
      onChange={(event) => {
        onChange(spec.field, event.target.value);
      }}
      autoComplete={spec.autoComplete}
      {...(spec.inputMode ? { inputMode: spec.inputMode } : {})}
      {...(spec.ltr ? { dir: 'ltr' as const } : {})}
    />
  );
}

/** The recipient and the Saudi National Address (SPL) fields. */
export function AddressFormFields(props: FieldsProps) {
  const { t } = useTranslation('addresses');
  const message = useProblemMessage();

  return (
    <>
      <section className={styles.section} aria-labelledby="address-recipient-heading">
        <h2 id="address-recipient-heading" className={styles.heading}>
          {t('form.sections.recipient')}
        </h2>
        {RECIPIENT_FIELDS.map((spec) => (
          <SpecField key={spec.field} spec={spec} {...props} />
        ))}
      </section>

      <section className={styles.section} aria-labelledby="address-national-heading">
        <h2 id="address-national-heading" className={styles.heading}>
          {t('form.sections.address')}
        </h2>
        <p className={styles.country}>
          <span className={styles.countryLabel}>{t('form.country')}</span> {t('form.countryValue')}
        </p>
        {NATIONAL_ADDRESS_FIELDS.map((spec) => (
          <SpecField key={spec.field} spec={spec} {...props} />
        ))}
        <TextAreaField
          id={fieldId('deliveryNotes')}
          label={t('form.fields.deliveryNotes')}
          hint={t('form.fields.deliveryNotesHint')}
          error={message('deliveryNotes', props.problems.deliveryNotes)}
          value={props.values.deliveryNotes}
          onChange={(event) => {
            props.onChange('deliveryNotes', event.target.value);
          }}
        />
      </section>
    </>
  );
}
