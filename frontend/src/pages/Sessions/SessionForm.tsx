import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  Snackbar
} from '@mui/material';
import api from '../../services/api';

const SessionForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    session_date: '',
    start_time: '',
    end_time: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    if (id) {
      const fetchSession = async () => {
        try {
          const response = await api.get(`/masonic-sessions/${id}`);
          const session = response.data;
          setFormData({
            title: session.title,
            session_date: session.session_date,
            start_time: session.start_time || '',
            end_time: session.end_time || '',
          });
        } catch (error) {
          console.error('Failed to fetch session', error);
          setError('Falha ao carregar dados da sessão.');
        }
      };
      fetchSession();
    }
  }, [id]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
    };

    try {
      if (id) {
        await api.put(`/masonic-sessions/${id}`, payload);
        setSnackbar({ open: true, message: 'Sessão atualizada com sucesso!', severity: 'success' });
      } else {
        await api.post('/masonic-sessions/', payload);
        setSnackbar({ open: true, message: 'Sessão agendada com sucesso!', severity: 'success' });
      }
      setTimeout(() => navigate('/dashboard/sessions'), 1500);
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
          </Grid>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="outlined" onClick={() => navigate('/dashboard/sessions')}>
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
