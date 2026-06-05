import { RouteObject } from 'react-router-dom';
import LandingPage from '@/modules/core/pages/LandingPage';
import LodgeSelectionPage from '@/modules/core/pages/LodgeSelectionPage';
import LodgeDashboard from '@/modules/core/pages/LodgeDashboard';
import DashboardHome from '@/modules/core/pages/DashboardHome';
import Obediences from '@/modules/core/pages/Obediences';
import ObedienceForm from '@/modules/core/pages/ObedienceForm';
import Lodges from '@/modules/core/pages/Lodges';
import LodgeForm from '@/modules/core/pages/LodgeForm';
import LodgeQRCode from '@/modules/core/pages/LodgeQRCode';
import SuperAdminsManagement from '@/modules/core/pages/SuperAdminsManagement';
import SuperAdminForm from '@/modules/core/pages/SuperAdminForm';
import AdministrativeProcessesPage from '@/modules/core/pages/AdministrativeProcessesPage';
import ObedienceDashboardPage from '@/modules/core/pages/ObedienceDashboardPage';
import CommitteesPage from '@/modules/core/pages/Committees/CommitteesPage';


export const corePublicRoutes: RouteObject[] = [
  { path: '/', element: <LandingPage /> },
  { path: '/select-lodge', element: <LodgeSelectionPage /> },
];

export const coreLodgeDashboardRoutes: RouteObject[] = [
  { index: true, element: <LodgeDashboard /> },
  { path: 'chanceler/comissoes', element: <CommitteesPage /> },
];

export const coreDashboardRoutes: RouteObject[] = [
  { index: true, element: <DashboardHome /> },
  { path: 'management/obediences', element: <Obediences /> },
  { path: 'management/obediences/new', element: <ObedienceForm /> },
  { path: 'management/obediences/edit/:id', element: <ObedienceForm /> },
  { path: 'management/lodges', element: <Lodges /> },
  { path: 'management/lodges/new', element: <LodgeForm /> },
  { path: 'management/lodges/edit/:id', element: <LodgeForm /> },
  { path: 'management/lodges/qr-code/:id?', element: <LodgeQRCode /> },
  { path: 'management/super-admins', element: <SuperAdminsManagement /> },
  { path: 'management/super-admins/new', element: <SuperAdminForm /> },
  { path: 'management/super-admins/edit/:id', element: <SuperAdminForm /> },
  { path: 'administrative-processes', element: <AdministrativeProcessesPage /> },
  { path: 'obedience-dashboard', element: <ObedienceDashboardPage /> },
];
