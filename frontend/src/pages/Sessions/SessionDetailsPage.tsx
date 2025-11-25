import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Paper, Tabs, Tab, CircularProgress, Alert } from '@mui/material';
import AttendanceTab from './components/AttendanceTab';
import { getSessionDetails } from '../../services/api';

interface Session {
  id: number;
  title: string;
  session_date: string;
  status: string;
  lodge: {
    id: number;
    lodge_name: string;
  };
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

  useEffect(() => {
    if (sessionId) {
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
      fetchSessionDetails();
    }
  }, [sessionId]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h4" gutterBottom>{session.title}</Typography>
        <Typography variant="h6">Loja: {session.lodge.lodge_name}</Typography>
        <Typography variant="body1">Data: {new Date(session.session_date).toLocaleDateString()}</Typography>
        <Typography variant="body1">Status: {session.status}</Typography>
      </Paper>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="session details tabs">
          <Tab label="Informações Gerais" />
          <Tab label="Participantes" />
          <Tab label="Balaústre" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Typography>Informações gerais sobre a sessão.</Typography>
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        <AttendanceTab sessionId={sessionId} />
      </TabPanel>
      <TabPanel value={tabValue} index={2}>
        <Typography>A visualização e edição do balaústre será implementada aqui.</Typography>
      </TabPanel>
    </Box>
  );
};

export default SessionDetailsPage;
