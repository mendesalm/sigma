import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Box, Typography, Paper, Tabs, Tab, CircularProgress, Alert, Button, Stack, Chip, Snackbar, Grid, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import AttendanceTab from './components/AttendanceTab';
import { getSessionDetails, startSession, endSession, cancelSession, generateBalaustre, generateEdital, uploadDocument, approveSessionMinutes, reopenSession } from '../../services/api';
import { PlayArrow, Stop, Cancel, Description, Add, QrCodeScanner, CheckCircle, LockOpen } from '@mui/icons-material';
import SessionCheckIn from '../../components/SessionCheckIn';

interface Session {
  id: number;
  title: string;
  session_date: string;
  start_time?: string;
  end_time?: string;
  status: string;
  type?: string;
  subtype?: string;
  agenda?: string;
  sent_expedients?: string;
  received_expedients?: string;
  study_director_id?: number;
  study_director?: {
    id: number;
    full_name: string;
  };
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

  // Upload State
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [openCheckInDialog, setOpenCheckInDialog] = useState(false);

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

  const handleUploadDocument = async () => {
    if (!uploadFile || !uploadTitle) return;

    try {
      setActionLoading(true);
      const formData = new FormData();
      formData.append('title', uploadTitle);
      formData.append('file', uploadFile);
      formData.append('session_id', sessionId.toString());

      await uploadDocument(formData);
      setSnackbar({ open: true, message: 'Documento enviado com sucesso!', severity: 'success' });
      setOpenUploadDialog(false);
      setUploadTitle('');
      setUploadFile(null);
      fetchSessionDetails(); // Refresh list
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: 'Falha ao enviar documento.', severity: 'error' });
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
            <Typography variant="h6" color="text.secondary" gutterBottom>Loja: {session.lodge?.lodge_name || 'Loja não identificada'}</Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body1">Data: {new Date(session.session_date + 'T00:00:00').toLocaleDateString()}</Typography>
              <Chip 
                label={session.status} 
                color={session.status === 'EM_ANDAMENTO' ? 'success' : session.status === 'REALIZADA' ? 'primary' : session.status === 'ENCERRADA' ? 'default' : 'default'} 
                sx={session.status === 'ENCERRADA' ? { bgcolor: 'text.secondary', color: 'white' } : {}}
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
                  <Button 
                    variant="contained" 
                    color="primary"
                    startIcon={<Description />}
                    component={Link}
                    to={`balaustre`}
                    disabled={actionLoading}
                  >
                    Prévia Balaústre
                  </Button>
                </>
              )}
              {session.status === 'EM_ANDAMENTO' && (
                <>
                  <Button 
                    variant="contained" 
                    color="secondary" 
                    startIcon={<QrCodeScanner />}
                    onClick={() => setOpenCheckInDialog(true)}
                    sx={{ mr: 1 }}
                  >
                    Check-in
                  </Button>
                  <Button 
                    variant="contained" 
                    color="warning" 
                    startIcon={<Stop />}
                    onClick={() => handleAction(() => endSession(sessionId), 'Sessão finalizada!')}
                    disabled={actionLoading}
                  >
                    Finalizar
                  </Button>
                  <Button 
                    variant="contained" 
                    color="primary"
                    startIcon={<Description />}
                    component={Link}
                    to={`balaustre`}
                    disabled={actionLoading}
                  >
                    Prévia Balaústre
                  </Button>
                </>
              )}
              {session.status === 'REALIZADA' && (
                <>
                  <Button 
                    variant="outlined" 
                    startIcon={<Description />}
                    onClick={() => handleAction(() => generateBalaustre(sessionId), 'Geração de Balaústre iniciada!')}
                    disabled={actionLoading}
                  >
                    Gerar Balaústre (PDF Direto)
                  </Button>
                  <Button 
                    variant="contained" 
                    color="primary"
                    startIcon={<Description />}
                    component={Link}
                    to={`balaustre`}
                    disabled={actionLoading}
                  >
                    Editar Balaústre
                  </Button>
                  <Button 
                    variant="contained" 
                    color="success"
                    startIcon={<CheckCircle />}
                    onClick={() => handleAction(() => approveSessionMinutes(sessionId), 'Ata aprovada e sessão encerrada!')}
                    disabled={actionLoading}
                  >
                    Aprovar Ata
                  </Button>
                </>
              )}
              {session.status === 'ENCERRADA' && (
                <>
                  <Chip label="Sessão Encerrada" color="default" variant="outlined" />
                  <Button 
                    variant="outlined" 
                    color="warning"
                    startIcon={<LockOpen />}
                    onClick={() => handleAction(() => reopenSession(sessionId), 'Sessão reaberta!')}
                    disabled={actionLoading}
                  >
                    Reabrir Sessão
                  </Button>
                </>
              )}
              {session.status === 'CANCELADA' && (
                <Button 
                  variant="contained" 
                  color="error" 
                  startIcon={<Cancel />}
                  onClick={async () => {
                    if (window.confirm('Tem certeza que deseja excluir esta sessão? Esta ação não pode ser desfeita.')) {
                      try {
                        setActionLoading(true);
                        await import('../../services/api').then(m => m.deleteSession(sessionId));
                        setSnackbar({ open: true, message: 'Sessão excluída com sucesso!', severity: 'success' });
                        setTimeout(() => window.history.back(), 1500);
                      } catch (err) {
                        console.error(err);
                        setSnackbar({ open: true, message: 'Falha ao excluir sessão.', severity: 'error' });
                      } finally {
                        setActionLoading(false);
                      }
                    }
                  }}
                  disabled={actionLoading}
                >
                  Excluir
                </Button>
              )}
              {session.status !== 'CANCELADA' && session.status !== 'REALIZADA' && (
                <>
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    component={Link}
                    to={`edit`}
                    disabled={actionLoading}
                  >
                    Editar
                  </Button>
                  <Button 
                    variant="outlined" 
                    color="error" 
                    startIcon={<Cancel />}
                    onClick={() => handleAction(() => cancelSession(sessionId), 'Sessão cancelada!')}
                    disabled={actionLoading}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    variant="contained" 
                    color="error" 
                    startIcon={<Cancel />}
                    onClick={async () => {
                      if (window.confirm('Tem certeza que deseja excluir esta sessão? Esta ação não pode ser desfeita.')) {
                        try {
                          setActionLoading(true);
                          await import('../../services/api').then(m => m.deleteSession(sessionId));
                          setSnackbar({ open: true, message: 'Sessão excluída com sucesso!', severity: 'success' });
                          setTimeout(() => window.history.back(), 1500);
                        } catch (err) {
                          console.error(err);
                          setSnackbar({ open: true, message: 'Falha ao excluir sessão.', severity: 'error' });
                        } finally {
                          setActionLoading(false);
                        }
                      }
                    }}
                    disabled={actionLoading}
                  >
                    Excluir
                  </Button>
                </>
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
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Tipo de Sessão</Typography>
              <Typography variant="body1">{session.type || 'Não definido'}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Subtipo</Typography>
              <Typography variant="body1">{session.subtype || 'Não definido'}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Data</Typography>
              <Typography variant="body1">{new Date(session.session_date + 'T00:00:00').toLocaleDateString()}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Horário de Início</Typography>
              <Typography variant="body1">{session.start_time || '-'}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Horário de Término</Typography>
              <Typography variant="body1">{session.end_time || '-'}</Typography>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        <AttendanceTab sessionId={sessionId} />
      </TabPanel>
      <TabPanel value={tabValue} index={2}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" startIcon={<Add />} onClick={() => setOpenUploadDialog(true)}>
            Upload de Documento
          </Button>
        </Box>
        {session.documents && session.documents.length > 0 ? (
          <Stack spacing={2}>
            {session.documents.map((doc: any) => (
              <Paper key={doc.id} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle1">{doc.title}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Tipo: {doc.document_type || 'Geral'} | Data: {new Date(doc.upload_date).toLocaleDateString()}
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

      {/* Upload Dialog */}
      <Dialog open={openUploadDialog} onClose={() => setOpenUploadDialog(false)}>
        <DialogTitle>Upload de Documento</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Título do Documento"
                fullWidth
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
              >
                Selecionar Arquivo
                <input
                  type="file"
                  hidden
                  onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                />
              </Button>
              {uploadFile && <Typography variant="caption" display="block" sx={{ mt: 1 }}>Arquivo: {uploadFile.name}</Typography>}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUploadDialog(false)}>Cancelar</Button>
          <Button 
            onClick={handleUploadDocument} 
            variant="contained" 
            disabled={!uploadFile || !uploadTitle || actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : 'Enviar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Check-in Dialog */}
      <Dialog open={openCheckInDialog} onClose={() => setOpenCheckInDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Check-in de Presença</DialogTitle>
        <DialogContent>
          <SessionCheckIn 
            sessionId={sessionId} 
            onSuccess={() => {
              setOpenCheckInDialog(false);
              // Refresh attendance if needed, or just close
              // fetchSessionDetails(); 
            }} 
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCheckInDialog(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>

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
