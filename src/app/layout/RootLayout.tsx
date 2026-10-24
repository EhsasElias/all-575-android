import { Outlet } from 'react-router';
import { useDocumentTitle } from './documentTitle';
import { SkipLink } from './SkipLink';

export function RootLayout() {
  useDocumentTitle();

  return (
    <>
      <SkipLink />
      <Outlet />
    </>
  );
}
