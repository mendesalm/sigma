import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Button,
  Container,
  TextField,
  Typography,
  Grid,
  Paper,
  Box,
  CircularProgress,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Autocomplete,
  FormGroup,
  FormControlLabel,
  Checkbox,
  FormLabel,
  Stack,
  Divider,
  useTheme
} from '@mui/material';
import {
  Event as EventIcon,
  Schedule as ScheduleIcon,
  Class as ClassIcon,
  Description as DescriptionIcon,
  Person as PersonIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import api from '../../services/api';
import { SessionTypeEnum, SessionSubtypeEnum, MemberResponse } from '../../types';

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

const SessionForm = () => {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    title: '',
    session_number: '',
    session_date: '',
    start_time: '',
    end_time: '21:30',
    type: 'Ordinária',
    subtype: 'Regular',
    agenda: '',
    sent_expedients: '',
    received_expedients: '',
    study_director_id: '',
  });

  // Novos estados para controle lógico do título
  const [degree, setDegree] = useState<string>('Aprendiz');
  const [ingressType, setIngressType] = useState<string[]>([]);

  const [members, setMembers] = useState<MemberResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  const getBasePath = () => {
    const path = location.pathname;
    if (path.includes('secretario/sessoes')) {
      return '/dashboard/lodge-dashboard/secretario/sessoes';
    } else if (path.includes('lodge-dashboard/sessions')) {
      return '/dashboard/lodge-dashboard/sessions';
    } else {
      return '/dashboard/sessions';
    }
  };

  const basePath = getBasePath();

  // Mapping of Types to Subtypes
  const subtypesByType: Record<string, string[]> = {
    [SessionTypeEnum.ORDINARY]: [
      SessionSubtypeEnum.REGULAR,
      SessionSubtypeEnum.ADMINISTRATIVE,
      SessionSubtypeEnum.FINANCE,
      SessionSubtypeEnum.AFFILIATION_REGULARIZATION,
      SessionSubtypeEnum.ELECTORAL,
      SessionSubtypeEnum.RITUALISTIC_BANQUET,
    ],
    [SessionTypeEnum.MAGNA]: [
      SessionSubtypeEnum.INITIATION,
      SessionSubtypeEnum.ELEVATION,
      SessionSubtypeEnum.EXALTATION,
      SessionSubtypeEnum.INSTALLATION,
      SessionSubtypeEnum.INSTALLATION_WORSHIPFUL,
      SessionSubtypeEnum.STANDARD_CONSECRATION,
      SessionSubtypeEnum.LODGE_REGULARIZATION,
      SessionSubtypeEnum.TEMPLE_CONSECRATION,
      SessionSubtypeEnum.LOWTON_ADOPTION,
      SessionSubtypeEnum.MATRIMONIAL_CONSECRATION,
      SessionSubtypeEnum.FUNERAL_POMPS,
      SessionSubtypeEnum.CONFERENCE,
      SessionSubtypeEnum.LECTURE,
      SessionSubtypeEnum.FESTIVE,
      SessionSubtypeEnum.CIVIC_CULTURAL,
    ],
    [SessionTypeEnum.EXTRAORDINARY]: [
      SessionSubtypeEnum.GENERAL_GM_ELECTION,
      SessionSubtypeEnum.STATE_GM_ELECTION,
      SessionSubtypeEnum.DF_GM_ELECTION,
      SessionSubtypeEnum.FAMILY_COUNCIL,
      SessionSubtypeEnum.EX_OFFICIO_PLACET,
      SessionSubtypeEnum.STATUTE_CHANGE,
      SessionSubtypeEnum.RITE_CHANGE,
      SessionSubtypeEnum.ORIENT_CHANGE,
      SessionSubtypeEnum.DISTINCTIVE_TITLE_CHANGE,
      SessionSubtypeEnum.LODGE_MERGER,
    ],
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const membersResponse = await api.get('/members/');
        setMembers(membersResponse.data);

        if (id) {
          const response = await api.get(`/masonic-sessions/${id}`);
          const session = response.data;
          setFormData({
            title: session.title,
            session_number: session.session_number || '',
            session_date: session.session_date,
            start_time: session.start_time || '',
            end_time: session.end_time || '',
            type: session.type || '',
            subtype: session.subtype || '',
            agenda: session.agenda || '',
            sent_expedients: session.sent_expedients || '',
            received_expedients: session.received_expedients || '',
            study_director_id: session.study_director_id || '',
          });
        } else {
          const token = localStorage.getItem('token');
          if (token) {
            try {
              const payload = JSON.parse(atob(token.split('.')[1]));
              const lodgeId = payload.lodge_id;
              if (lodgeId) {
                const lodgeResponse = await api.get(`/lodges/${lodgeId}`);
                const lodge = lodgeResponse.data;
                if (lodge.session_time) {
                  setFormData(prev => ({
                    ...prev,
                    start_time: lodge.session_time
                  }));
                }
              }
            } catch (e) {
              console.error("Error decoding token or fetching lodge details", e);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch data', error);
        setError('Falha ao carregar dados.');
      }
    };
    fetchInitialData();
  }, [id]);

  // Lógica de Geração Automática de Título
  useEffect(() => {
    let newTitle = '';
    const { type, subtype } = formData;

    if (type === 'Ordinária') {
      switch (subtype) {
        case 'Regular':
          newTitle = `Sessão Ordinária no Grau de ${degree} Maçom`;
          break;
        case 'Administrativa':
          newTitle = 'Sessão Ordinária Administrativa';
          break;
        case 'Finanças':
          newTitle = 'Sessão Ordinária de Finanças';
          break;
        case 'Filiação e Regularização':
          if (ingressType.length === 0) {
            newTitle = 'Sessão Ordinária de Filiação e Regularização';
          } else if (ingressType.includes('Filiação') && ingressType.includes('Regularização')) {
            newTitle = 'Sessão Ordinária de Filiação e Regularização';
          } else if (ingressType.includes('Filiação')) {
            newTitle = 'Sessão Ordinária de Filiação';
          } else if (ingressType.includes('Regularização')) {
            newTitle = 'Sessão Ordinária de Regularização';
          }
          break;
        case 'Eleitoral':
          newTitle = 'Sessão Eleitoral';
          break;
        case 'Banquete Ritualístico':
          newTitle = 'Sessão de Banquete Ritualístico';
          break;
        default:
          newTitle = `Sessão Ordinária - ${subtype}`;
      }
    } else if (type === 'Magna') {
      newTitle = `Sessão Magna de ${subtype}`;
    } else if (type === 'Extraordinária') {
      newTitle = `Sessão Extraordinária de ${subtype}`;
    }

    setFormData(prev => ({ ...prev, title: newTitle }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.type, formData.subtype, degree, ingressType]);


  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (event: SelectChangeEvent) => {
    const { name, value } = event.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      if (name === 'type') {
        newData.subtype = ''; // Reset subtype when type changes
      }
      return newData;
    });
  };

  const handleDegreeChange = (event: SelectChangeEvent) => {
    setDegree(event.target.value);
  };

  const handleIngressTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.name;
    setIngressType(prev => {
      if (prev.includes(value)) {
        return prev.filter(item => item !== value);
      } else {
        return [...prev, value];
      }
    });
  };

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    const payload = {
      ...formData,
      session_number: formData.session_number ? parseInt(formData.session_number) : null,
      start_time: formData.start_time || null,
      end_time: formData.end_time || null,
      study_director_id: formData.study_director_id ? parseInt(formData.study_director_id) : null,
    };

    try {
      if (id) {
        await api.put(`/masonic-sessions/${id}`, payload);
        setSnackbar({ open: true, message: 'Sessão atualizada com sucesso!', severity: 'success' });
      } else {
        await api.post('/masonic-sessions/', payload);
        setSnackbar({ open: true, message: 'Sessão agendada com sucesso!', severity: 'success' });
      }
      setTimeout(() => navigate(basePath), 1500);
    } catch (err: any) {
      console.error('Failed to save session', err);
      if (err.response?.status === 409) {
        setError('Já existe uma sessão agendada para esta data.');
      } else {
        setError('Erro ao salvar sessão. Verifique os dados e tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ pb: 5 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4, mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'text.primary' }}>
            {id ? 'Editar Sessão' : 'Agendar Sessão'}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {id ? 'Atualize as informações da sessão abaixo.' : 'Preencha os dados para criar uma nova sessão.'}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(basePath)}
          sx={{ borderRadius: 2 }}
        >
          Voltar
        </Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}
      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>

          {/* 1. Identificação Básica */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
            <SectionHeader title="Identificação" icon={<EventIcon />} />
            <Grid container spacing={3}>
              <Grid
                size={{
                  xs: 12
                }}>
                <TextField
                  name="title"
                  label="Título da Sessão"
                  value={formData.title}
                  fullWidth
                  variant="outlined"
                  InputProps={{
                    readOnly: true,
                    sx: { bgcolor: theme.palette.action.hover, fontWeight: 'bold' }
                  }}
                  helperText="O título é gerado automaticamente com base no tipo e subtipo."
                />
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  md: 4
                }}>
                <TextField
                  name="session_date"
                  label="Data da Sessão"
                  type="date"
                  value={formData.session_date}
                  onChange={handleChange}
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                  sx={{ '& input': { fontWeight: 500 } }}
                />
              </Grid>
              <Grid
                size={{
                  xs: 6,
                  md: 4
                }}>
                <TextField
                  name="start_time"
                  label="Início"
                  type="time"
                  value={formData.start_time}
                  onChange={handleChange}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: <ScheduleIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
              <Grid
                size={{
                  xs: 6,
                  md: 4
                }}>
                <TextField
                  name="end_time"
                  label="Término (Previsto)"
                  type="time"
                  value={formData.end_time}
                  onChange={handleChange}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: <ScheduleIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  md: 4
                }}>
                <TextField
                  name="session_number"
                  label="Número da Sessão"
                  type="number"
                  value={formData.session_number}
                  onChange={handleChange}
                  fullWidth
                  placeholder="Automático"
                  helperText="Deixe em branco para o sistema gerar o próximo número sequencial."
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* 2. Classificação */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
            <SectionHeader title="Classificação" icon={<ClassIcon />} color="info" />
            <Grid container spacing={3}>
              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}>
                <FormControl fullWidth required>
                  <InputLabel>Tipo de Sessão</InputLabel>
                  <Select
                    name="type"
                    value={formData.type}
                    label="Tipo de Sessão"
                    onChange={handleSelectChange}
                  >
                    {Object.values(SessionTypeEnum).map((type) => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}>
                <FormControl fullWidth required disabled={!formData.type}>
                  <InputLabel>Subtipo</InputLabel>
                  <Select
                    name="subtype"
                    value={formData.subtype}
                    label="Subtipo"
                    onChange={handleSelectChange}
                  >
                    {formData.type && subtypesByType[formData.type]?.map((subtype) => (
                      <MenuItem key={subtype} value={subtype}>{subtype}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Campos Condicionais */}
              {formData.type === 'Ordinária' && formData.subtype === 'Regular' && (
                <Grid
                  size={{
                    xs: 12,
                    md: 6
                  }}>
                  <FormControl fullWidth>
                    <InputLabel>Trabalho no Grau</InputLabel>
                    <Select
                      value={degree}
                      label="Trabalho no Grau"
                      onChange={handleDegreeChange}
                    >
                      <MenuItem value="Aprendiz">Aprendiz</MenuItem>
                      <MenuItem value="Companheiro">Companheiro</MenuItem>
                      <MenuItem value="Mestre">Mestre</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}

              {formData.type === 'Ordinária' && formData.subtype === 'Filiação e Regularização' && (
                <Grid
                  size={{
                    xs: 12,
                    md: 6
                  }}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <FormLabel component="legend" sx={{ mb: 1, fontSize: '0.9rem' }}>Tipo de Ingresso</FormLabel>
                    <FormGroup row>
                      <FormControlLabel control={<Checkbox checked={ingressType.includes('Filiação')} onChange={handleIngressTypeChange} name="Filiação" />} label="Filiação" />
                      <FormControlLabel control={<Checkbox checked={ingressType.includes('Regularização')} onChange={handleIngressTypeChange} name="Regularização" />} label="Regularização" />
                    </FormGroup>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </Paper>

          {/* 3. Pauta e Expediente */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
            <SectionHeader title="Ordem do Dia e Expediente" icon={<DescriptionIcon />} color="warning" />
            <Grid container spacing={3}>
              <Grid
                size={{
                  xs: 12
                }}>
                <TextField
                  name="agenda"
                  label="Pauta / Ordem do Dia"
                  value={formData.agenda}
                  onChange={handleChange}
                  fullWidth
                  multiline
                  minRows={3}
                  placeholder="Liste os principais assuntos a serem tratados na Ordem do Dia..."
                  variant="outlined"
                />
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}>
                <TextField
                  name="received_expedients"
                  label="Expediente Recebido"
                  value={formData.received_expedients}
                  onChange={handleChange}
                  fullWidth
                  multiline
                  minRows={3}
                  placeholder="Correspondências recebidas..."
                  variant="outlined"
                />
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}>
                <TextField
                  name="sent_expedients"
                  label="Expediente Expedido"
                  value={formData.sent_expedients}
                  onChange={handleChange}
                  fullWidth
                  multiline
                  minRows={3}
                  placeholder="Correspondências enviadas..."
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </Paper>

          {/* 4. Responsáveis */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
            <SectionHeader title="Responsáveis" icon={<PersonIcon />} color="success" />
            <Grid container spacing={3}>
              <Grid
                size={{
                  xs: 12,
                  md: 8
                }}>
                <Autocomplete
                  options={members}
                  getOptionLabel={(option) => option.full_name}
                  value={members.find(m => m.id.toString() === formData.study_director_id.toString()) || null}
                  onChange={(_, newValue) => {
                    setFormData(prev => ({
                      ...prev,
                      study_director_id: newValue ? newValue.id.toString() : ''
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Diretor de Estudos (Responsável pelo Tempo de Estudos)"
                      placeholder="Digite para buscar um irmão..."
                      fullWidth
                      variant="outlined"
                    />
                  )}
                  noOptionsText="Nenhum membro encontrado"
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Actions */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
            <Button
              variant="outlined"
              onClick={() => navigate(basePath)}
              size="large"
              sx={{ px: 4, borderRadius: 2 }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              sx={{ px: 4, borderRadius: 2, boxShadow: 2 }}
            >
              {loading ? 'Salvando...' : 'Salvar Sessão'}
            </Button>
          </Box>

        </Stack>
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

export default SessionForm;
