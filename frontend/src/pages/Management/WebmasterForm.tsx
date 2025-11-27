import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Alert,
  Snackbar,
  Container
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { validateEmail } from '../../utils/validators';

interface Obedience {
  id: number;
  name: string;
}

interface Lodge {
  id: number;
  lodge_name: string;
}

const WebmasterForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    type: 'obedience', // 'obedience' or 'lodge'
    obedience_id: '',
    lodge_id: '',
    is_active: true
  });

  const [obediences, setObediences] = useState<Obedience[]>([]);
  const [lodges, setLodges] = useState<Lodge[]>([]);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const fetchObediences = async () => {
    try {
      const response = await api.get('/obediences');
      setObediences(response.data);
    } catch (error) {
      console.error('Failed to fetch obediences', error);
    }
  };

  const fetchLodges = async () => {
    try {
      const response = await api.get('/lodges');
      setLodges(response.data);
    } catch (error) {
      console.error('Failed to fetch lodges', error);
    }
  };

  const fetchWebmaster = React.useCallback(async () => {
    try {
      const response = await api.get(`/webmasters/${id}`);
      const data = response.data;
      setFormData({
        username: data.username,
        email: data.email,
        password: '', // Password not retrieved
        type: data.lodge_id ? 'lodge' : 'obedience',
        obedience_id: data.obedience_id || '',
        lodge_id: data.lodge_id || '',
        is_active: data.is_active
      });
    } catch (error) {
      console.error('Erro ao buscar webmaster:', error);
      setError('Erro ao carregar dados do webmaster.');
    }
  }, [id]);

  useEffect(() => {
    fetchObediences();
    fetchLodges();
    if (isEditMode) {
      fetchWebmaster();
    }
  }, [id, isEditMode, fetchWebmaster]);

  const validateField = (name: string, value: string) => {
    let error = '';
    if (name === 'email' && value && !validateEmail(value)) {
      error = 'Email inválido';
    }
    setErrors((prev) => ({ ...prev, [name]: error }));
    return error === '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'email') {
      validateField(name, value);
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.email && !validateEmail(formData.email)) {
      setErrors({ email: 'Email inválido' });
      setSnackbar({ open: true, message: 'Por favor, corrija os erros no formulário.', severity: 'error' });
      return;
    }

    const payload: any = {
      username: formData.username,
      email: formData.email,
      is_active: formData.is_active,
    };

    if (!isEditMode) {
      payload.password = formData.password;
    } else if (formData.password) {
      payload.password = formData.password;
    }

    if (formData.type === 'obedience') {
      payload.obedience_id = formData.obedience_id ? parseInt(formData.obedience_id) : null;
      payload.lodge_id = null;
    } else {
      payload.lodge_id = formData.lodge_id ? parseInt(formData.lodge_id) : null;
      payload.obedience_id = null;
    }

    try {
      if (isEditMode) {
        await api.put(`/webmasters/${id}`, payload);
        setSnackbar({ open: true, message: 'Webmaster atualizado com sucesso!', severity: 'success' });
      } else {
        await api.post('/webmasters/', payload);
        setSnackbar({ open: true, message: 'Webmaster criado com sucesso!', severity: 'success' });
      }
      setTimeout(() => navigate('/dashboard/management/webmasters'), 1500);
    } catch (err: any) {
      console.error('Erro ao salvar webmaster:', err);
      setError(err.response?.data?.detail || 'Erro ao salvar webmaster.');
      setSnackbar({ open: true, message: 'Erro ao salvar webmaster.', severity: 'error' });
    }
  };

  const renderSectionTitle = (title: string) => (
    <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2, color: 'primary.main' }}>
      {title}
    </Typography>
  );

  return (
    <Container maxWidth="md">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom color="primary">
          {isEditMode ? 'Editar Webmaster' : 'Novo Webmaster'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Preencha os dados abaixo para cadastrar um novo administrador de sistema (Webmaster).
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Paper sx={{ p: 4 }}>
        <form onSubmit={handleSubmit}>
          
          {renderSectionTitle('Dados de Acesso')}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nome de Usuário"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                error={!!errors.email}
                helperText={errors.email}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={isEditMode ? "Nova Senha (deixe em branco para manter)" : "Senha"}
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required={!isEditMode}
              />
            </Grid>
          </Grid>

          {renderSectionTitle('Associação')}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Associação</InputLabel>
                <Select
                  name="type"
                  value={formData.type}
                  label="Tipo de Associação"
                  onChange={handleSelectChange}
                >
                  <MenuItem value="obedience">Obediência</MenuItem>
                  <MenuItem value="lodge">Loja</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {formData.type === 'obedience' ? (
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Obediência</InputLabel>
                  <Select
                    name="obedience_id"
                    value={formData.obedience_id}
                    label="Obediência"
                    onChange={handleSelectChange}
                  >
                    {obediences.map((obedience) => (
                      <MenuItem key={obedience.id} value={obedience.id}>
                        {obedience.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            ) : (
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Loja</InputLabel>
                  <Select
                    name="lodge_id"
                    value={formData.lodge_id}
                    label="Loja"
                    onChange={handleSelectChange}
                  >
                    {lodges.map((lodge) => (
                      <MenuItem key={lodge.id} value={lodge.id}>
                        {lodge.lodge_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>

          <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button onClick={() => navigate('/dashboard/management/webmasters')} variant="outlined">
              Cancelar
            </Button>
            <Button type="submit" variant="contained" color="primary">
              Salvar
            </Button>
          </Box>
        </form>
      </Paper>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default WebmasterForm;
