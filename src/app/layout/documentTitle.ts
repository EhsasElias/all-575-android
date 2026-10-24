import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMatches } from 'react-router';

export const TITLE_KEYS = [
  'appName',
  'nav.home',
  'nav.categories',
  'nav.cart',
  'nav.checkout',
  'nav.orders',
  'nav.account',
  'nav.signIn',
] as const;

export type TitleKey = (typeof TITLE_KEYS)[number];

export function titled(titleKey: TitleKey): { titleKey: TitleKey } {
  return { titleKey };
}

function readTitleKey(handle: unknown): TitleKey | null {
  if (typeof handle !== 'object' || handle === null || !('titleKey' in handle)) return null;
  return TITLE_KEYS.find((key) => key === handle.titleKey) ?? null;
}

/** Keeps the browser title in step with the current screen, in the current language. */
export function useDocumentTitle(): void {
  const { t } = useTranslation();
  const matches = useMatches();
  const titleKey = readTitleKey(matches.at(-1)?.handle);
  const appName = t('appName');
  const title =
    titleKey === null || titleKey === 'appName' ? appName : `${t(titleKey)} · ${appName}`;

  useEffect(() => {
    document.title = title;
  }, [title]);
}
