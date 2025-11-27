import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Container, TextField, Typography, Select, MenuItem, FormControl, InputLabel, Grid, Paper, Box, CircularProgress, SelectChangeEvent } from '@mui/material';
import api from '../../services/api';
import axios from 'axios';
import { formatCNPJ, formatPhone, formatCEP, formatState } from '../../utils/formatters';
import { validateCNPJ, validateEmail } from '../../utils/validators';
import { Snackbar, Alert } from '@mui/material';

// ...

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
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [obediences, setObediences] = useState([]);
  const [loadingCep, setLoadingCep] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
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

  const validateField = (name: string, value: string) => {
    let error = '';
    if (name === 'cnpj' && value && !validateCNPJ(value)) {
      error = 'CNPJ inválido';
    }
    if (name === 'email' && value && !validateEmail(value)) {
      error = 'Email inválido';
    }
    if (name === 'technical_contact_email' && value && !validateEmail(value)) {
      error = 'Email inválido';
    }
    
    setErrors((prev) => ({ ...prev, [name]: error }));
    return error === '';
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> | SelectChangeEvent) => {
    const { name, value } = event.target;
    let formattedValue = value;

    if (typeof value === 'string') {
      if (name === 'cnpj') formattedValue = formatCNPJ(value);
      if (name === 'phone') formattedValue = formatPhone(value);
      if (name === 'zip_code') formattedValue = formatCEP(value);
      if (name === 'state') formattedValue = formatState(value);
      
      validateField(name as string, formattedValue as string);
    }

    setFormData((prev) => ({
      ...prev,
      [name as string]: formattedValue,
    }));
  };

  const handleCepBlur = async (event: React.FocusEvent<HTMLInputElement>) => {
    const cep = event.target.value.replace(/\D/g, '');
    if (cep.length === 8) {
      setLoadingCep(true);
      try {
        const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
        if (!response.data.erro) {
          setFormData((prev) => ({
            ...prev,
            street_address: response.data.logradouro,
            neighborhood: response.data.bairro,
            city: response.data.localidade,
            state: response.data.uf,
          }));
        }
      } catch (error) {
        console.error('Erro ao buscar CEP', error);
      } finally {
        setLoadingCep(false);
      }
    }
  };

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;

    // Validate all fields before submit
    const newErrors: { [key: string]: string } = {};
    if (formData.cnpj && !validateCNPJ(formData.cnpj)) newErrors.cnpj = 'CNPJ inválido';
    if (formData.email && !validateEmail(formData.email)) newErrors.email = 'Email inválido';
    if (formData.technical_contact_email && !validateEmail(formData.technical_contact_email)) newErrors.technical_contact_email = 'Email inválido';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSnackbar({ open: true, message: 'Por favor, corrija os erros no formulário.', severity: 'error' });
      return;
    }

    setLoading(true);
    const { parent_obedience_id, ...rest } = formData;
    // Helper to convert empty strings to null and trim strings
    const sanitize = (value: string) => {
      if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed === '' ? null : trimmed;
      }
      return value;
    };

    const obedienceData = {
      ...rest,
      parent_obedience_id: parent_obedience_id || null,
      acronym: sanitize(formData.acronym),
      cnpj: sanitize(formData.cnpj),
      email: sanitize(formData.email),
      phone: sanitize(formData.phone),
      website: sanitize(formData.website),
      street_address: sanitize(formData.street_address),
      street_number: sanitize(formData.street_number),
      address_complement: sanitize(formData.address_complement),
      neighborhood: sanitize(formData.neighborhood),
      city: sanitize(formData.city),
      state: sanitize(formData.state),
      zip_code: sanitize(formData.zip_code),
    };

    try {
      if (id) {
        await api.put(`/obediences/${id}`, obedienceData);
        setSnackbar({ open: true, message: 'Obediência atualizada com sucesso!', severity: 'success' });
      } else {
        await api.post('/obediences', obedienceData);
        setSnackbar({ open: true, message: 'Obediência criada com sucesso!', severity: 'success' });
      }
      setTimeout(() => navigate('/dashboard/management/obediences'), 1500);
    } catch (error) {
      console.error('Failed to save obedience', error);
      setSnackbar({ open: true, message: 'Erro ao salvar obediência. Verifique os dados.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom color="primary">
          {id ? 'Editar Obediência' : 'Nova Obediência'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Preencha os dados abaixo para cadastrar uma nova obediência.
        </Typography>
      </Box>

      <Paper sx={{ p: 4 }}>
        <form onSubmit={handleSubmit}>
          <Typography variant="h6" gutterBottom sx={{ mb: 2, color: 'primary.main' }}>
            Dados Gerais
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField name="name" label="Nome" value={formData.name} onChange={handleChange} fullWidth required />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField name="acronym" label="Sigla" value={formData.acronym} onChange={handleChange} fullWidth />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField 
                name="cnpj" 
                label="CNPJ" 
                value={formData.cnpj} 
                onChange={handleChange} 
                fullWidth 
                error={!!errors.cnpj}
                helperText={errors.cnpj}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select name="type" value={formData.type} label="Tipo" onChange={handleChange} required>
                  <MenuItem value="Federal">Federal</MenuItem>
                  <MenuItem value="Estadual">Estadual</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Obediência Mãe</InputLabel>
                <Select name="parent_obedience_id" value={formData.parent_obedience_id} label="Obediência Mãe" onChange={handleChange}>
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
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField 
                name="email" 
                label="Email" 
                value={formData.email} 
                onChange={handleChange} 
                fullWidth 
                error={!!errors.email}
                helperText={errors.email}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField name="phone" label="Telefone" value={formData.phone} onChange={handleChange} fullWidth />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField name="website" label="Website" value={formData.website} onChange={handleChange} fullWidth />
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2, color: 'primary.main' }}>
            Endereço
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <TextField 
                name="zip_code" 
                label="CEP" 
                value={formData.zip_code} 
                onChange={handleChange} 
                onBlur={handleCepBlur}
                fullWidth 
                InputProps={{
                  endAdornment: loadingCep ? <CircularProgress size={20} /> : null
                }}
              />
            </Grid>
            <Grid item xs={12} md={7}>
              <TextField name="street_address" label="Endereço" value={formData.street_address} onChange={handleChange} fullWidth />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField name="street_number" label="Número" value={formData.street_number} onChange={handleChange} fullWidth />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField name="neighborhood" label="Bairro" value={formData.neighborhood} onChange={handleChange} fullWidth />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField name="address_complement" label="Complemento" value={formData.address_complement} onChange={handleChange} fullWidth />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField name="city" label="Cidade" value={formData.city} onChange={handleChange} fullWidth />
            </Grid>
            <Grid item xs={12} md={1}>
              <TextField name="state" label="UF" value={formData.state} onChange={handleChange} fullWidth />
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2, color: 'primary.main' }}>
            Contato Técnico
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField name="technical_contact_name" label="Nome do Responsável" value={formData.technical_contact_name} onChange={handleChange} fullWidth required />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField 
                name="technical_contact_email" 
                label="Email do Responsável" 
                value={formData.technical_contact_email} 
                onChange={handleChange} 
                fullWidth 
                required 
                error={!!errors.technical_contact_email}
                helperText={errors.technical_contact_email}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="outlined" onClick={() => navigate('/dashboard/management/obediences')}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained" color="primary" size="large" disabled={loading}>
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Salvar'}
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

export default ObedienceForm;