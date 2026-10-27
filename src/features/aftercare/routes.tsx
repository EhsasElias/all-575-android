import type { RouteObject } from 'react-router';
import { routePaths, titled } from '@/shared/lib';
import { CaseDetailScreen } from './CaseDetailScreen';
import { CaseListScreen } from './CaseListScreen';
import { NewCaseScreen } from './NewCaseScreen';
export const aftercareRoutes: RouteObject[] = [
  {
    path: routePaths.customerCases,
    element: <CaseListScreen />,
    handle: titled((t) => t('title', { ns: 'aftercare' })),
  },
  {
    path: routePaths.customerCase,
    element: <CaseDetailScreen />,
    handle: titled((t) => t('detail', { ns: 'aftercare' })),
  },
  {
    path: routePaths.orderHelp,
    element: <NewCaseScreen />,
    handle: titled((t) => t('newTitle', { ns: 'aftercare' })),
  },
];
