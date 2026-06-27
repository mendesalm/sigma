import api from '@/shared/services/api';

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  min_stock: number;
  is_active: boolean;
}

export interface OrderItemCreate {
  produto_id: string;
  quantidade: number;
}

export interface OrderCreate {
  usuario_id: string;
  canal: 'App Autoatendimento' | 'PDV Balcão';
  itens: OrderItemCreate[];
}

export interface BalanceResponse {
  user: {
    id: string;
    name: string;
    identification_key: string;
  };
  current_balance: number;
}

export const cashlessService = {
  getProducts: async (): Promise<Product[]> => {
    const response = await api.get('/cashless/produtos?active_only=true');
    return response.data;
  },
  
  createOrder: async (data: OrderCreate) => {
    const response = await api.post('/cashless/pedidos', data);
    return response.data;
  },

  getBalance: async (userId: string): Promise<BalanceResponse> => {
    const response = await api.get(`/cashless/usuarios/${userId}/saldo`);
    return response.data;
  },

  addManualBalance: async (data: { usuario_id: string, operador_id: string, tipo: string, valor: number, pin_seguranca?: string }) => {
    const response = await api.post('/cashless/transacoes/manual', data);
    return response.data;
  }
};
