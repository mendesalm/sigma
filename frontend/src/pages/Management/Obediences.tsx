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
  useTheme,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

interface Obedience {
  id: number;
  name: string;
  acronym: string;
  type: string;
  technical_contact_name: string;
  technical_contact_email: string;
}

const Obediences: React.FC = () => {
  const [obediences, setObediences] = useState<Obedience[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    fetchObediences();
  }, []);

  const fetchObediences = async () => {
    try {
      const response = await api.get('/obediences/');
      setObediences(response.data);
    } catch (error) {
      console.error('Erro ao buscar obediências:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta obediência?')) {
      try {
        await api.delete(`/obediences/${id}`);
        fetchObediences();
      } catch (error) {
        console.error('Erro ao excluir obediência:', error);
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" color="primary" gutterBottom>
            Obediências
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gerencie as obediências cadastradas no sistema.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/dashboard/management/obediences/new')}
          sx={{ px: 3, py: 1 }}
        >
          Nova Obediência
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
                <TableCell>Nome</TableCell>
                <TableCell>Sigla</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Contato Técnico</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {obediences.map((obedience) => (
                <TableRow key={obedience.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ 
                        p: 1, 
                        borderRadius: 1, 
                        bgcolor: 'rgba(255, 255, 255, 0.05)', 
                        mr: 2,
                        display: 'flex'
                      }}>
                        <BusinessIcon color="primary" fontSize="small" />
                      </Box>
                      <Typography variant="body1" fontWeight="medium">
                        {obedience.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{obedience.acronym || '-'}</TableCell>
                  <TableCell>
                    <Chip 
                      label={obedience.type} 
                      size="small" 
                      sx={{ 
                        bgcolor: obedience.type === 'Federal' ? 'rgba(212, 175, 55, 0.1)' : 'rgba(26, 35, 126, 0.2)',
                        color: obedience.type === 'Federal' ? theme.palette.primary.main : theme.palette.secondary.light,
                        border: `1px solid ${obedience.type === 'Federal' ? theme.palette.primary.main : theme.palette.secondary.light}`
                      }} 
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{obedience.technical_contact_name}</Typography>
                    <Typography variant="caption" color="text.secondary">{obedience.technical_contact_email}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar">
                      <IconButton 
                        onClick={() => navigate(`/dashboard/management/obediences/edit/${obedience.id}`)}
                        color="primary"
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir">
                      <IconButton 
                        onClick={() => handleDelete(obedience.id)}
                        color="error"
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {obediences.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">Nenhuma obediência encontrada.</Typography>
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

export default Obediences;