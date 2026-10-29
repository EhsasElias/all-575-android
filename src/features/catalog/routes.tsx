import type { RouteObject } from 'react-router';
import { routePaths, titled } from '@/shared/lib';
import { CategoriesScreen } from './categories/CategoriesScreen';
import { CategoryProductsScreen } from './categories/CategoryProductsScreen';
import { HomeScreen } from './home/HomeScreen';
import { ProductScreen } from './product/ProductScreen';
import { SearchScreen } from './search/SearchScreen';
import { SavedProductsScreen } from './saved/SavedProductsScreen';
import { SellerScreen } from './seller/SellerScreen';

/** Public: guests browse freely. */
export const catalogRoutes: RouteObject[] = [
  {
    path: routePaths.savedProducts,
    element: <SavedProductsScreen />,
    handle: titled((t) => t('saved.title', { ns: 'catalog' })),
  },
  { path: routePaths.home, element: <HomeScreen />, handle: titled((t) => t('nav.home')) },
  {
    path: routePaths.categories,
    element: <CategoriesScreen />,
    handle: titled((t) => t('nav.categories')),
  },
  {
    path: routePaths.categoryProducts,
    element: <CategoryProductsScreen />,
    handle: titled((t) => t('titles.category', { ns: 'catalog' })),
  },
  {
    path: routePaths.search,
    element: <SearchScreen />,
    handle: titled((t) => t('titles.search', { ns: 'catalog' })),
  },
  {
    path: routePaths.product,
    element: <ProductScreen />,
    handle: titled((t) => t('titles.product', { ns: 'catalog' })),
  },
  {
    path: routePaths.seller,
    element: <SellerScreen />,
    handle: titled((t) => t('titles.seller', { ns: 'catalog' })),
  },
];
