import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton
} from '@mui/material';
import { Visibility as VisibilityIcon, Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '@/shared/services/api';

interface Message {
  id: number;
  subject: string;
  body: string;
  status: string;
  created_at: string;
  sender_lodge_id?: number;
  sender_obedience_id?: number;
}

const Inbox: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const navigate = useNavigate();

  const fetchMessages = async () => {
    try {
      const response = await api.get('/messages/inbox');
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  useEffect(() => {
    const load = async () => {
      await fetchMessages();
    };
    void load();
  }, []);

  // Determinar a base do path dependendo de onde o usuário está navegando
  // Se for webmaster -> /dashboard/lodge-dashboard/webmaster/comunicacoes/new
  // Se for secretario -> /dashboard/lodge-dashboard/secretario/comunicacoes/new
  const getBasePath = () => {
    if (window.location.pathname.includes('/webmaster')) {
      return '/dashboard/lodge-dashboard/webmaster/comunicacoes';
    }
    return '/dashboard/lodge-dashboard/secretario/comunicacoes';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#fff' }}>
          Caixa de Entrada (Ofícios)
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => navigate(`${getBasePath()}/sent`)}
            sx={{ borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }}
          >
            Enviados
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate(`${getBasePath()}/new`)}
          >
            Novo Ofício
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ bgcolor: '#121826', backgroundImage: 'none', border: '1px solid rgba(255,255,255,0.05)' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Assunto</TableCell>
              <TableCell sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Remetente (ID)</TableCell>
              <TableCell sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Data</TableCell>
              <TableCell sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Status</TableCell>
              <TableCell align="center" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {messages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ color: 'rgba(255,255,255,0.5)', py: 3 }}>
                  Nenhum ofício recebido.
                </TableCell>
              </TableRow>
            ) : (
              messages.map((message) => (
                <TableRow key={message.id} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                  <TableCell sx={{ color: '#fff' }}>{message.subject}</TableCell>
                  <TableCell sx={{ color: '#fff' }}>
                    {message.sender_lodge_id ? `Loja #${message.sender_lodge_id}` : ''}
                    {message.sender_obedience_id ? `Obediência #${message.sender_obedience_id}` : ''}
                  </TableCell>
                  <TableCell sx={{ color: '#fff' }}>
                    {new Date(message.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={message.status === 'UNREAD' ? 'Não Lido' : 'Lido'} 
                      color={message.status === 'UNREAD' ? 'warning' : 'default'}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton 
                      color="primary" 
                      onClick={() => alert('Visualização do ofício e anexos em breve.')}
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Inbox;
