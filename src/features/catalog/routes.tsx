import type { RouteObject } from 'react-router';
import { routePaths, titled } from '@/shared/lib';
import { CategoriesScreen } from './CategoriesScreen';
import { HomeScreen } from './HomeScreen';

/** Public: guests can browse. Add product, search and category routes here. */
export const catalogRoutes: RouteObject[] = [
  { path: routePaths.home, element: <HomeScreen />, handle: titled((t) => t('nav.home')) },
  {
    path: routePaths.categories,
    element: <CategoriesScreen />,
    handle: titled((t) => t('nav.categories')),
  },
];
