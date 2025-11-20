import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Container, TextField, Typography } from '@mui/material';
import api from '../../services/api';

const ObedienceForm = () => {
  const [name, setName] = useState('');
  const [grandOrient, setGrandOrient] = useState('');
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    if (id) {
      const fetchObedience = async () => {
        try {
          const response = await api.get(`/obediences/${id}`);
          setName(response.data.name);
          setGrandOrient(response.data.grand_orient);
        } catch (error) {
          console.error('Failed to fetch obedience', error);
        }
      };
      fetchObedience();
    }
  }, [id]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const obedienceData = { name, grand_orient: grandOrient };

    try {
      if (id) {
        await api.put(`/obediences/${id}`, obedienceData);
      } else {
        await api.post('/obediences', obedienceData);
      }
      navigate('/dashboard/obediences');
    } catch (error) {
      console.error('Failed to save obedience', error);
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        {id ? 'Editar Obediência' : 'Nova Obediência'}
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          label="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Grande Oriente"
          value={grandOrient}
          onChange={(e) => setGrandOrient(e.target.value)}
          fullWidth
          margin="normal"
        />
        <Button type="submit" variant="contained" color="primary">
          Salvar
        </Button>
      </form>
    </Container>
  );
};

export default ObedienceForm;