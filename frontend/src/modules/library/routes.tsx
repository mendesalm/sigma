import { RouteObject } from 'react-router-dom';
import MeusEmprestimos from '@/modules/library/pages/MeusEmprestimos';
import MemberLibrary from '@/modules/library/pages/MemberLibrary';
import LibraryManage from '@/modules/library/pages/LibraryManage';
import LibraryLoans from '@/modules/library/pages/LibraryLoans';


export const libraryPublicRoutes: RouteObject[] = [];

export const libraryLodgeDashboardRoutes: RouteObject[] = [
  { path: 'obreiro/meus-emprestimos', element: <MeusEmprestimos /> },
  { path: 'obreiro/biblioteca', element: <MemberLibrary /> },
  { path: 'bibliotecario/acervo', element: <LibraryManage /> },
  { path: 'bibliotecario/emprestimos', element: <LibraryLoans /> },
];

export const libraryDashboardRoutes: RouteObject[] = [];
