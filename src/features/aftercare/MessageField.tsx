import { useId, type ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Care.module.css';
export function MessageField(props: ComponentProps<'textarea'>) {
  const { t } = useTranslation('aftercare');
  const id = useId();
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{t('message')}</label>
      <textarea
        {...props}
        id={id}
        className={styles.input}
        required
        maxLength={3000}
        rows={4}
        aria-describedby={`${id}-hint`}
      />
      <p id={`${id}-hint`} className={styles.hint}>
        {t('messageHint')}
      </p>
    </div>
  );
}
