import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Paper, Tabs, Tab, CircularProgress, Alert, Button, Stack, Chip, Snackbar } from '@mui/material';
import AttendanceTab from './components/AttendanceTab';
import { getSessionDetails, startSession, endSession, cancelSession, generateBalaustre, generateEdital } from '../../services/api';
import { PlayArrow, Stop, Cancel, Description } from '@mui/icons-material';

interface Session {
  id: number;
  title: string;
  session_date: string;
  status: string;
  lodge: {
    id: number;
    lodge_name: string;
  };
  documents: any[];
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const SessionDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const sessionId = parseInt(id || '0', 10);
  
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const fetchSessionDetails = async () => {
    try {
      setLoading(true);
      const response = await getSessionDetails(sessionId);
      setSession(response.data);
      setError(null);
    } catch (err) {
      setError('Falha ao carregar os detalhes da sessão.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionId) {
      fetchSessionDetails();
    }
  }, [sessionId]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAction = async (action: () => Promise<any>, successMessage: string) => {
    try {
      setActionLoading(true);
      await action();
      setSnackbar({ open: true, message: successMessage, severity: 'success' });
      fetchSessionDetails(); // Refresh data
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: 'Falha ao realizar ação.', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return <CircularProgress />;
  }
  
  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!session) {
    return <Typography>Sessão não encontrada.</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h4" gutterBottom>{session.title}</Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>Loja: {session.lodge.lodge_name}</Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body1">Data: {new Date(session.session_date).toLocaleDateString()}</Typography>
              <Chip 
                label={session.status} 
                color={session.status === 'EM_ANDAMENTO' ? 'success' : session.status === 'REALIZADA' ? 'primary' : 'default'} 
              />
            </Stack>
          </Box>
          <Box>
            <Stack direction="row" spacing={1}>
              {session.status === 'AGENDADA' && (
                <>
                  <Button 
                    variant="contained" 
                    color="success" 
                    startIcon={<PlayArrow />}
                    onClick={() => handleAction(() => startSession(sessionId), 'Sessão iniciada!')}
                    disabled={actionLoading}
                  >
                    Iniciar
                  </Button>
                  <Button 
                    variant="outlined" 
                    startIcon={<Description />}
                    onClick={() => handleAction(() => generateEdital(sessionId), 'Geração de Edital iniciada!')}
                    disabled={actionLoading}
                  >
                    Gerar Edital
                  </Button>
                </>
              )}
              {session.status === 'EM_ANDAMENTO' && (
                <Button 
                  variant="contained" 
                  color="warning" 
                  startIcon={<Stop />}
                  onClick={() => handleAction(() => endSession(sessionId), 'Sessão finalizada!')}
                  disabled={actionLoading}
                >
                  Finalizar
                </Button>
              )}
              {session.status === 'REALIZADA' && (
                <Button 
                  variant="outlined" 
                  startIcon={<Description />}
                  onClick={() => handleAction(() => generateBalaustre(sessionId), 'Geração de Balaústre iniciada!')}
                  disabled={actionLoading}
                >
                  Gerar Balaústre
                </Button>
              )}
              {session.status !== 'CANCELADA' && session.status !== 'REALIZADA' && (
                <Button 
                  variant="outlined" 
                  color="error" 
                  startIcon={<Cancel />}
                  onClick={() => handleAction(() => cancelSession(sessionId), 'Sessão cancelada!')}
                  disabled={actionLoading}
                >
                  Cancelar
                </Button>
              )}
            </Stack>
          </Box>
        </Box>
      </Paper>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="session details tabs">
          <Tab label="Informações Gerais" />
          <Tab label="Participantes" />
          <Tab label="Documentos" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Typography>Informações detalhadas sobre a sessão serão exibidas aqui.</Typography>
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        <AttendanceTab sessionId={sessionId} />
      </TabPanel>
      <TabPanel value={tabValue} index={2}>
        {session.documents && session.documents.length > 0 ? (
          <Stack spacing={2}>
            {session.documents.map((doc: any) => (
              <Paper key={doc.id} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle1">{doc.title}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Tipo: {doc.document_type} | Data: {new Date(doc.upload_date).toLocaleDateString()}
                  </Typography>
                </Box>
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={async () => {
                    try {
                      const response = await import('../../services/api').then(m => m.downloadDocument(doc.id));
                      const url = window.URL.createObjectURL(new Blob([response.data]));
                      const link = document.createElement('a');
                      link.href = url;
                      link.setAttribute('download', doc.file_name);
                      document.body.appendChild(link);
                      link.click();
                      link.remove();
                    } catch (error) {
                      console.error('Download failed', error);
                      setSnackbar({ open: true, message: 'Falha ao baixar documento.', severity: 'error' });
                    }
                  }}
                >
                  Baixar
                </Button>
              </Paper>
            ))}
          </Stack>
        ) : (
          <Typography color="text.secondary">Nenhum documento gerado para esta sessão.</Typography>
        )}
      </TabPanel>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SessionDetailsPage;
