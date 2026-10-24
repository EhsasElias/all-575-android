import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMatches } from 'react-router';
import { PageTitle } from '@/shared/lib';

/** Keeps the browser title in step with the current screen, in the current language. */
export function useDocumentTitle(): void {
  const { t } = useTranslation();
  const handle = useMatches().at(-1)?.handle;
  const appName = t('appName');
  const screenTitle = handle instanceof PageTitle ? handle.resolve(t) : null;
  const title =
    screenTitle === null || screenTitle === appName ? appName : `${screenTitle} · ${appName}`;

  useEffect(() => {
    document.title = title;
  }, [title]);
}
