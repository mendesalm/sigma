import { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Button, Container, TextField, Typography, Select, MenuItem, FormControl, 
  InputLabel, Grid, Paper, Box, CircularProgress, SelectChangeEvent, Autocomplete,
  Stack, Divider, useTheme, Alert, Snackbar, Switch, FormGroup, FormControlLabel
} from '@mui/material';
import {
  Business as BusinessIcon,
  LocationOn as LocationOnIcon,
  Event as EventIcon,
  ContactMail as ContactMailIcon,
  Settings as SettingsIcon,
  Save as SaveIcon,
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon,
  Domain as DomainIcon
} from '@mui/icons-material';
import api from '@/shared/services/api';
import axios from 'axios';
import { formatCNPJ, formatPhone, formatCEP, formatState } from '@/shared/utils/formatters';
import { validateCNPJ, validateEmail } from '@/shared/utils/validators';
import { RiteEnum } from '@/types';
import { AuthContext } from '@/modules/access_control/context/AuthContext';

// Utility Component for Section Headers
const SectionHeader = ({ title, icon, color = "primary" }: { title: string, icon?: React.ReactNode, color?: "primary" | "secondary" | "info" | "warning" | "success" }) => {
    const theme = useTheme();
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, mt: 1 }}>
            {icon && <Box sx={{ mr: 1.5, color: theme.palette[color].main, display: 'flex' }}>{icon}</Box>}
            <Typography variant="h6" color="text.primary" sx={{ fontWeight: 600, letterSpacing: 0.5 }}>
                {title}
            </Typography>
            <Divider sx={{ flexGrow: 1, ml: 2, borderColor: theme.palette.divider }} />
        </Box>
    );
};

interface LodgeFormProps {
    idProp?: string;
}

