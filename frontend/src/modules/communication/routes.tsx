import { RouteObject } from 'react-router-dom';
import Classes from '@/modules/communication/pages/Classes';
import ClassForm from '@/modules/communication/pages/ClassForm';
import MinhasPublicacoes from '@/modules/communication/pages/MinhasPublicacoes';
import MeusAnuncios from '@/modules/communication/pages/MeusAnuncios';
import Classificados from '@/modules/communication/pages/Classificados';
import SecretarioPublicacoes from '@/modules/communication/pages/Publicacoes';
import LodgeClassesPage from '@/modules/communication/pages/LodgeClassesPage';


import Inbox from '@/modules/communication/pages/Inbox';
import Sent from '@/modules/communication/pages/Sent';
import NewMessage from '@/modules/communication/pages/NewMessage';

export const communicationPublicRoutes: RouteObject[] = [];

export const communicationLodgeDashboardRoutes: RouteObject[] = [
  { path: 'obreiro/minhas-publicacoes', element: <MinhasPublicacoes /> },
  { path: 'obreiro/meus-anuncios', element: <MeusAnuncios /> },
  { path: 'obreiro/classificados', element: <Classificados /> },
  { path: 'secretario/publicacoes', element: <SecretarioPublicacoes /> },
  
  // Comunicações (Ofícios) - Secretário
  { path: 'secretario/comunicacoes/inbox', element: <Inbox /> },
  { path: 'secretario/comunicacoes/sent', element: <Sent /> },
  { path: 'secretario/comunicacoes/new', element: <NewMessage /> },

  // Comunicações (Ofícios) - Webmaster
  { path: 'webmaster/comunicacoes', element: <Inbox /> },
  { path: 'webmaster/comunicacoes/inbox', element: <Inbox /> },
  { path: 'webmaster/comunicacoes/sent', element: <Sent /> },
  { path: 'webmaster/comunicacoes/new', element: <NewMessage /> },
];

export const communicationDashboardRoutes: RouteObject[] = [
  { path: 'management/classes', element: <Classes /> },
  { path: 'management/classes/new', element: <ClassForm /> },
  { path: 'management/classes/edit/:id', element: <ClassForm /> },
  { path: 'lodge-classes', element: <LodgeClassesPage /> },
];
