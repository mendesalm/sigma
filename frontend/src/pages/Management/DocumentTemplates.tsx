import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Tabs, Tab, Button, CircularProgress, Alert, Snackbar } from '@mui/material';
import Editor from '@monaco-editor/react';
import api from '../../services/api';

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

const DocumentTemplates: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balaustreContent, setBalaustreContent] = useState('');
  const [editalContent, setEditalContent] = useState('');
  const [invitationContent, setInvitationContent] = useState('');
  const [congratulationContent, setCongratulationContent] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const types = [
          { type: 'BALAUSTRE', setter: setBalaustreContent },
          { type: 'EDITAL', setter: setEditalContent },
          { type: 'CONVITE', setter: setInvitationContent },
          { type: 'CONGRATULACAO', setter: setCongratulationContent }
      ];

      await Promise.allSettled(types.map(async ({ type, setter }) => {
          try {
              const res = await api.get(`/templates/${type}`);
              setter(res.data.content);
          } catch (e) {
              console.error(`Failed to fetch ${type} template`, e);
          }
      }));
      
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Falha ao carregar templates.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getTabInfo = () => {
      switch (tabValue) {
          case 0: return { type: 'BALAUSTRE', content: balaustreContent };
          case 1: return { type: 'EDITAL', content: editalContent };
          case 2: return { type: 'CONVITE', content: invitationContent };
          case 3: return { type: 'CONGRATULACAO', content: congratulationContent };
          default: return { type: 'BALAUSTRE', content: balaustreContent };
      }
  };

  const handlePreview = async () => {
    try {
      setSaving(true);
      const { type, content } = getTabInfo();

      const response = await api.post('/templates/preview', {
        type,
        content
      }, {
        responseType: 'blob'
      });

      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL, '_blank');

    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: 'Erro ao gerar pré-visualização.', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { type, content } = getTabInfo();

      await api.post('/templates/', {
        type,
        content
      });

      setSnackbar({ open: true, message: 'Template salvo com sucesso!', severity: 'success' });
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: 'Erro ao salvar template.', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) return <CircularProgress />;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Modelos de Documentos
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Edite os templates HTML utilizados para gerar os documentos do sistema. Cuidado ao alterar as variáveis entre chaves duplas (ex: {'{{ lodge_name }}'}).
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="document templates tabs">
            <Tab label="Balaústre (Ata)" />
            <Tab label="Edital de Convocação" />
            <Tab label="Convite" />
            <Tab label="Cartão de Congratulações" />
          </Tabs>
        </Box>
        
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button 
                variant="outlined" 
                color="secondary" 
                onClick={handlePreview}
                disabled={saving}
            >
                Pré-visualizar PDF
            </Button>
            <Button 
                variant="contained" 
                color="primary" 
                onClick={handleSave}
                disabled={saving}
            >
                {saving ? <CircularProgress size={24} color="inherit" /> : 'Salvar Alterações'}
            </Button>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Editor
            height="70vh"
            defaultLanguage="html"
            value={balaustreContent}
            onChange={(value) => setBalaustreContent(value || '')}
            theme="vs-dark"
            options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: 'on'
            }}
          />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <Editor
            height="70vh"
            defaultLanguage="html"
            value={editalContent}
            onChange={(value) => setEditalContent(value || '')}
            theme="vs-dark"
            options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: 'on'
            }}
          />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <Editor
            height="70vh"
            defaultLanguage="html"
            value={invitationContent}
            onChange={(value) => setInvitationContent(value || '')}
            theme="vs-dark"
            options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: 'on'
            }}
          />
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          <Editor
            height="70vh"
            defaultLanguage="html"
            value={congratulationContent}
            onChange={(value) => setCongratulationContent(value || '')}
            theme="vs-dark"
            options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: 'on'
            }}
          />
        </TabPanel>
      </Paper>

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

export default DocumentTemplates;
