import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon, type IconName } from '@/shared/ui';
import choice from './choice.module.css';
import { PAY_METHODS, type PayMethod } from './payment';
import section from './section.module.css';

type PaymentMethodPickerProps = {
  value: PayMethod;
  onChange: (method: PayMethod) => void;
  /** The heading level matches where the picker sits (a section of checkout, or the retry step of a payment). */
  headingLevel?: 'h2' | 'h3';
  /** Names the group when the surrounding screen already has its own heading. */
  label?: string;
};

const ICONS = {
  mada: 'credit-card',
  card: 'credit-card',
  apple_pay: 'shield',
} as const satisfies Record<PayMethod, IconName>;

/** The ways to pay as real, selectable cards (a radio group), each with a short description. */
export function PaymentMethodPicker({
  value,
  onChange,
  headingLevel: Heading = 'h2',
  label,
}: PaymentMethodPickerProps) {
  const { t } = useTranslation('checkout');
  const headingId = useId();

  return (
    <section className={section.section} aria-labelledby={headingId}>
      <Heading id={headingId} className={section.heading}>
        {label ?? t('method.heading')}
      </Heading>
      <div role="radiogroup" aria-labelledby={headingId} className={choice.group}>
        {PAY_METHODS.map((method) => (
          <div key={method} className={choice.card}>
            <label className={choice.label}>
              <input
                type="radio"
                name="payment-method"
                className={choice.input}
                value={method}
                checked={method === value}
                onChange={() => {
                  onChange(method);
                }}
              />
              <Icon name={ICONS[method]} size={24} />
              <span className={choice.body}>
                <span className={choice.title}>{t(`method.options.${method}.name`)}</span>
                <span className={choice.meta}>{t(`method.options.${method}.description`)}</span>
              </span>
            </label>
          </div>
        ))}
      </div>
    </section>
  );
}
