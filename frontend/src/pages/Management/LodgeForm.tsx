import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Container, TextField, Typography, Select, MenuItem, FormControl, InputLabel, Grid, Paper, Box, CircularProgress, SelectChangeEvent, Autocomplete } from '@mui/material';
import api from '../../services/api';
import axios from 'axios';
import { formatCNPJ, formatPhone, formatCEP, formatState } from '../../utils/formatters';
import { validateCNPJ, validateEmail } from '../../utils/validators';
import { Snackbar, Alert } from '@mui/material';
import { RiteEnum } from '../../types';

// ...

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
    latitude: '',
    longitude: '',
    technical_contact_name: '',
    technical_contact_email: '',
    session_day: '',
    periodicity: '',
    session_time: '',
    custom_domain: '',
    plan: '',
    user_limit: '',
    status: '',
    external_id: null as number | null, // Novo campo
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [obediences, setObediences] = useState([]);
  const [loadingCep, setLoadingCep] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();
  const { id } = useParams();

  // Estados para busca de loja global
  const [externalLodges, setExternalLodges] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);


  useEffect(() => {
    const fetchObediences = async () => {
      try {
        const response = await api.get('/obediences/', {
          params: { only_top_level: true }
        });
        setObediences(response.data);
      } catch (error) {
        console.error('Erro ao buscar obediências:', error);
      }
    };
    fetchObediences();

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

  // Efeito para busca de lojas globais
  useEffect(() => {
    if (id) return; // Não busca se estiver editando

    const searchLodges = async () => {
      if (searchQuery.length < 2) {
        setExternalLodges([]);
        return;
      }

      setSearching(true);
      try {
        const response = await api.get(`/external-lodges/search?query=${searchQuery}`);
        setExternalLodges(response.data);
      } catch (err) {
        console.error("Failed to search lodges", err);
      } finally {
        setSearching(false);
      }
    };

    const timeoutId = setTimeout(searchLodges, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, id]);

  const handleExternalLodgeSelect = (_: any, newValue: any) => {
    if (newValue) {
      // Preenche o formulário com dados da loja externa
      setFormData(prev => ({
        ...prev,
        lodge_name: newValue.name,
        lodge_number: newValue.number.toString(),
        city: newValue.city,
        state: newValue.state,
        external_id: newValue.id,
        // Tenta mapear obediência se possível (lógica simples por string match poderia ser adicionada aqui)
      }));
      setSnackbar({ open: true, message: 'Dados da loja importados! Complete o cadastro.', severity: 'success' });
    }
  };

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
    const { obedience_id, foundation_date, session_time, email, ...rest } = formData;
    
    // Helper to convert empty strings to null and trim strings
    const sanitize = (value: string | number | null) => {
      if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed === '' ? null : trimmed;
      }
      return value;
    };

    const lodgeData = {
      ...rest,
      obedience_id: obedience_id || null,
      foundation_date: foundation_date || null,
      session_time: session_time || null,
      email: sanitize(email),
      // Sanitize other optional fields just in case
      cnpj: sanitize(formData.cnpj),
      phone: sanitize(formData.phone),
      website: sanitize(formData.website),
      street_address: sanitize(formData.street_address),
      street_number: sanitize(formData.street_number),
      address_complement: sanitize(formData.address_complement),
      neighborhood: sanitize(formData.neighborhood),
      city: sanitize(formData.city),
      state: sanitize(formData.state),
      zip_code: sanitize(formData.zip_code),
      session_day: sanitize(formData.session_day),
      periodicity: sanitize(formData.periodicity),
      rite: sanitize(formData.rite),
      latitude: sanitize(formData.latitude),
      longitude: sanitize(formData.longitude),
      custom_domain: sanitize(formData.custom_domain),
      plan: sanitize(formData.plan),
      user_limit: formData.user_limit ? parseInt(formData.user_limit as string) : null,
      status: sanitize(formData.status),
      external_id: formData.external_id, // Envia o ID externo
    };


    try {
      if (id) {
        await api.put(`/lodges/${id}`, lodgeData);
        setSnackbar({ open: true, message: 'Loja atualizada com sucesso!', severity: 'success' });
      } else {
        await api.post('/lodges', lodgeData);
        setSnackbar({ open: true, message: 'Loja criada com sucesso! Membros importados.', severity: 'success' });
      }
      setTimeout(() => navigate('/dashboard/management/lodges'), 1500);
    } catch (error) {
      console.error('Falha ao salvar loja', error);
      setSnackbar({ open: true, message: 'Erro ao salvar loja. Verifique os dados.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom color="primary">
          {id ? 'Editar Loja' : 'Nova Loja'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Preencha os dados abaixo para cadastrar uma nova loja maçônica.
        </Typography>
      </Box>

      <Paper sx={{ p: 4 }}>
        {!id && (
            <Box sx={{ mb: 4, p: 2, bgcolor: '#f8f9fa', borderRadius: 1, border: '1px dashed #ccc' }}>
                <Typography variant="subtitle1" gutterBottom color="primary">
                    Importar do Cadastro Global (Opcional)
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                    Busque sua loja no cadastro global para preencher os dados automaticamente e importar membros.
                </Typography>
                <Autocomplete
                    options={externalLodges}
                    getOptionLabel={(option) => `${option.name} N. ${option.number} (${option.obedience})`}
                    loading={searching}
                    onInputChange={(_, newInputValue) => setSearchQuery(newInputValue)}
                    onChange={handleExternalLodgeSelect}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Buscar Loja Global (Nome ou Número)"
                            fullWidth
                            InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                    <>
                                        {searching ? <CircularProgress color="inherit" size={20} /> : null}
                                        {params.InputProps.endAdornment}
                                    </>
                                ),
                            }}
                        />
                    )}
                    renderOption={(props, option) => (
                        <li {...props}>
                            <Box>
                                <Typography variant="body1">{option.name} N. {option.number}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {option.obedience} - {option.city}/{option.state}
                                </Typography>
                            </Box>
                        </li>
                    )}
                />
            </Box>
        )}

        <form onSubmit={handleSubmit}>
          <Typography variant="h6" gutterBottom sx={{ mb: 2, color: 'primary.main' }}>
            Dados Gerais
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField name="lodge_name" label="Nome da Loja" value={formData.lodge_name} onChange={handleChange} fullWidth required />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField name="lodge_number" label="Número" value={formData.lodge_number} onChange={handleChange} fullWidth required />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField name="foundation_date" label="Data de Fundação" type="date" value={formData.foundation_date} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Rito</InputLabel>
                <Select name="rite" value={formData.rite} label="Rito" onChange={handleChange}>
                  <MenuItem value={RiteEnum.REAA}>Rito Escocês Antigo e Aceito</MenuItem>
                  <MenuItem value={RiteEnum.YORK}>Rito York</MenuItem>
                  <MenuItem value={RiteEnum.SCHRODER}>Rito Schroder</MenuItem>
                  <MenuItem value={RiteEnum.BRAZILIAN}>Rito Brasileiro</MenuItem>
                  <MenuItem value={RiteEnum.MODERN}>Rito Moderno</MenuItem>
                  <MenuItem value={RiteEnum.ADONHIRAMITE}>Rito Adonhiramita</MenuItem>
                  <MenuItem value={RiteEnum.RER}>Rito Escocês Retificado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Obediência</InputLabel>
                <Select name="obedience_id" value={formData.obedience_id} label="Obediência" onChange={handleChange} required>
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
                name="cnpj" 
                label="CNPJ" 
                value={formData.cnpj} 
                onChange={handleChange} 
                fullWidth 
                error={!!errors.cnpj}
                helperText={errors.cnpj}
              />
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
              <TextField name="website" label="Website" value={formData.website} onChange={handleChange} fullWidth placeholder="https://exemplo.com.br" />
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
            <Grid item xs={12} md={3}>
              <TextField name="latitude" label="Latitude" value={formData.latitude} onChange={handleChange} fullWidth />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField name="longitude" label="Longitude" value={formData.longitude} onChange={handleChange} fullWidth />
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2, color: 'primary.main' }}>
            Sessões
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Dia da Sessão</InputLabel>
                <Select name="session_day" value={formData.session_day} label="Dia da Sessão" onChange={handleChange}>
                  <MenuItem value="Domingo">Domingo</MenuItem>
                  <MenuItem value="Segunda-feira">Segunda-feira</MenuItem>
                  <MenuItem value="Terça-feira">Terça-feira</MenuItem>
                  <MenuItem value="Quarta-feira">Quarta-feira</MenuItem>
                  <MenuItem value="Quinta-feira">Quinta-feira</MenuItem>
                  <MenuItem value="Sexta-feira">Sexta-feira</MenuItem>
                  <MenuItem value="Sábado">Sábado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Periodicidade</InputLabel>
                <Select name="periodicity" value={formData.periodicity} label="Periodicidade" onChange={handleChange}>
                  <MenuItem value="Semanal">Semanal</MenuItem>
                  <MenuItem value="Quinzenal">Quinzenal</MenuItem>
                  <MenuItem value="Mensal">Mensal</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField name="session_time" label="Horário" type="time" value={formData.session_time} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />
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

          <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2, color: 'primary.main' }}>
            Configurações Avançadas
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField 
                name="custom_domain" 
                label="Domínio Personalizado" 
                value={formData.custom_domain} 
                onChange={handleChange} 
                fullWidth 
                helperText="Ex: loja123.maconaria.org.br"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select name="status" value={formData.status} label="Status" onChange={handleChange}>
                  <MenuItem value="">Nenhum</MenuItem>
                  <MenuItem value="Ativa">Ativa</MenuItem>
                  <MenuItem value="Inativa">Inativa</MenuItem>
                  <MenuItem value="Em Instalação">Em Instalação</MenuItem>
                  <MenuItem value="Suspensa">Suspensa</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Plano</InputLabel>
                <Select name="plan" value={formData.plan} label="Plano" onChange={handleChange}>
                  <MenuItem value="">Nenhum</MenuItem>
                  <MenuItem value="Básico">Básico</MenuItem>
                  <MenuItem value="Padrão">Padrão</MenuItem>
                  <MenuItem value="Premium">Premium</MenuItem>
                  <MenuItem value="Enterprise">Enterprise</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField 
                name="user_limit" 
                label="Limite de Usuários" 
                type="number" 
                value={formData.user_limit} 
                onChange={handleChange} 
                fullWidth 
                helperText="Número máximo de membros permitidos"
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="outlined" onClick={() => navigate('/dashboard/management/lodges')}>
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

export default LodgeForm;
