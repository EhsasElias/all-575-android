import { RouterProvider } from 'react-router';
import { AppProviders } from './providers';
import type { createAppRouter } from './router';

type AppProps = {
  router: ReturnType<typeof createAppRouter>;
};

export function App({ router }: AppProps) {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
