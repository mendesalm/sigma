import { RouteObject } from 'react-router-dom';
import Classes from '@/modules/communication/pages/Classes';
import ClassForm from '@/modules/communication/pages/ClassForm';
import MinhasPublicacoes from '@/modules/communication/pages/MinhasPublicacoes';
import MeusAnuncios from '@/modules/communication/pages/MeusAnuncios';
import Classificados from '@/modules/communication/pages/Classificados';
import SecretarioPublicacoes from '@/modules/communication/pages/Publicacoes';
import LodgeClassesPage from '@/modules/communication/pages/LodgeClassesPage';


export const communicationPublicRoutes: RouteObject[] = [];

export const communicationLodgeDashboardRoutes: RouteObject[] = [
  { path: 'obreiro/minhas-publicacoes', element: <MinhasPublicacoes /> },
  { path: 'obreiro/meus-anuncios', element: <MeusAnuncios /> },
  { path: 'obreiro/classificados', element: <Classificados /> },
  { path: 'secretario/publicacoes', element: <SecretarioPublicacoes /> },
];

export const communicationDashboardRoutes: RouteObject[] = [
  { path: 'management/classes', element: <Classes /> },
  { path: 'management/classes/new', element: <ClassForm /> },
  { path: 'management/classes/edit/:id', element: <ClassForm /> },
  { path: 'lodge-classes', element: <LodgeClassesPage /> },
];
