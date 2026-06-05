import { RouteObject } from 'react-router-dom';
import Members from '@/modules/members/pages/Members';
import MemberForm from '@/modules/members/pages/MemberForm';
import DecorationForm from '@/modules/members/pages/DecorationForm';
import FamilyMemberForm from '@/modules/members/pages/FamilyMemberForm';
import MeuCadastro from '@/modules/members/pages/MeuCadastro';
import QuadroObreiros from '@/modules/members/pages/Relatorios/QuadroObreiros';
import MemberDashboardPage from '@/modules/members/pages/MemberDashboardPage';
import MemberRegistryPage from '@/modules/members/pages/MemberRegistryPage';


export const membersPublicRoutes: RouteObject[] = [];

export const membersLodgeDashboardRoutes: RouteObject[] = [
  { path: 'obreiro/meu-cadastro', element: <MeuCadastro /> },
  { path: 'secretario/cadastro', children: [
    { index: true, element: <Members /> },
    { path: 'new', element: <MemberForm /> },
    { path: 'edit/:id', element: <MemberForm /> }
  ]},
  { path: 'secretario/relatorios', element: <QuadroObreiros /> },
  { path: 'chanceler/cadastro', children: [
    { index: true, element: <Members /> },
    { path: 'new', element: <MemberForm /> },
    { path: 'edit/:id', element: <MemberForm /> }
  ]},
  { path: 'management/members', element: <Members /> },
  { path: 'management/members/new', element: <MemberForm /> },
  { path: 'management/members/edit/:id', element: <MemberForm /> },
];

export const membersDashboardRoutes: RouteObject[] = [
  { path: 'management/members', element: <Members /> },
  { path: 'management/members/new', element: <MemberForm /> },
  { path: 'management/members/edit/:id', element: <MemberForm /> },
  { path: 'management/decorations/new', element: <DecorationForm /> },
  { path: 'management/decorations/edit/:id', element: <DecorationForm /> },
  { path: 'management/family-members/new', element: <FamilyMemberForm /> },
  { path: 'management/family-members/edit/:id', element: <FamilyMemberForm /> },
  { path: 'member-dashboard', element: <MemberDashboardPage /> },
  { path: 'member-registry', element: <MemberRegistryPage /> },
];