const LodgeForm = ({ idProp }: LodgeFormProps = {}) => {
  const [formData, setFormData] = useState({
    lodge_name: '',
    lodge_number: '',
    foundation_date: '',
    rite: '',
    obedience_id: '',
    subobedience_id: '',
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
    external_id: null as number | null,
    document_settings: {} as any, // Configurações de documentos
    available_modules: {
      member_registration: true,
      session_management: true,
      session_attendance: true,
      chancellery: true,
      document_emission: true,
      treasury: true,
      library: true,
    } as any,
    auto_schedule_sessions: false,
    session_weeks: [] as number[],
    custom_holidays: [
      { day: 20, month: 8, name: "Dia do Maçom" },
      { day: 17, month: 6, name: "Criação do GOB" }
    ],
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [obediences, setObediences] = useState([]);
  const [loadingCep, setLoadingCep] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();
  const { user } = useContext(AuthContext) || {};
  const { id: paramId } = useParams();
  const id = idProp || paramId;
  const theme = useTheme();

  // Estados para busca de loja global
  const [externalLodges, setExternalLodges] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);

  const [recesses, setRecesses] = useState<any[]>([]);
  const [newRecess, setNewRecess] = useState({ start_date: '', end_date: '', description: '' });
  const [loadingRecess, setLoadingRecess] = useState(false);

  useEffect(() => {
    const fetchObediences = async () => {
      try {
        const response = await api.get('/obediences/', {
          params: { limit: 1000 }
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
      
      const fetchRecesses = async () => {
        try {
          const response = await api.get(`/masonic-sessions/recesses`);
          setRecesses(response.data);
        } catch (error) {
          console.error('Falha ao buscar recessos', error);
        }
      };

      fetchLodge();
      fetchRecesses();
    }
  }, [id]);

  const handleCreateRecess = async () => {
    if (!newRecess.start_date || !newRecess.end_date) {
      setSnackbar({ open: true, message: 'Data de início e fim são obrigatórias', severity: 'error' });
      return;
    }
    setLoadingRecess(true);
    try {
      const response = await api.post('/masonic-sessions/recesses', newRecess);
      setRecesses(prev => [...prev, response.data]);
      setNewRecess({ start_date: '', end_date: '', description: '' });
      setSnackbar({ open: true, message: 'Recesso adicionado com sucesso!', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Erro ao adicionar recesso', severity: 'error' });
    } finally {
      setLoadingRecess(false);
    }
  };

  const handleDeleteRecess = async (recessId: number) => {
    try {
      await api.delete(`/masonic-sessions/recesses/${recessId}`);
      setRecesses(prev => prev.filter(r => r.id !== recessId));
      setSnackbar({ open: true, message: 'Recesso removido!', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Erro ao remover recesso', severity: 'error' });
    }
  };

  const handleResetSettings = async () => {
    if (!id || !window.confirm('Tem certeza que deseja restaurar as configurações de fábrica? Os módulos serão resetados. Um backup será criado para caso queira desfazer.')) return;
    try {
      await api.resetLodgeSettings(parseInt(id));
      setSnackbar({ open: true, message: 'Configurações de fábrica restauradas com sucesso!', severity: 'success' });
      // Reload page to fetch new settings
      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.detail || 'Erro ao restaurar configurações', severity: 'error' });
    }
  };

  const handleRestoreSettings = async () => {
    if (!id || !window.confirm('Tem certeza que deseja desfazer o reset e restaurar as configurações anteriores?')) return;
    try {
      await api.restoreLodgeSettings(parseInt(id));
      setSnackbar({ open: true, message: 'Configurações anteriores restauradas com sucesso!', severity: 'success' });
      // Reload page to fetch new settings
      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.detail || 'Erro ao desfazer reset', severity: 'error' });
    }
  };

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
        // The API returns strings for obedience/subobedience, mapping to IDs would require searching the internal lists.
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

  const handleModuleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      available_modules: {
        ...prev.available_modules,
        [name]: checked
      }
    }));
  };

  const handleToggleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleAddCustomHoliday = () => {
    setFormData(prev => ({
      ...prev,
      custom_holidays: [...(prev.custom_holidays || []), { day: 1, month: 1, name: 'Novo Feriado' }]
    }));
  };

  const handleRemoveCustomHoliday = (index: number) => {
    setFormData(prev => ({
      ...prev,
      custom_holidays: (prev.custom_holidays || []).filter((_, i) => i !== index)
    }));
  };

  const handleCustomHolidayChange = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newHolidays = [...(prev.custom_holidays || [])];
      newHolidays[index] = { ...newHolidays[index], [field]: value };
      return { ...prev, custom_holidays: newHolidays };
    });
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
      subobedience_id: rest.subobedience_id || null,
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
      setTimeout(() => {
        if (user?.user_type === 'webmaster') {
           navigate('/dashboard/lodge-dashboard/webmaster/minha-loja');
        } else {
           navigate('/dashboard/management/lodges');
        }
      }, 1500);
    } catch (error) {
      console.error('Falha ao salvar loja', error);
      setSnackbar({ open: true, message: 'Erro ao salvar loja. Verifique os dados.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
      <Container maxWidth="xl" sx={{ pb: 5 }}>
          {/* Page Header */}
          <Box sx={{ mb: 4, mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
           <Box>
               <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'text.primary' }}>
               {id ? 'Editar Loja' : 'Nova Loja'}
               </Typography>
               <Typography variant="subtitle1" color="text.secondary">
               {id ? 'Atualize os dados da loja.' : 'Preencha os dados abaixo para cadastrar uma nova loja.'}
               </Typography>
           </Box>
           <Button 
               variant="outlined" 
               startIcon={<ArrowBackIcon />} 
               onClick={() => navigate('/dashboard/management/lodges')}
               sx={{ borderRadius: 2 }}
           >
               Voltar
           </Button>
         </Box>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
               {/* Main Column */}
               <Grid
                   size={{
                       xs: 12,
                       md: 9
                   }}>
                    {/* 0. External Search (Only on Create) */}
                    {!id && (
                        <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.background.default }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <SearchIcon color="primary" sx={{ mr: 1, fontSize: 30 }} />
                                <Box>
                                    <Typography variant="h6" color="primary">Importar do Cadastro Global</Typography>
                                    <Typography variant="caption" color="text.secondary">Busque sua loja para preenchimento automático</Typography>
                                </Box>
                            </Box>
                             <Autocomplete
                                options={externalLodges}
                                getOptionLabel={(option) => `${option.name} N. ${option.number} (${option.obedience})`}
                                loading={searching}
                                onInputChange={(_, newInputValue) => setSearchQuery(newInputValue)}
                                onChange={handleExternalLodgeSelect}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Buscar Loja (Nome ou Número)"
                                        fullWidth
                                        variant="outlined"
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
                                                {option.obedience}{option.subobedience ? ` / ${option.subobedience}` : ''} - {option.city}/{option.state}
                                            </Typography>
                                        </Box>
                                    </li>
                                )}
                            />
                        </Paper>
                    )}

                    {/* 1. Dados Gerais */}
                    <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
                        <SectionHeader title="Dados Gerais" icon={<BusinessIcon />} />
                        <Grid container spacing={3}>
                            <Grid
                                size={{
                                    xs: 12,
                                    md: 6
                                }}>
                            <TextField name="lodge_name" label="Nome da Loja" value={formData.lodge_name} onChange={handleChange} fullWidth required variant="outlined" />
                            </Grid>
                            <Grid
                                size={{
                                    xs: 12,
                                    md: 3
                                }}>
                            <TextField name="lodge_number" label="Número" value={formData.lodge_number} onChange={handleChange} fullWidth required variant="outlined" />
                            </Grid>
                            <Grid
                                size={{
                                    xs: 12,
                                    md: 3
                                }}>
                            <TextField name="foundation_date" label="Data de Fundação" type="date" value={formData.foundation_date} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} variant="outlined" />
                            </Grid>

                            <Grid
                                size={{
                                    xs: 12,
                                    md: 6
                                }}>
                            <FormControl fullWidth variant="outlined">
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
                            <Grid
                                size={{
                                    xs: 12,
                                    md: 6
                                }}>
                            <FormControl fullWidth variant="outlined">
                                <InputLabel>Obediência</InputLabel>
                                <Select name="obedience_id" value={formData.obedience_id} label="Obediência" onChange={(e) => {
                                    // Clear subobedience when obedience changes
                                    setFormData(prev => ({...prev, obedience_id: e.target.value as string, subobedience_id: ''}));
                                }} required>
                                {obediences.filter((ob: any) => !ob.parent_obedience_id).map((obedience: any) => (
                                    <MenuItem key={obedience.id} value={obedience.id}>
                                    {obedience.name}
                                    </MenuItem>
                                ))}
                                </Select>
                            </FormControl>
                            </Grid>
                            {formData.obedience_id && obediences.some((ob: any) => ob.parent_obedience_id === formData.obedience_id) && (
                                <Grid
                                    size={{
                                        xs: 12,
                                        md: 6
                                    }}>
                                <FormControl fullWidth variant="outlined">
                                    <InputLabel>Subobediência</InputLabel>
                                    <Select name="subobedience_id" value={formData.subobedience_id || ''} label="Subobediência" onChange={handleChange}>
                                    <MenuItem value="">Nenhuma</MenuItem>
                                    {obediences.filter((ob: any) => ob.parent_obedience_id === formData.obedience_id).map((obedience: any) => (
                                        <MenuItem key={obedience.id} value={obedience.id}>
                                        {obedience.name}
                                        </MenuItem>
                                    ))}
                                    </Select>
                                </FormControl>
                                </Grid>
                            )}
                            <Grid
                                size={{
                                    xs: 12,
                                    md: 4
                                }}>
                            <TextField 
                                name="cnpj" 
                                label="CNPJ" 
                                value={formData.cnpj} 
                                onChange={handleChange} 
                                fullWidth 
                                error={!!errors.cnpj}
                                helperText={errors.cnpj}
                                variant="outlined"
                            />
                            </Grid>
                            <Grid
                                size={{
                                    xs: 12,
                                    md: 4
                                }}>
                            <TextField 
                                name="email" 
                                label="Email da Loja" 
                                value={formData.email} 
                                onChange={handleChange} 
                                fullWidth 
                                error={!!errors.email}
                                helperText={errors.email}
                                variant="outlined"
                            />
                            </Grid>
                            <Grid
                                size={{
                                    xs: 12,
                                    md: 4
                                }}>
                            <TextField name="phone" label="Telefone" value={formData.phone} onChange={handleChange} fullWidth variant="outlined" />
                            </Grid>
                            <Grid
                                size={{
                                    xs: 12
                                }}>
                                 <TextField name="website" label="Website" value={formData.website} onChange={handleChange} fullWidth placeholder="https://exemplo.com.br" variant="outlined" />
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* 2. Endereço */}
                    <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
                        <SectionHeader title="Localização" icon={<LocationOnIcon />} color="info" />
                        <Grid container spacing={3}>
                            <Grid
                                size={{
                                    xs: 12,
                                    md: 3
                                }}>
                            <TextField 
                                name="zip_code" 
                                label="CEP" 
                                value={formData.zip_code} 
                                onChange={handleChange} 
                                onBlur={handleCepBlur}
                                fullWidth 
                                variant="outlined"
                                InputProps={{
                                endAdornment: loadingCep ? <CircularProgress size={20} /> : <SearchIcon color="action" />
                                }}
                            />
                            </Grid>
                            <Grid
                                size={{
                                    xs: 12,
                                    md: 7
                                }}>
                            <TextField name="street_address" label="Logradouro" value={formData.street_address} onChange={handleChange} fullWidth variant="outlined" />
                            </Grid>
                            <Grid
                                size={{
                                    xs: 12,
                                    md: 2
                                }}>
                            <TextField name="street_number" label="Número" value={formData.street_number} onChange={handleChange} fullWidth variant="outlined" />
                            </Grid>
                            <Grid
                                size={{
                                    xs: 12,
                                    md: 4
                                }}>
                            <TextField name="neighborhood" label="Bairro" value={formData.neighborhood} onChange={handleChange} fullWidth variant="outlined" />
                            </Grid>
                            <Grid
                                size={{
                                    xs: 12,
                                    md: 4
                                }}>
                            <TextField name="address_complement" label="Complemento" value={formData.address_complement} onChange={handleChange} fullWidth variant="outlined" />
                            </Grid>
                            <Grid
                                size={{
                                    xs: 12,
                                    md: 3
                                }}>
                            <TextField name="city" label="Cidade" value={formData.city} onChange={handleChange} fullWidth variant="outlined" />
                            </Grid>
                            <Grid
                                size={{
                                    xs: 12,
                                    md: 1
                                }}>
                            <TextField name="state" label="UF" value={formData.state} onChange={handleChange} fullWidth variant="outlined" />
                            </Grid>
                             {/* Lat/Long could be hidden or moved to advanced if not often used */}
                            <Grid
                                size={{
                                    xs: 12,
                                    md: 3
                                }}>
                            <TextField name="latitude" label="Latitude" value={formData.latitude} onChange={handleChange} fullWidth size="small" variant="filled" />
                            </Grid>
                            <Grid
                                size={{
                                    xs: 12,
                                    md: 3
                                }}>
                            <TextField name="longitude" label="Longitude" value={formData.longitude} onChange={handleChange} fullWidth size="small" variant="filled" />
                            </Grid>
                        </Grid>
                    </Paper>
                    
                     <Grid container spacing={3}>
                         {/* 3. Sessões */}
                         <Grid
                             size={{
                                 xs: 12,
                                 md: 6
                             }}>
                            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
                                <SectionHeader title="Sessões" icon={<EventIcon />} color="warning" />
                                <Grid container spacing={2}>
                                    <Grid
                                        size={{
                                            xs: 12
                                        }}>
                                        <FormControl fullWidth variant="outlined">
                                            <InputLabel>Dia da Sessão</InputLabel>
                                            <Select name="session_day" value={formData.session_day} label="Dia da Sessão" onChange={handleChange}>
                                            <MenuItem value="Domingos">Domingos</MenuItem>
                                            <MenuItem value="Segundas-feiras">Segundas-feiras</MenuItem>
                                            <MenuItem value="Terças-feiras">Terças-feiras</MenuItem>
                                            <MenuItem value="Quartas-feiras">Quartas-feiras</MenuItem>
                                            <MenuItem value="Quintas-feiras">Quintas-feiras</MenuItem>
                                            <MenuItem value="Sextas-feiras">Sextas-feiras</MenuItem>
                                            <MenuItem value="Sábados">Sábados</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid
                                        size={{
                                            xs: 12
                                        }}>
                                        <FormControl fullWidth variant="outlined">
                                            <InputLabel>Periodicidade</InputLabel>
                                            <Select name="periodicity" value={formData.periodicity} label="Periodicidade" onChange={handleChange}>
                                            <MenuItem value="Semanal">Semanal</MenuItem>
                                            <MenuItem value="Quinzenal">Quinzenal</MenuItem>
                                            <MenuItem value="Mensal">Mensal</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    {(formData.periodicity === 'Mensal' || formData.periodicity === 'Quinzenal') && (
                                    <Grid
                                        size={{
                                            xs: 12
                                        }}>
                                        <FormControl fullWidth variant="outlined">
                                            <InputLabel>Semanas do Mês</InputLabel>
                                            <Select
                                                multiple
                                                name="session_weeks"
                                                value={formData.session_weeks || []}
                                                onChange={(e) => {
                                                    const value = e.target.value as number[];
                                                    setFormData({ ...formData, session_weeks: value });
                                                }}
                                                label="Semanas do Mês"
                                            >
                                                <MenuItem value={1}>1ª Semana</MenuItem>
                                                <MenuItem value={2}>2ª Semana</MenuItem>
                                                <MenuItem value={3}>3ª Semana</MenuItem>
                                                <MenuItem value={4}>4ª Semana</MenuItem>
                                                <MenuItem value={-1}>Última Semana</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    )}
                                    <Grid
                                        size={{
                                            xs: 12
                                        }}>
                                        <TextField name="session_time" label="Horário" type="time" value={formData.session_time} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} variant="outlined" />
                                    </Grid>
                                    <Grid size={{ xs: 12 }}>
                                        <FormControlLabel
                                            control={<Switch checked={formData.auto_schedule_sessions} onChange={handleToggleChange} name="auto_schedule_sessions" color="primary" />}
                                            label="Gerar previsões de calendário automaticamente"
                                        />
                                    </Grid>
                                </Grid>
                            </Paper>
                         </Grid>

                         {/* 4. Contato Técnico */}
                         <Grid
                             size={{
                                 xs: 12,
                                 md: 6
                             }}>
                            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
                                <SectionHeader title="Contato Técnico" icon={<ContactMailIcon />} color="secondary" />
                                <Grid container spacing={2}>
                                    <Grid
                                        size={{
                                            xs: 12
                                        }}>
                                        <TextField name="technical_contact_name" label="Nome do Responsável" value={formData.technical_contact_name} onChange={handleChange} fullWidth required variant="outlined" />
                                    </Grid>
                                    <Grid
                                        size={{
                                            xs: 12
                                        }}>
                                        <TextField 
                                            name="technical_contact_email" 
                                            label="Email do Responsável" 
                                            value={formData.technical_contact_email} 
                                            onChange={handleChange} 
                                            fullWidth 
                                            required 
                                            error={!!errors.technical_contact_email}
                                            helperText={errors.technical_contact_email}
                                            variant="outlined"
                                        />
                                    </Grid>
                                </Grid>
                            </Paper>
                         </Grid>
                     </Grid>

                     {/* 5. Feriados Customizados e Férias */}
                     <Grid container spacing={3} sx={{ mt: 1 }}>
                         <Grid size={{ xs: 12, md: 6 }}>
                            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
                                <SectionHeader title="Feriados da Loja" icon={<EventIcon />} color="info" />
                                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                                    Defina os dias em que a Loja não realiza sessões (ex: Feriados maçônicos locais).
                                </Typography>
                                <Stack spacing={2}>
                                    {(formData.custom_holidays || []).map((holiday, index) => (
                                        <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                            <TextField 
                                                size="small" 
                                                label="Nome" 
                                                value={holiday.name} 
                                                onChange={(e) => handleCustomHolidayChange(index, 'name', e.target.value)} 
                                                fullWidth 
                                            />
                                            <TextField 
                                                size="small" 
                                                label="Dia" 
                                                type="number" 
                                                value={holiday.day} 
                                                onChange={(e) => handleCustomHolidayChange(index, 'day', parseInt(e.target.value))} 
                                                sx={{ width: 80 }} 
                                            />
                                            <TextField 
                                                size="small" 
                                                label="Mês" 
                                                type="number" 
                                                value={holiday.month} 
                                                onChange={(e) => handleCustomHolidayChange(index, 'month', parseInt(e.target.value))} 
                                                sx={{ width: 80 }} 
                                            />
                                            <Button color="error" onClick={() => handleRemoveCustomHoliday(index)}>X</Button>
                                        </Box>
                                    ))}
                                    <Button variant="outlined" onClick={handleAddCustomHoliday} startIcon={<EventIcon />}>
                                        Adicionar Feriado
                                    </Button>
                                </Stack>
                            </Paper>
                         </Grid>

                         <Grid size={{ xs: 12, md: 6 }}>
                            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
                                <SectionHeader title="Períodos de Férias / Recesso" icon={<EventIcon />} color="primary" />
                                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                                    Cadastre períodos longos sem sessões (ex: Recesso de final de ano).
                                </Typography>
                                <Stack spacing={2}>
                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                        <TextField
                                            size="small"
                                            label="Início"
                                            type="date"
                                            InputLabelProps={{ shrink: true }}
                                            value={newRecess.start_date}
                                            onChange={(e) => setNewRecess({ ...newRecess, start_date: e.target.value })}
                                            fullWidth
                                        />
                                        <TextField
                                            size="small"
                                            label="Fim"
                                            type="date"
                                            InputLabelProps={{ shrink: true }}
                                            value={newRecess.end_date}
                                            onChange={(e) => setNewRecess({ ...newRecess, end_date: e.target.value })}
                                            fullWidth
                                        />
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                        <TextField
                                            size="small"
                                            label="Descrição"
                                            value={newRecess.description}
                                            onChange={(e) => setNewRecess({ ...newRecess, description: e.target.value })}
                                            fullWidth
                                        />
                                        <Button 
                                            variant="contained" 
                                            onClick={handleCreateRecess} 
                                            disabled={loadingRecess || !id} // Need lodge ID to save recesses properly
                                        >
                                            {loadingRecess ? <CircularProgress size={24} /> : 'Adicionar'}
                                        </Button>
                                    </Box>

                                    {recesses.length > 0 && (
                                        <Box sx={{ mt: 2 }}>
                                            <Typography variant="subtitle2">Recessos Cadastrados:</Typography>
                                            {recesses.map((recess) => (
                                                <Box key={recess.id} sx={{ display: 'flex', justifyContent: 'space-between', p: 1, borderBottom: '1px solid #eee' }}>
                                                    <Box>
                                                        <Typography variant="body2"><strong>{recess.description || 'Recesso'}</strong></Typography>
                                                        <Typography variant="caption" color="textSecondary">
                                                            {new Date(recess.start_date).toLocaleDateString()} - {new Date(recess.end_date).toLocaleDateString()}
                                                        </Typography>
                                                    </Box>
                                                    <Button size="small" color="error" onClick={() => handleDeleteRecess(recess.id)}>Remover</Button>
                                                </Box>
                                            ))}
                                        </Box>
                                    )}
                                    {!id && (
                                        <Alert severity="info">Salve a loja primeiro para poder adicionar recessos.</Alert>
                                    )}
                                </Stack>
                            </Paper>
                         </Grid>
                     </Grid>
               </Grid>

               {/* Sidebar */}
               <Grid
                   size={{
                       xs: 12,
                       md: 3
                   }}>
                     <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
                        <SectionHeader title="Configurações" icon={<SettingsIcon />} />
                        
                        <Stack spacing={2}>
                            <FormControl fullWidth variant="outlined" size="small">
                                <InputLabel>Status</InputLabel>
                                <Select name="status" value={formData.status} label="Status" onChange={handleChange}>
                                <MenuItem value="">Nenhum</MenuItem>
                                <MenuItem value="Ativa">Ativa</MenuItem>
                                <MenuItem value="Inativa">Inativa</MenuItem>
                                <MenuItem value="Em Instalação">Em Instalação</MenuItem>
                                <MenuItem value="Suspensa">Suspensa</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl fullWidth variant="outlined" size="small">
                                <InputLabel>Plano</InputLabel>
                                <Select name="plan" value={formData.plan} label="Plano" onChange={handleChange}>
                                <MenuItem value="">Nenhum</MenuItem>
                                <MenuItem value="Básico">Básico</MenuItem>
                                <MenuItem value="Padrão">Padrão</MenuItem>
                                <MenuItem value="Premium">Premium</MenuItem>
                                <MenuItem value="Enterprise">Enterprise</MenuItem>
                                </Select>
                            </FormControl>

                            <TextField 
                                name="user_limit" 
                                label="Limite de Usuários" 
                                type="number" 
                                value={formData.user_limit} 
                                onChange={handleChange} 
                                fullWidth 
                                size="small"
                                variant="outlined"
                            />
                             <TextField 
                                name="custom_domain" 
                                label="Domínio Personalizado" 
                                value={formData.custom_domain} 
                                onChange={handleChange} 
                                fullWidth 
                                size="small"
                                variant="outlined"
                                InputProps={{
                                    startAdornment: <DomainIcon color="action" fontSize="small" sx={{ mr: 1 }} />
                                }}
                            />
                        </Stack>
                     </Paper>

                     <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
                        <SectionHeader title="Módulos Habilitados" icon={<SettingsIcon />} />
                        <FormGroup>
                          <FormControlLabel control={<Switch checked={!!formData.available_modules?.member_registration} onChange={handleModuleChange} name="member_registration" />} label="Cadastro de Membros" />
                          <FormControlLabel control={<Switch checked={!!formData.available_modules?.session_management} onChange={handleModuleChange} name="session_management" />} label="Gestão de Sessões" />
                          <FormControlLabel control={<Switch checked={!!formData.available_modules?.session_attendance} onChange={handleModuleChange} name="session_attendance" />} label="Registro de Presenças" />
                          <FormControlLabel control={<Switch checked={!!formData.available_modules?.chancellery} onChange={handleModuleChange} name="chancellery" />} label="Chancelaria" />
                          <FormControlLabel control={<Switch checked={!!formData.available_modules?.document_emission} onChange={handleModuleChange} name="document_emission" />} label="Emissão de Documentos" />
                          <FormControlLabel control={<Switch checked={!!formData.available_modules?.treasury} onChange={handleModuleChange} name="treasury" />} label="Tesouraria / Financeiro" />
                          <FormControlLabel control={<Switch checked={!!formData.available_modules?.library} onChange={handleModuleChange} name="library" />} label="Biblioteca" />
                        </FormGroup>
                     </Paper>

                     {id && (
                     <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 3, border: `1px solid ${theme.palette.error.light}` }}>
                        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: theme.palette.error.main, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <SettingsIcon fontSize="small" /> Padrões de Fábrica
                        </Typography>
                        <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 2 }}>
                            Reseta módulos e configs para o padrão do sistema. Um backup da configuração atual será gerado.
                        </Typography>
                        <Stack spacing={1}>
                            <Button variant="outlined" color="error" size="small" fullWidth onClick={handleResetSettings}>
                                Restaurar Padrões de Fábrica
                            </Button>
                            <Button variant="text" color="inherit" size="small" fullWidth onClick={handleRestoreSettings}>
                                Desfazer Último Reset
                            </Button>
                        </Stack>
                     </Paper>
                     )}

                     <Paper elevation={3} sx={{ p: 3, position: 'sticky', top: 20, borderRadius: 3 }}>
                        <Typography variant="subtitle1" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
                            Ações
                        </Typography>
                         <Stack spacing={2}>
                            <Button type="submit" variant="contained" color="primary" size="large" fullWidth startIcon={<SaveIcon />} disabled={loading}>
                                {loading ? <CircularProgress size={24} color="inherit" /> : 'Salvar Loja'}
                            </Button>
                            <Button variant="text" color="inherit" fullWidth onClick={() => navigate('/dashboard/management/lodges')}>
                                Cancelar
                            </Button>
                        </Stack>
                     </Paper>
               </Grid>
            </Grid>
          </form>
          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%', borderRadius: 2 }}>
              {snackbar.message}
            </Alert>
          </Snackbar>
      </Container>
  );
};

export default LodgeForm;
