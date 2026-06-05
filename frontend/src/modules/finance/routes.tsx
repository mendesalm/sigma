import { RouteObject } from 'react-router-dom';
import DashboardFinanceiro from '@/modules/finance/pages/DashboardFinanceiro';
import LancamentosList from '@/modules/finance/pages/LancamentosList';
import MeuExtrato from '@/modules/finance/pages/MeuExtrato';


export const financePublicRoutes: RouteObject[] = [];

export const financeLodgeDashboardRoutes: RouteObject[] = [
  { path: 'obreiro/meu-extrato', element: <MeuExtrato /> },
  { path: 'tesoureiro/dashboard', element: <DashboardFinanceiro /> },
  { path: 'tesoureiro/lancamentos', element: <LancamentosList /> },
];

export const financeDashboardRoutes: RouteObject[] = [];
