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
import { Visibility as VisibilityIcon, Add as AddIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '@/shared/services/api';

interface Message {
  id: number;
  subject: string;
  body: string;
  status: string;
  created_at: string;
  recipient_lodge_id?: number;
  recipient_obedience_id?: number;
}

const Sent: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await api.get('/messages/sent');
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching sent messages:', error);
    }
  };

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
          Ofícios Enviados
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => navigate(`${getBasePath()}/inbox`)}
            sx={{ borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }}
            startIcon={<ArrowBackIcon />}
          >
            Caixa de Entrada
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
              <TableCell sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Destinatário (ID)</TableCell>
              <TableCell sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Data</TableCell>
              <TableCell sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Status</TableCell>
              <TableCell align="center" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {messages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ color: 'rgba(255,255,255,0.5)', py: 3 }}>
                  Nenhum ofício enviado.
                </TableCell>
              </TableRow>
            ) : (
              messages.map((message) => (
                <TableRow key={message.id} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                  <TableCell sx={{ color: '#fff' }}>{message.subject}</TableCell>
                  <TableCell sx={{ color: '#fff' }}>
                    {message.recipient_lodge_id ? `Loja #${message.recipient_lodge_id}` : ''}
                    {message.recipient_obedience_id ? `Obediência #${message.recipient_obedience_id}` : ''}
                  </TableCell>
                  <TableCell sx={{ color: '#fff' }}>
                    {new Date(message.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={message.status === 'UNREAD' ? 'Não Lido' : 'Lido'} 
                      color={message.status === 'UNREAD' ? 'warning' : 'success'}
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

export default Sent;
