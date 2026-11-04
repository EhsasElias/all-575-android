import { Outlet } from 'react-router';
import { ThemeSync } from '@/shared/theme';
import { useDocumentTitle } from './documentTitle';
import { SkipLink } from './SkipLink';

export function RootLayout() {
  useDocumentTitle();

  return (
    <>
      <ThemeSync />
      <SkipLink />
      <Outlet />
    </>
  );
}
