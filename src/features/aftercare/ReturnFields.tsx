import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/shared/i18n';
import { TextField } from '@/shared/ui';
import type { CareItems } from './api';
import styles from './Care.module.css';

type Props = {
  items: CareItems;
  itemId: string;
  quantity: number;
  onItem: (id: string) => void;
  onQuantity: (qty: number) => void;
};
export function ReturnFields({ items, itemId, quantity, onItem, onQuantity }: Props) {
  const { t } = useTranslation('aftercare');
  const { language } = useLanguage();
  const id = useId();
  const available = items.filter((item) => item.returnable_quantity > 0);
  const selected = available.find((item) => String(item.id) === itemId);
  return (
    <>
      {available.length === 0 && <p role="status">{t('noItems')}</p>}
      <div className={styles.field}>
        <label htmlFor={id}>{t('item')}</label>
        <select
          id={id}
          className={styles.input}
          required
          value={itemId}
          onChange={(e) => {
            onItem(e.target.value);
          }}
        >
          <option value="">{t('selectItem')}</option>
          {available.map((item) => (
            <option key={item.id} value={item.id}>
              {language === 'ar' ? item.name.ar : item.name.en}{' '}
              {language === 'ar' ? item.variant_name.ar : item.variant_name.en}
            </option>
          ))}
        </select>
      </div>
      <TextField
        label={t('quantity')}
        type="number"
        min={1}
        max={selected?.returnable_quantity ?? 0}
        required
        value={Number.isFinite(quantity) ? quantity : ''}
        onChange={(e) => {
          onQuantity(e.target.valueAsNumber);
        }}
      />
    </>
  );
}
