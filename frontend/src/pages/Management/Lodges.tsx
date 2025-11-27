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
  Gavel as GavelIcon,
  QrCode as QrCodeIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

interface Lodge {
  id: number;
  lodge_name: string;
  lodge_number: string;
  city: string;
  state: string;
  technical_contact_name: string;
}

const Lodges: React.FC = () => {
  const [lodges, setLodges] = useState<Lodge[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLodges();
  }, []);

  const fetchLodges = async () => {
    try {
      const response = await api.get('/lodges/');
      setLodges(response.data);
    } catch (error) {
      console.error('Erro ao buscar lojas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta loja?')) {
      try {
        await api.delete(`/lodges/${id}`);
        fetchLodges();
      } catch (error) {
        console.error('Erro ao excluir loja:', error);
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" color="primary" gutterBottom>
            Lojas
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gerencie as lojas maçônicas cadastradas no sistema.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/dashboard/management/lodges/new')}
          sx={{ px: 3, py: 1 }}
        >
          Nova Loja
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
                <TableCell>Nome da Loja</TableCell>
                <TableCell>Número</TableCell>
                <TableCell>Localização</TableCell>
                <TableCell>Contato Técnico</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lodges.map((lodge) => (
                <TableRow key={lodge.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ 
                        p: 1, 
                        borderRadius: 1, 
                        bgcolor: 'rgba(255, 255, 255, 0.05)', 
                        mr: 2,
                        display: 'flex'
                      }}>
                        <GavelIcon color="secondary" fontSize="small" />
                      </Box>
                      <Typography variant="body1" fontWeight="medium">
                        {lodge.lodge_name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={`Nº ${lodge.lodge_number}`} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    {lodge.city && lodge.state ? `${lodge.city} - ${lodge.state}` : '-'}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{lodge.technical_contact_name}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar">
                      <IconButton 
                        onClick={() => navigate(`/dashboard/management/lodges/edit/${lodge.id}`)}
                        color="primary"
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="QR Code">
                      <IconButton 
                        onClick={() => navigate(`/dashboard/management/lodges/qr-code/${lodge.id}`)}
                        color="info"
                        size="small"
                      >
                        <QrCodeIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir">
                      <IconButton 
                        onClick={() => handleDelete(lodge.id)}
                        color="error"
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {lodges.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">Nenhuma loja encontrada.</Typography>
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

export default Lodges;
