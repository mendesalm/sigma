import { createBrowserRouter } from 'react-router-dom';
import App from '@/App';
import PublicLayout from '@/shared/layouts/PublicLayout';
import DashboardLayout from '@/shared/layouts/DashboardLayout';
import LodgeDashboardLayout from '@/shared/layouts/LodgeDashboardLayout';

import { corePublicRoutes, coreLodgeDashboardRoutes, coreDashboardRoutes } from '@/modules/core/routes';
import { accessControlPublicRoutes, accessControlDashboardRoutes, accessControlLodgeDashboardRoutes } from '@/modules/access_control/routes';
import { membersLodgeDashboardRoutes, membersDashboardRoutes } from '@/modules/members/routes';
import { financeLodgeDashboardRoutes } from '@/modules/finance/routes';
import { sessionsLodgeDashboardRoutes, sessionsPublicRoutes, sessionsDashboardRoutes } from '@/modules/sessions/routes';
import { communicationLodgeDashboardRoutes, communicationDashboardRoutes } from '@/modules/communication/routes';
import { libraryLodgeDashboardRoutes } from '@/modules/library/routes';
import { cashlessLodgeDashboardRoutes } from '@/modules/cashless/routes';

const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          ...corePublicRoutes,
          ...accessControlPublicRoutes,
          ...sessionsPublicRoutes,
        ]
      },
      {
        path: '/dashboard',
        children: [
          {
            path: 'lodge-dashboard',
            element: <LodgeDashboardLayout />,
            children: [
              ...coreLodgeDashboardRoutes,
              ...accessControlLodgeDashboardRoutes,
              ...membersLodgeDashboardRoutes,
              ...financeLodgeDashboardRoutes,
              ...sessionsLodgeDashboardRoutes,
              ...communicationLodgeDashboardRoutes,
              ...libraryLodgeDashboardRoutes,
              ...cashlessLodgeDashboardRoutes,
            ]
          },
          {
            element: <DashboardLayout />,
            children: [
              ...coreDashboardRoutes,
              ...accessControlDashboardRoutes,
              ...membersDashboardRoutes,
              ...sessionsDashboardRoutes,
              ...communicationDashboardRoutes,
            ]
          }
        ]
      }
    ]
  }
]);

export default router;
