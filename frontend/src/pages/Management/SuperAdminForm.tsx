import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Container, TextField, Typography, Switch, FormControlLabel } from '@mui/material';
import api from '../../services/api';

const SuperAdminForm: React.FC = () => {
  const [formState, setFormState] = useState({
    username: '',
    email: '',
    password: '',
    is_active: true,
  });
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

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

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = event.target;
    setFormState((prevState) => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (id) {
        await api.put(`/super-admins/${id}`, formState);
      } else {
        await api.post('/super-admins', formState);
      }
      navigate('/dashboard/management/super-admins');
    } catch (error) {
      console.error('Falha ao salvar super admin', error);
      alert('Falha ao salvar super admin.');
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        {id ? 'Editar Super Admin' : 'Novo Super Admin'}
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          name="username"
          label="Usuário"
          value={formState.username}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          name="email"
          label="Email"
          type="email"
          value={formState.email}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          name="password"
          label="Senha"
          type="password"
          value={formState.password}
          onChange={handleChange}
          fullWidth
          margin="normal"
          helperText={id ? 'Deixe em branco para manter a mesma senha' : ''}
        />
        <FormControlLabel
          control={<Switch name="is_active" checked={formState.is_active} onChange={handleChange} />} 
          label="Ativo"
        />
        <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
          Salvar
        </Button>
      </form>
    </Container>
  );
};

export default SuperAdminForm;