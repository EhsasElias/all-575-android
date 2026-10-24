import { useTranslation } from 'react-i18next';
import { Button } from '../Button/Button';
import { EmptyState, type HeadingLevel } from '../EmptyState/EmptyState';

type ErrorStateProps = {
  onRetry: () => void;
  title?: string;
  message?: string;
  headingLevel?: HeadingLevel | undefined;
  className?: string | undefined;
};

/** What went wrong, what to do next, and a retry. */
export function ErrorState({ onRetry, title, message, headingLevel, className }: ErrorStateProps) {
  const { t } = useTranslation();

  return (
    <EmptyState
      icon="alert-circle"
      tone="error"
      role="alert"
      title={title ?? t('states.errorTitle')}
      message={message ?? t('states.errorMessage')}
      action={<Button onClick={onRetry}>{t('actions.retry')}</Button>}
      headingLevel={headingLevel}
      className={className}
    />
  );
}
