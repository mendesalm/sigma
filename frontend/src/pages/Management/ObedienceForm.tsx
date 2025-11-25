import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Container, TextField, Typography, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import api from '../../services/api';

const ObedienceForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    acronym: '',
    type: '',
    parent_obedience_id: '',
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
        console.error('Failed to fetch obediences', error);
      }
    };
    fetchObeidences();

    if (id) {
      const fetchObedience = async () => {
        try {
          const response = await api.get(`/obediences/${id}`);
          setFormData(response.data);
        } catch (error) {
          console.error('Failed to fetch obedience', error);
        }
      };
      fetchObedience();
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
    const { parent_obedience_id, ...rest } = formData;
    const obedienceData = {
      ...rest,
      parent_obedience_id: parent_obedience_id || null,
    };

    try {
      if (id) {
        await api.put(`/obediences/${id}`, obedienceData);
      } else {
        await api.post('/obediences', obedienceData);
      }
      navigate('/dashboard/management/obediences');
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
        <TextField name="name" label="Nome" value={formData.name} onChange={handleChange} fullWidth margin="normal" />
        <TextField name="acronym" label="Sigla" value={formData.acronym} onChange={handleChange} fullWidth margin="normal" />
        <FormControl fullWidth margin="normal">
          <InputLabel>Tipo</InputLabel>
          <Select name="type" value={formData.type} onChange={handleChange}>
            <MenuItem value="">
              <em>Nenhum</em>
            </MenuItem>
            <MenuItem value="Federal">Federal</MenuItem>
            <MenuItem value="Estadual">Estadual</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth margin="normal">
          <InputLabel>Obediência Mãe</InputLabel>
          <Select name="parent_obedience_id" value={formData.parent_obedience_id} onChange={handleChange}>
            <MenuItem value="">
              <em>Nenhuma</em>
            </MenuItem>
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

export default ObedienceForm;