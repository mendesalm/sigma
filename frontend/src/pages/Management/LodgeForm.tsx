import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Container, TextField, Typography, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import api from '../../services/api';

const LodgeForm = () => {
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [obedienceId, setObedienceId] = useState('');
  const [obediences, setObediences] = useState([]);
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    const fetchObeidences = async () => {
      try {
        const response = await api.get('/obediences');
        setObediences(response.data);
      } catch (error) {
        console.error('Failed to fetch obediences', error);
      }
    };
    fetchObeidences();

    if (id) {
      const fetchLodge = async () => {
        try {
          const response = await api.get(`/lodges/${id}`);
          setName(response.data.name);
          setNumber(response.data.number);
          setObedienceId(response.data.obedience_id);
        } catch (error) {
          console.error('Failed to fetch lodge', error);
        }
      };
      fetchLodge();
    }
  }, [id]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const lodgeData = { name, number: parseInt(number), obedience_id: obedienceId };

    try {
      if (id) {
        await api.put(`/lodges/${id}`, lodgeData);
      } else {
        await api.post('/lodges', lodgeData);
      }
      navigate('/dashboard/lodges');
    } catch (error) {
      console.error('Failed to save lodge', error);
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        {id ? 'Editar Loja' : 'Nova Loja'}
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
          label="Número"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          fullWidth
          margin="normal"
          type="number"
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>Obediência</InputLabel>
          <Select
            value={obedienceId}
            onChange={(e) => setObedienceId(e.target.value)}
          >
            {obediences.map((obedience: any) => (
              <MenuItem key={obedience.id} value={obedience.id}>
                {obedience.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button type="submit" variant="contained" color="primary">
          Salvar
        </Button>
      </form>
    </Container>
  );
};

export default LodgeForm;
