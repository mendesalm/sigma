import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Computer as WebmasterIcon,
  VpnKey as VpnKeyIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

interface Webmaster {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  lodge?: { lodge_name: string };
  obedience?: { name: string };
}

const WebmastersManagement: React.FC = () => {
  const [webmasters, setWebmasters] = useState<Webmaster[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWebmasters();
  }, []);

  const fetchWebmasters = async () => {
    try {
      const response = await api.get('/webmasters/');
      setWebmasters(response.data);
    } catch (error) {
      console.error('Falha ao buscar webmasters', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (id: number) => {
    if (window.confirm('Tem certeza que deseja resetar a senha deste webmaster? Uma nova senha será enviada para o email cadastrado.')) {
      try {
        await api.post(`/webmasters/${id}/reset-password`);
        alert('Senha resetada com sucesso! A nova senha foi enviada para o email do usuário.');
      } catch (error) {
        console.error('Falha ao resetar a senha do webmaster', error);
        alert('Falha ao resetar a senha do webmaster.');
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este webmaster?')) {
      try {
        await api.delete(`/webmasters/${id}`);
        fetchWebmasters();
      } catch (error) {
        console.error('Erro ao excluir webmaster:', error);
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" color="primary" gutterBottom>
            Webmasters
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gerencie os webmasters responsáveis por Lojas e Obediências.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/dashboard/management/webmasters/new')}
          sx={{ px: 3, py: 1 }}
        >
          Novo Webmaster
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table>
            <TableHead sx={{ bgcolor: 'rgba(212, 175, 55, 0.05)' }}>
              <TableRow>
                <TableCell>Usuário</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Associação</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {webmasters.map((webmaster) => (
                <TableRow key={webmaster.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ 
                        p: 1, 
                        borderRadius: 1, 
                        bgcolor: 'rgba(255, 255, 255, 0.05)', 
                        mr: 2,
                        display: 'flex'
                      }}>
                        <WebmasterIcon color="info" fontSize="small" />
                      </Box>
                      <Typography variant="body1" fontWeight="medium">
                        {webmaster.username}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{webmaster.email}</TableCell>
                  <TableCell>
                    <Chip 
                      label={webmaster.is_active ? 'Ativo' : 'Inativo'} 
                      color={webmaster.is_active ? 'success' : 'default'}
                      size="small" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {webmaster.lodge ? (
                      <Chip label={`Loja: ${webmaster.lodge.lodge_name}`} size="small" sx={{ bgcolor: 'rgba(144, 202, 249, 0.1)' }} />
                    ) : webmaster.obedience ? (
                      <Chip label={`Obediência: ${webmaster.obedience.name}`} size="small" sx={{ bgcolor: 'rgba(212, 175, 55, 0.1)' }} />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Resetar Senha">
                      <IconButton onClick={() => handleResetPassword(webmaster.id)} color="warning" size="small">
                        <VpnKeyIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton onClick={() => navigate(`/dashboard/management/webmasters/edit/${webmaster.id}`)} color="primary" size="small">
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir">
                      <IconButton onClick={() => handleDelete(webmaster.id)} color="error" size="small">
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {webmasters.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">Nenhum webmaster encontrado.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>
    </Box>
  );
};

export default WebmastersManagement;
