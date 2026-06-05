import { RouteObject } from 'react-router-dom';
import LoginPage from '@/modules/access_control/pages/LoginPage';
import WebmastersManagement from '@/modules/access_control/pages/WebmastersManagement';
import WebmasterForm from '@/modules/access_control/pages/WebmasterForm';
import RoleHistoryForm from '@/modules/access_control/pages/RoleHistoryForm';
import PermissionsPage from '@/modules/access_control/pages/PermissionsPage';
import RolesPage from '@/modules/access_control/pages/RolesPage';
import RolesPermissionsPage from '@/modules/access_control/pages/RolesPermissionsPage';
import WebmasterRoleAssignmentPage from '@/modules/access_control/pages/WebmasterRoleAssignmentPage';
import AdministrationPage from '@/modules/access_control/pages/Webmaster/AdministrationPage';
import MyLodgePage from '@/modules/access_control/pages/Webmaster/MyLodgePage';
import DocumentConfigPage from '@/modules/access_control/pages/Webmaster/DocumentConfigPage';


export const accessControlPublicRoutes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
];

export const accessControlLodgeDashboardRoutes: RouteObject[] = [
  { path: 'secretario/exercicio/diretoria', element: <AdministrationPage /> },
  { path: 'webmaster/minha-loja', element: <MyLodgePage /> },
  { path: 'webmaster/documentos', element: <DocumentConfigPage /> },
  { path: 'webmaster/administracoes', element: <AdministrationPage /> },
];

export const accessControlDashboardRoutes: RouteObject[] = [
  { path: 'management/webmasters', element: <WebmastersManagement /> },
  { path: 'management/webmasters/new', element: <WebmasterForm /> },
  { path: 'management/webmasters/edit/:id', element: <WebmasterForm /> },
  { path: 'management/role-history/new', element: <RoleHistoryForm /> },
  { path: 'management/role-history/edit/:id', element: <RoleHistoryForm /> },
  { path: 'permissions', element: <PermissionsPage /> },
  { path: 'roles', element: <RolesPage /> },
  { path: 'roles-permissions', element: <RolesPermissionsPage /> },
  { path: 'webmaster-role-assignment', element: <WebmasterRoleAssignmentPage /> },
];
