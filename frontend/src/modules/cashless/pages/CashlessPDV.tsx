import { useEffect, useState } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, Button, Divider, 
  List, ListItem, ListItemText, TextField, Paper, CircularProgress 
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { AuthContext } from '@/modules/access_control/context/AuthContext';
import { cashlessService, Product } from '../services/cashlessService';

export default function CashlessPDV() {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = React.useContext(AuthContext) || {};
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Cart state
  const [cart, setCart] = useState<{product: Product, quantity: number}[]>([]);
  
  // Buyer state
  const [userId, setUserId] = useState('');
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await cashlessService.getProducts();
      setProducts(data);
    } catch (error: any) {
      enqueueSnackbar('Erro ao carregar produtos', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const checkBalance = async () => {
    if (!userId) {
      enqueueSnackbar('Digite o ID do Usuário (Simulação de Pulseira NFC)', { variant: 'warning' });
      return;
    }
    try {
      const data = await cashlessService.getBalance(userId);
      setBalance(data.current_balance);
      enqueueSnackbar(`Saldo de ${data.user.name}: R$ ${data.current_balance}`, { variant: 'info' });
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.detail || 'Erro ao consultar saldo', { variant: 'error' });
    }
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const totalCart = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (!userId) {
      enqueueSnackbar('Identifique o usuário antes de cobrar!', { variant: 'error' });
      return;
    }
    if (cart.length === 0) {
      enqueueSnackbar('Carrinho vazio', { variant: 'warning' });
      return;
    }

    try {
      const payload = {
        usuario_id: userId,
        canal: 'PDV Balcão' as const,
        itens: cart.map(item => ({
          produto_id: item.product.id,
          quantidade: item.quantity
        }))
      };

      await cashlessService.createOrder(payload);
      
      enqueueSnackbar('Venda processada com sucesso!', { variant: 'success' });
      setCart([]);
      checkBalance(); // Refresh balance
      loadProducts(); // Refresh stock
      
    } catch (error: any) {
      // Show exact backend error (e.g. Saldo Insuficiente, Estoque Zerado)
      const errorMsg = error.response?.data?.detail || 'Erro ao processar venda';
      enqueueSnackbar(errorMsg, { variant: 'error' });
    }
  };

  return (
    <Box sx={{ p: 4, bgcolor: '#f5f5f5', minHeight: '100vh', borderRadius: 2 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        PDV Bar Cashless
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Operador de Caixa atual: {user?.name || 'Desconhecido'}
      </Typography>

      <Grid container spacing={3}>
        {/* Painel Esquerdo: Produtos */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper sx={{ p: 3, minHeight: '600px' }}>
            <Typography variant="h6" gutterBottom>Catálogo de Produtos</Typography>
            <Divider sx={{ mb: 2 }} />
            
            {loading ? <CircularProgress /> : (
              <Grid container spacing={2}>
                {products.map(p => (
                  <Grid size={{ xs: 12, sm: 6 }} key={p.id}>
                    <Card variant="outlined" sx={{ 
                      borderColor: p.stock <= p.min_stock ? 'error.main' : 'divider',
                      bgcolor: p.stock === 0 ? '#ffeeee' : 'white'
                    }}>
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight="bold">{p.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Estoque: {p.stock} un
                        </Typography>
                        <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                          R$ {Number(p.price).toFixed(2)}
                        </Typography>
                        <Button 
                          variant="contained" 
                          fullWidth 
                          sx={{ mt: 2 }}
                          onClick={() => addToCart(p)}
                          disabled={p.stock === 0}
                        >
                          Adicionar
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Grid>

        {/* Painel Direito: Carrinho e Cliente */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Identificação (Pulseira NFC)</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField 
                size="small" 
                fullWidth 
                placeholder="ID do Usuário" 
                value={userId}
                onChange={e => setUserId(e.target.value)}
              />
              <Button variant="outlined" onClick={checkBalance}>
                Consultar
              </Button>
            </Box>
            {balance !== null && (
              <Typography variant="h5" color="success.main" sx={{ mt: 2, fontWeight: 'bold' }}>
                Saldo Disponível: R$ {Number(balance).toFixed(2)}
              </Typography>
            )}
          </Paper>

          <Paper sx={{ p: 3, minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>Carrinho Atual</Typography>
            <Divider sx={{ mb: 2 }} />
            
            <List sx={{ flexGrow: 1, overflow: 'auto' }}>
              {cart.map(item => (
                <ListItem key={item.product.id} secondaryAction={
                  <Button color="error" size="small" onClick={() => removeFromCart(item.product.id)}>
                    Remover
                  </Button>
                }>
                  <ListItemText 
                    primary={`${item.quantity}x ${item.product.name}`} 
                    secondary={`R$ ${(item.product.price * item.quantity).toFixed(2)}`} 
                  />
                </ListItem>
              ))}
              {cart.length === 0 && (
                <Typography color="text.secondary" align="center" sx={{ mt: 5 }}>
                  Nenhum item selecionado.
                </Typography>
              )}
            </List>

            <Box sx={{ mt: 'auto', pt: 2 }}>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h5" fontWeight="bold">Total:</Typography>
                <Typography variant="h5" fontWeight="bold" color="primary">
                  R$ {totalCart.toFixed(2)}
                </Typography>
              </Box>
              <Button 
                variant="contained" 
                color="success" 
                size="large" 
                fullWidth
                onClick={handleCheckout}
                disabled={cart.length === 0}
                sx={{ py: 2, fontSize: '1.2rem', fontWeight: 'bold' }}
              >
                FINALIZAR COMPRA
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
