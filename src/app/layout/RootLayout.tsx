import { Outlet } from 'react-router';
import { ThemeSync } from '@/shared/theme';
import { useDocumentTitle } from './documentTitle';
import { SkipLink } from './SkipLink';
import { useLaunchIntro } from './useLaunchIntro';

export function RootLayout() {
  useDocumentTitle();
  useLaunchIntro();

  return (
    <>
      <ThemeSync />
      <SkipLink />
      <Outlet />
    </>
  );
}
