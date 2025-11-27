import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Container, TextField, Typography, Switch, FormControlLabel, Snackbar, Alert, Paper, Box, Grid } from '@mui/material';
import api from '../../services/api';
import { validateEmail } from '../../utils/validators';

const SuperAdminForm: React.FC = () => {
  const [formState, setFormState] = useState({
    username: '',
    email: '',
    password: '',
    is_active: true,
  });
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (id) {
      const fetchSuperAdmin = async () => {
        try {
          const response = await api.get(`/super-admins/${id}`);
          setFormState({ ...response.data, password: '' });
        } catch (error) {
          console.error('Falha ao buscar super admin', error);
        }
      };
      fetchSuperAdmin();
    }
  }, [id]);

  const validateField = (name: string, value: string) => {
    let error = '';
    if (name === 'email' && value && !validateEmail(value)) {
      error = 'Email inválido';
    }
    setErrors((prev) => ({ ...prev, [name]: error }));
    return error === '';
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = event.target;
    
    if (name === 'email') {
      validateField(name, value);
    }

    setFormState((prevState) => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (formState.email && !validateEmail(formState.email)) {
      setErrors({ email: 'Email inválido' });
      setSnackbar({ open: true, message: 'Por favor, corrija os erros no formulário.', severity: 'error' });
      return;
    }

    try {
      if (id) {
        await api.put(`/super-admins/${id}`, formState);
        setSnackbar({ open: true, message: 'Super Admin atualizado com sucesso!', severity: 'success' });
      } else {
        await api.post('/super-admins', formState);
        setSnackbar({ open: true, message: 'Super Admin criado com sucesso!', severity: 'success' });
      }
      setTimeout(() => navigate('/dashboard/management/super-admins'), 1500);
    } catch (error) {
      console.error('Falha ao salvar super admin', error);
      setSnackbar({ open: true, message: 'Falha ao salvar super admin.', severity: 'error' });
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
          {id ? 'Editar Super Admin' : 'Novo Super Admin'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Preencha os dados abaixo para cadastrar um novo Super Administrador.
        </Typography>
      </Box>

      <Paper sx={{ p: 4 }}>
        <form onSubmit={handleSubmit}>
          {renderSectionTitle('Dados da Conta')}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                name="username"
                label="Usuário"
                value={formState.username}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="email"
                label="Email"
                type="email"
                value={formState.email}
                onChange={handleChange}
                fullWidth
                required
                error={!!errors.email}
                helperText={errors.email}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="password"
                label="Senha"
                type="password"
                value={formState.password}
                onChange={handleChange}
                fullWidth
                helperText={id ? 'Deixe em branco para manter a mesma senha' : ''}
              />
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={<Switch name="is_active" checked={formState.is_active} onChange={handleChange} />} 
                label="Ativo"
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button onClick={() => navigate('/dashboard/management/super-admins')} variant="outlined">
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

export default SuperAdminForm;