import api from '../../../shared/services/api';

export interface ImportTemplate {
  id?: number;
  name: string;
  potency?: string;
  file_type: string;
  cim_regex?: string;
  name_regex?: string;
  email_regex?: string;
  degree_regex?: string;
  is_active?: boolean;
}

const ImportTemplateService = {
  getTemplates: async () => {
    const response = await api.get('/import-templates/');
    return response.data;
  },

  getTemplateById: async (id: number) => {
    const response = await api.get(`/import-templates/${id}`);
    return response.data;
  },

  createTemplate: async (data: any) => {
    const response = await api.post('/import-templates/', data);
    return response.data;
  },

  updateTemplate: async (id: number, data: any) => {
    const response = await api.put(`/import-templates/${id}`, data);
    return response.data;
  },

  deleteTemplate: async (id: number) => {
    const response = await api.delete(`/import-templates/${id}`);
    return response.data;
  },
};

export default ImportTemplateService;
