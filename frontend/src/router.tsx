import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';

import Obediences from './pages/Management/Obediences';
import ObedienceForm from './pages/Management/ObedienceForm';
import ObedienceDashboardPage from './pages/Dashboard/ObedienceDashboardPage';
import Lodges from './pages/Management/Lodges';
import LodgeForm from './pages/Management/LodgeForm';
import LodgeQRCode from './pages/Management/LodgeQRCode';
import Members from './pages/Management/Members';
import MemberForm from './pages/Management/MemberForm';
import SuperAdminsManagement from './pages/Management/SuperAdminsManagement';
import SuperAdminForm from './pages/Management/SuperAdminForm';
import WebmastersManagement from './pages/Management/WebmastersManagement';
import WebmasterForm from './pages/Management/WebmasterForm';
import Classes from './pages/Management/Classes';
import ClassForm from './pages/Management/ClassForm';
import DecorationForm from './pages/Management/DecorationForm';
import FamilyMemberForm from './pages/Management/FamilyMemberForm';
import RoleHistoryForm from './pages/Management/RoleHistoryForm';
import AdministrativeProcessesPage from './pages/AdministrativeProcessesPage';
import LodgeClassesPage from './pages/LodgeClassesPage';
import MemberDashboardPage from './pages/MemberDashboardPage';
import MemberRegistryPage from './pages/MemberRegistryPage';
import PermissionsPage from './pages/PermissionsPage';
import RolesPage from './pages/RolesPage';
import RolesPermissionsPage from './pages/RolesPermissionsPage';
import LodgeDashboard from './pages/Dashboard/LodgeDashboard';
import LodgeDashboardLayout from './pages/Dashboard/LodgeDashboardLayout';
import WebmasterRoleAssignmentPage from './pages/WebmasterRoleAssignmentPage';
import DashboardLayout from './pages/Dashboard/DashboardLayout';
import SessionsPage from './pages/Sessions/SessionsPage';
import SessionDetailsPage from './pages/Sessions/SessionDetailsPage';
import SessionForm from './pages/Sessions/SessionForm';
import LodgeSelectionPage from './pages/LodgeSelectionPage';
import DashboardHome from './pages/Dashboard/DashboardHome';

import PublicLayout from './components/layout/PublicLayout'; // Import PublicLayout

const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      {
        element: <PublicLayout />, // Wrap public routes with PublicLayout
        children: [
          {
            path: '/',
            element: <LandingPage />,
          },
          {
            path: '/login',
            element: <LoginPage />,
          },
          {
            path: '/select-lodge',
            element: <LodgeSelectionPage />,
          },
        ]
      },
      {
        path: '/dashboard',
        children: [
          {
            path: 'lodge-dashboard',
            element: <LodgeDashboardLayout />,
            children: [
              {
                index: true,
                element: <LodgeDashboard />,
              }
            ]
          },

          {
            element: <DashboardLayout />,
            children: [
              {
                index: true,
                element: <DashboardHome />,
              },
              {
                path: 'management',
                children: [
                  { path: 'obediences', element: <Obediences /> },
                  { path: 'obediences/new', element: <ObedienceForm /> },
                  { path: 'obediences/edit/:id', element: <ObedienceForm /> },
                  { path: 'lodges', element: <Lodges /> },
                  { path: 'lodges/new', element: <LodgeForm /> },
                  { path: 'lodges/edit/:id', element: <LodgeForm /> },
                  { path: 'lodges/qr-code/:id?', element: <LodgeQRCode /> },
                  { path: 'members', element: <Members /> },
                  { path: 'members/new', element: <MemberForm /> },
                  { path: 'members/edit/:id', element: <MemberForm /> },
                  { path: 'super-admins', element: <SuperAdminsManagement /> },
                  { path: 'super-admins/new', element: <SuperAdminForm /> },
                  { path: 'super-admins/edit/:id', element: <SuperAdminForm /> },
                  { path: 'webmasters', element: <WebmastersManagement /> },
                  { path: 'webmasters/new', element: <WebmasterForm /> },
                  { path: 'webmasters/edit/:id', element: <WebmasterForm /> },
                  { path: 'classes', element: <Classes /> },
                  { path: 'classes/new', element: <ClassForm /> },
                  { path: 'classes/edit/:id', element: <ClassForm /> },
                  { path: 'decorations/new', element: <DecorationForm /> },
                  { path: 'decorations/edit/:id', element: <DecorationForm /> },
                  { path: 'family-members/new', element: <FamilyMemberForm /> },
                  { path: 'family-members/edit/:id', element: <FamilyMemberForm /> },
                  { path: 'role-history/new', element: <RoleHistoryForm /> },
                  { path: 'role-history/edit/:id', element: <RoleHistoryForm /> },
                ],
              },
              {
                path: 'sessions',
                element: <SessionsPage />,
              },
              {
                path: 'sessions/new',
                element: <SessionForm />,
              },
              {
                path: 'sessions/edit/:id',
                element: <SessionForm />,
              },
              {
                path: 'sessions/:id',
                element: <SessionDetailsPage />,
              },
              {
                path: 'administrative-processes',
                element: <AdministrativeProcessesPage />,
              },
              {
                path: 'lodge-classes',
                element: <LodgeClassesPage />,
              },
              {
                path: 'member-dashboard',
                element: <MemberDashboardPage />,
              },
              {
                path: 'member-registry',
                element: <MemberRegistryPage />,
              },
              {
                path: 'permissions',
                element: <PermissionsPage />,
              },
              {
                path: 'roles',
                element: <RolesPage />,
              },
              {
                path: 'roles-permissions',
                element: <RolesPermissionsPage />,
              },
              {
                path: 'webmaster-role-assignment',
                element: <WebmasterRoleAssignmentPage />,
              },
              {
                path: 'obedience-dashboard',
                element: <ObedienceDashboardPage />,
              },
            ],
          },
        ],
      },
    ],
  },
]);

export default router;