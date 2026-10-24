import { useTranslation } from 'react-i18next';
import { ErrorState } from '@/shared/ui';
import { MAIN_CONTENT_ID } from './SkipLink';

/** Last line of defence when a screen throws: say what happened and offer a retry. */
export function RouteError() {
  const { t } = useTranslation();

  return (
    <main id={MAIN_CONTENT_ID}>
      <ErrorState
        headingLevel={1}
        title={t('routeError.title')}
        message={t('routeError.message')}
        onRetry={() => {
          window.location.reload();
        }}
      />
    </main>
  );
}
