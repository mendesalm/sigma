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
  SelectChangeEvent
} from '@mui/material';
import api from '../../services/api';
import { SessionTypeEnum, SessionSubtypeEnum, MemberResponse } from '../../types';

const SessionForm = () => {
  const [formData, setFormData] = useState({
    title: 'Sessão Ordinária no Grau de Aprendiz',
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
  const [members, setMembers] = useState<MemberResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  // Determine base path based on current location
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
        // Fetch members for the dropdown
        const membersResponse = await api.get('/members/');
        setMembers(membersResponse.data);

        if (id) {
          const response = await api.get(`/masonic-sessions/${id}`);
          const session = response.data;
          setFormData({
            title: session.title,
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
          // New session: fetch lodge details for default time
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
      // Reset subtype if type changes
      if (name === 'type') {
        newData.subtype = '';
      }
      return newData;
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
    <Container maxWidth="md">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom color="primary">
          {id ? 'Editar Sessão' : 'Nova Sessão'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {id ? 'Atualize os dados da sessão.' : 'Agende uma nova sessão maçônica.'}
        </Typography>
      </Box>

      <Paper sx={{ p: 4 }}>
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                name="title"
                label="Título / Grau"
                value={formData.title}
                onChange={handleChange}
                fullWidth
                required
                placeholder="Ex: Sessão Magna de Iniciação"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Tipo de Sessão</InputLabel>
                <Select
                  name="type"
                  value={formData.type}
                  label="Tipo de Sessão"
                  onChange={handleSelectChange}
                >
                  {Object.values(SessionTypeEnum).map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required disabled={!formData.type}>
                <InputLabel>Subtipo</InputLabel>
                <Select
                  name="subtype"
                  value={formData.subtype}
                  label="Subtipo"
                  onChange={handleSelectChange}
                >
                  {formData.type && subtypesByType[formData.type]?.map((subtype) => (
                    <MenuItem key={subtype} value={subtype}>
                      {subtype}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                name="session_date"
                label="Data"
                type="date"
                value={formData.session_date}
                onChange={handleChange}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                name="start_time"
                label="Horário de Início"
                type="time"
                value={formData.start_time}
                onChange={handleChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                name="end_time"
                label="Horário de Término (Previsto)"
                type="time"
                value={formData.end_time}
                onChange={handleChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                name="agenda"
                label="Pauta(s) para Ordem do Dia"
                value={formData.agenda}
                onChange={handleChange}
                fullWidth
                multiline
                rows={4}
                placeholder="Descreva os assuntos a serem tratados..."
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                name="sent_expedients"
                label="Expediente(s) Expedido(s)"
                value={formData.sent_expedients}
                onChange={handleChange}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                name="received_expedients"
                label="Expediente(s) Recebido(s)"
                value={formData.received_expedients}
                onChange={handleChange}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Responsável pelo Tempo de Estudos</InputLabel>
                <Select
                  name="study_director_id"
                  value={formData.study_director_id}
                  label="Responsável pelo Tempo de Estudos"
                  onChange={handleSelectChange}
                >
                  <MenuItem value="">
                    <em>Nenhum</em>
                  </MenuItem>
                  {members.map((member) => (
                    <MenuItem key={member.id} value={member.id}>
                      {member.full_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

          </Grid>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="outlined" onClick={() => navigate(basePath)}>
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

export default SessionForm;
