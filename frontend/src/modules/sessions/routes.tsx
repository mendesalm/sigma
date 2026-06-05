import { RouteObject } from 'react-router-dom';
import VisitorRegistrationPage from '@/modules/sessions/pages/VisitorRegistrationPage';
import SessionsPage from '@/modules/sessions/pages/SessionsPage';
import SessionForm from '@/modules/sessions/pages/SessionForm';
import SessionDetailsPage from '@/modules/sessions/pages/SessionDetailsPage';
import MinhasPresencas from '@/modules/sessions/pages/MinhasPresencas';
import MinhasVisitacoes from '@/modules/sessions/pages/MinhasVisitacoes';
import SecretarioPresencas from '@/modules/sessions/pages/Presencas';
import ChancelerPresencas from '@/modules/sessions/pages/Chanceler/Presencas';
import ChancelerVisitacoes from '@/modules/sessions/pages/Chanceler/Visitacoes';
import ChancelerVisitantes from '@/modules/sessions/pages/Chanceler/Visitantes';


export const sessionsPublicRoutes: RouteObject[] = [
  { path: '/visitante/cadastro', element: <VisitorRegistrationPage /> },
];

export const sessionsLodgeDashboardRoutes: RouteObject[] = [
  { path: 'obreiro/minhas-presencas', element: <MinhasPresencas /> },
  { path: 'obreiro/minhas-visitacoes', element: <MinhasVisitacoes /> },
  { path: 'secretario/presencas', element: <SecretarioPresencas /> },
  { path: 'secretario/sessoes', children: [
    { index: true, element: <SessionsPage /> },
    { path: 'new', element: <SessionForm /> },
    { path: 'edit/:id', element: <SessionForm /> },
    { path: ':id', element: <SessionDetailsPage /> },
  ]},
  { path: 'chanceler/presencas', element: <ChancelerPresencas /> },
  { path: 'chanceler/visitacoes', element: <ChancelerVisitacoes /> },
  { path: 'chanceler/visitantes', element: <ChancelerVisitantes /> },
  { path: 'sessions', element: <SessionsPage /> },
  { path: 'sessions/new', element: <SessionForm /> },
  { path: 'sessions/edit/:id', element: <SessionForm /> },
  { path: 'sessions/:id', element: <SessionDetailsPage /> },
];

export const sessionsDashboardRoutes: RouteObject[] = [
  { path: 'sessions', element: <SessionsPage /> },
  { path: 'sessions/new', element: <SessionForm /> },
  { path: 'sessions/edit/:id', element: <SessionForm /> },
  { path: 'sessions/:id', element: <SessionDetailsPage /> },
];
