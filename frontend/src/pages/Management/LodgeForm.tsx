import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Container, TextField, Typography, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import api from '../../services/api';

const LodgeForm = () => {
  const [formData, setFormData] = useState({
    lodge_name: '',
    lodge_number: '',
    foundation_date: '',
    rite: '',
    obedience_id: '',
    cnpj: '',
    email: '',
    phone: '',
    website: '',
    street_address: '',
    street_number: '',
    address_complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zip_code: '',
    technical_contact_name: '',
    technical_contact_email: '',
    session_day: '',
    periodicity: '',
    session_time: '',
  });
  const [obediences, setObediences] = useState([]);
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    const fetchObeidences = async () => {
      try {
        const response = await api.get('/obediences');
        setObediences(response.data);
      } catch (error) {
        console.error('Falha ao buscar obediências', error);
      }
    };
    fetchObeidences();

    if (id) {
      const fetchLodge = async () => {
        try {
          const response = await api.get(`/lodges/${id}`);
          setFormData(response.data);
        } catch (error) {
          console.error('Falha ao buscar loja', error);
        }
      };
      fetchLodge();
    }
  }, [id]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name as string]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (id) {
        await api.put(`/lodges/${id}`, formData);
      } else {
        await api.post('/lodges', formData);
      }
      navigate('/dashboard/management/lodges');
    } catch (error) {
      console.error('Falha ao salvar loja', error);
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        {id ? 'Editar Loja' : 'Nova Loja'}
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField name="lodge_name" label="Nome da Loja" value={formData.lodge_name} onChange={handleChange} fullWidth margin="normal" />
        <TextField name="lodge_number" label="Número da Loja" value={formData.lodge_number} onChange={handleChange} fullWidth margin="normal" />
        <TextField name="foundation_date" label="Data de Fundação" type="date" value={formData.foundation_date} onChange={handleChange} fullWidth margin="normal" InputLabelProps={{ shrink: true }} />
        <FormControl fullWidth margin="normal">
          <InputLabel>Rito</InputLabel>
          <Select name="rite" value={formData.rite} onChange={handleChange}>
            <MenuItem value="REAA">REAA</MenuItem>
            <MenuItem value="YORK">YORK</MenuItem>
            <MenuItem value="SCHRODER">Schroder</MenuItem>
            <MenuItem value="BRASILEIRO">Brasileiro</MenuItem>
            <MenuItem value="MODERNO">Moderno</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth margin="normal">
          <InputLabel>Obediência</InputLabel>
          <Select name="obedience_id" value={formData.obedience_id} onChange={handleChange}>
            {obediences.map((obedience: any) => (
              <MenuItem key={obedience.id} value={obedience.id}>
                {obedience.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField name="cnpj" label="CNPJ" value={formData.cnpj} onChange={handleChange} fullWidth margin="normal" />
        <TextField name="email" label="Email" value={formData.email} onChange={handleChange} fullWidth margin="normal" />
        <TextField name="phone" label="Telefone" value={formData.phone} onChange={handleChange} fullWidth margin="normal" />
        <TextField name="website" label="Website" value={formData.website} onChange={handleChange} fullWidth margin="normal" />
        <TextField name="street_address" label="Endereço" value={formData.street_address} onChange={handleChange} fullWidth margin="normal" />
        <TextField name="street_number" label="Número" value={formData.street_number} onChange={handleChange} fullWidth margin="normal" />
        <TextField name="address_complement" label="Complemento" value={formData.address_complement} onChange={handleChange} fullWidth margin="normal" />
        <TextField name="neighborhood" label="Bairro" value={formData.neighborhood} onChange={handleChange} fullWidth margin="normal" />
        <TextField name="city" label="Cidade" value={formData.city} onChange={handleChange} fullWidth margin="normal" />
        <TextField name="state" label="Estado" value={formData.state} onChange={handleChange} fullWidth margin="normal" />
        <TextField name="zip_code" label="CEP" value={formData.zip_code} onChange={handleChange} fullWidth margin="normal" />
        <FormControl fullWidth margin="normal">
          <InputLabel>Dia da Sessão</InputLabel>
          <Select name="session_day" value={formData.session_day} onChange={handleChange}>
            <MenuItem value="Domingo">Domingo</MenuItem>
            <MenuItem value="Segunda-feira">Segunda-feira</MenuItem>
            <MenuItem value="Terça-feira">Terça-feira</MenuItem>
            <MenuItem value="Quarta-feira">Quarta-feira</MenuItem>
            <MenuItem value="Quinta-feira">Quinta-feira</MenuItem>
            <MenuItem value="Sexta-feira">Sexta-feira</MenuItem>
            <MenuItem value="Sábado">Sábado</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth margin="normal">
          <InputLabel>Periodicidade</InputLabel>
          <Select name="periodicity" value={formData.periodicity} onChange={handleChange}>
            <MenuItem value="Semanal">Semanal</MenuItem>
            <MenuItem value="Quinzenal">Quinzenal</MenuItem>
            <MenuItem value="Mensal">Mensal</MenuItem>
          </Select>
        </FormControl>
        <TextField name="session_time" label="Horário da Sessão" type="time" value={formData.session_time} onChange={handleChange} fullWidth margin="normal" InputLabelProps={{ shrink: true }} />
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          Contato Técnico
        </Typography>
        <TextField name="technical_contact_name" label="Nome do Contato Técnico" value={formData.technical_contact_name} onChange={handleChange} fullWidth margin="normal" />
        <TextField name="technical_contact_email" label="Email do Contato Técnico" value={formData.technical_contact_email} onChange={handleChange} fullWidth margin="normal" />

        <Button type="submit" variant="contained" color="primary">
          Salvar
        </Button>
      </form>
    </Container>
  );
};

export default LodgeForm;
