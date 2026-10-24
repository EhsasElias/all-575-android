import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/shared/i18n';
import { cx } from '@/shared/lib';
import { Icon } from '@/shared/ui';
import type { Variant } from '../api/types';
import { AvailabilityBadge } from '../components/AvailabilityBadge';
import { pickText } from '../lib/localized';
import styles from './VariantPicker.module.css';

type VariantPickerProps = {
  variants: readonly Variant[];
  selectedId: number;
  onSelect: (variantId: number) => void;
};

/** One radio per variant. Unavailable ones are labeled, not hidden. Only shown when there is a choice to make. */
export function VariantPicker({ variants, selectedId, onSelect }: VariantPickerProps) {
  const { t } = useTranslation('catalog');
  const { language } = useLanguage();
  const groupName = useId();

  return (
    <fieldset className={styles.picker}>
      <legend className={styles.legend}>{t('product.optionsLegend')}</legend>
      <div className={styles.options}>
        {variants.map((variant) => {
          const selected = variant.id === selectedId;
          const showStatus =
            variant.availability === 'out_of_stock' || variant.availability === 'low_stock';
          return (
            <label key={variant.id} className={cx(styles.option, selected && styles.selected)}>
              <input
                type="radio"
                name={groupName}
                value={variant.id}
                checked={selected}
                className={styles.radio}
                onChange={() => {
                  onSelect(variant.id);
                }}
              />
              <span className={styles.name}>
                {selected && <Icon name="check" size={18} />}
                {pickText(variant.name, language) || variant.sku}
              </span>
              {showStatus && <AvailabilityBadge availability={variant.availability} />}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
