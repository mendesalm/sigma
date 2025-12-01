import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, CircularProgress, Alert } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { getSessions } from '../../services/api';

interface Session {
  id: number;
  title: string;
  session_date: string;
  status: string;
  type?: string;
  subtype?: string;
}

const SessionsPage: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        const response = await getSessions();
        setSessions(response.data);
        setError(null);
      } catch (err) {
        setError('Falha ao carregar as sessões.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Sessões Maçônicas
        </Typography>
        <Button
          variant="contained"
          component={Link}
          to={`${basePath}/new`}
        >
          Nova Sessão
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Título</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Subtipo</TableCell>
              <TableCell>Data</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sessions.map((session) => (
              <TableRow
                key={session.id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {session.title}
                </TableCell>
                <TableCell>{session.type || '-'}</TableCell>
                <TableCell>{session.subtype || '-'}</TableCell>
                <TableCell>{new Date(session.session_date + 'T00:00:00').toLocaleDateString()}</TableCell>
                <TableCell>{session.status}</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    color="primary"
                    component={Link}
                    to={`${basePath}/${session.id}`}
                  >
                    Detalhes
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default SessionsPage;

