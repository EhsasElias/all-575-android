import { useId, type RefObject, type SyntheticEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon, IconButton, VisuallyHidden } from '@/shared/ui';
import styles from './SearchBox.module.css';

type SearchBoxProps = {
  value: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
};

export function SearchBox({ value, inputRef, onChange, onSubmit, onClear }: SearchBoxProps) {
  const { t } = useTranslation('catalog');
  const inputId = useId();

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form role="search" className={styles.box} onSubmit={handleSubmit}>
      <VisuallyHidden>
        <label htmlFor={inputId}>{t('search.label')}</label>
      </VisuallyHidden>
      <Icon name="search" className={styles.icon} />
      <input
        ref={inputRef}
        id={inputId}
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        spellCheck={false}
        maxLength={100}
        placeholder={t('search.placeholder')}
        value={value}
        className={styles.input}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      />
      {value !== '' && (
        <IconButton label={t('search.clear')} onClick={onClear}>
          <Icon name="close" />
        </IconButton>
      )}
    </form>
  );
}
