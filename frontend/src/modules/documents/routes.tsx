import { RouteObject } from 'react-router-dom';
import DocumentValidation from '@/modules/documents/pages/DocumentValidation';
import BalaustreEditor from '@/modules/documents/pages/BalaustreEditor';
import DocumentTemplates from '@/modules/documents/pages/DocumentTemplates';
import AdminTemplateEditor from '@/modules/documents/pages/AdminTemplateEditor';


export const documentsPublicRoutes: RouteObject[] = [
  { path: '/validate/:hash', element: <DocumentValidation /> },
];

export const documentsLodgeDashboardRoutes: RouteObject[] = [
  { path: 'secretario/sessoes/:sessionId/balaustre', element: <BalaustreEditor /> },
];

export const documentsDashboardRoutes: RouteObject[] = [
  { path: 'management/templates', element: <DocumentTemplates /> },
  { path: 'management/admin-templates', element: <AdminTemplateEditor /> },
];
