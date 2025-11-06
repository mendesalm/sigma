import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import Obediences from './pages/Management/Obediences';
import ObedienceForm from './pages/Management/ObedienceForm';
import ObedienceDashboardPage from './pages/Dashboard/ObedienceDashboardPage';
import ObedienceDashboardLayout from './pages/Dashboard/ObedienceDashboardLayout';
const router = createBrowserRouter([
  {
    element: <App />,
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
        path: '/dashboard',
        element: <DashboardPage />,
        children: [
          {
            path: 'obediences',
            element: <Obediences />,
          },
          {
            path: 'obediences/new',
            element: <ObedienceForm />,
          },
          {
            path: 'obedience-dashboard',
            element: <ObedienceDashboardPage />,
          },
          {
            path: 'obedience-layout',
            element: <ObedienceDashboardLayout />,
          },
        ],
      },
    ],
  },
]);

export default router;
