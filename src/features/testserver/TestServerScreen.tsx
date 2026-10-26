import { useTranslation } from 'react-i18next';
import { env } from '@/shared/lib';
import { Button, TextField } from '@/shared/ui';
import { useServerForm } from './useServerForm';
import styles from './TestServerScreen.module.css';

/** Where a tester of a test build chooses the server, for example a laptop on the same Wi-Fi. */
export function TestServerScreen() {
  const { t } = useTranslation('testserver');
  const form = useServerForm();
  const checking = form.check === 'checking';

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('title')}</h1>
        <p className={styles.lead}>{t('lead')}</p>
      </header>

      <p className={styles.current}>
        {env.apiBaseUrl === '' ? (
          t('noneYet')
        ) : (
          <>
            {t('current')} <bdi dir="ltr">{env.apiBaseUrl}</bdi>
          </>
        )}
      </p>

      <form
        className={styles.form}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          form.save();
        }}
      >
        <TextField
          label={t('field.label')}
          hint={t('field.hint')}
          error={form.invalid ? t('invalid') : undefined}
          value={form.value}
          onChange={(event) => {
            form.change(event.target.value);
          }}
          dir="ltr"
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="192.168.1.23:8000"
        />

        <div role="status" className={styles.result} data-state={form.check}>
          {form.check === 'connected' && t('connected')}
          {form.check === 'unreachable' && t('unreachable')}
          {form.notSaved && t('notSaved')}
        </div>

        <Button
          type="button"
          variant="secondary"
          loading={checking}
          onClick={() => void form.runCheck()}
        >
          {checking ? t('checking') : t('check')}
        </Button>
        <Button type="submit">{t('save')}</Button>
        <Button type="button" variant="ghost" onClick={form.reset}>
          {t('reset')}
        </Button>
      </form>
    </div>
  );
}
