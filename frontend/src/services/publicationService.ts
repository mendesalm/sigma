import api from './api';

export interface Publication {
    id: number;
    title: string;
    content?: string;
    file_path: string;
    file_size?: number;
    type: 'Aviso' | 'Notícia' | 'Artigo' | 'Boletim Oficial';
    status: 'Rascunho' | 'Pendente' | 'Publicado' | 'Rejeitado' | 'Arquivado';
    author_id: number;
    lodge_id: number;
    published_at: string;
    valid_until?: string;
    author_name?: string;
}

export const publicationService = {
    getAll: async (lodge_id: number) => {
        const response = await api.get<Publication[]>(`/publications/?lodge_id=${lodge_id}`);
        return response.data;
    },

    create: async (formData: FormData) => {
        const response = await api.post<Publication>('/publications/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    delete: async (id: number, lodge_id: number) => {
        await api.delete(`/publications/${id}?lodge_id=${lodge_id}`);
    }
};
