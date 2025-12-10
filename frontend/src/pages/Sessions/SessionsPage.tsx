import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, CircularProgress, Alert, Stack, TextField, FormControl, InputLabel, Select, MenuItem, Container, useTheme, alpha, Chip, IconButton } from '@mui/material';
import { Add, Search, Event, PlayArrow, CheckCircle, Cancel, Visibility, Description } from '@mui/icons-material';
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

import SessionCalendarView from './components/SessionCalendarView';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';

import AttendanceStats from './components/AttendanceStats';
import { ViewList, CalendarMonth, BarChart } from '@mui/icons-material';

const SessionsPage: React.FC = () => {
  const theme = useTheme();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'stats'>('list');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter) params.session_status = statusFilter;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await getSessions(params);
      setSessions(response.data);
      setError(null);
    } catch (err) {
      setError('Falha ao carregar as sessões.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleViewChange = (
    _event: React.MouseEvent<HTMLElement>,
    newView: 'list' | 'calendar' | 'stats',
  ) => {
    if (newView !== null) {
      setViewMode(newView);
    }
  };

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: '800', color: 'primary.main', letterSpacing: '-0.5px' }}>
          Sessões Maçônicas
        </Typography>
        <Stack direction="row" spacing={2}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewChange}
              aria-label="view mode"
              size="small"
              sx={{ 
                backgroundColor: alpha(theme.palette.background.paper, 0.5),
                borderRadius: '8px'
              }}
            >
              <ToggleButton value="list" aria-label="list view">
                <ViewList />
              </ToggleButton>
              <ToggleButton value="calendar" aria-label="calendar view">
                <CalendarMonth />
              </ToggleButton>
              <ToggleButton value="stats" aria-label="stats view">
                <BarChart />
              </ToggleButton>
            </ToggleButtonGroup>

            <Button
              variant="contained"
              component={Link}
              to={`${basePath}/new`}
              startIcon={<Add />}
              sx={{ 
                fontWeight: 'bold',
                textTransform: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)',
                '&:hover': {
                  boxShadow: '0 6px 16px rgba(14, 165, 233, 0.4)',
                }
              }}
            >
              Nova Sessão
            </Button>
        </Stack>
      </Box>

      {viewMode === 'stats' ? (
        <AttendanceStats />
      ) : (
        <>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3, 
              mb: 4, 
              borderRadius: '16px', 
              backgroundColor: theme.palette.background.paper,
              backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
            }}
          >
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <TextField
                label="Data Início"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                size="small"
                sx={{ 
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                    }
                }}
              />
              <TextField
                label="Data Fim"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                size="small"
                sx={{ 
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                    }
                }}
              />
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={{ borderRadius: '12px' }}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="AGENDADA">Agendada</MenuItem>
                  <MenuItem value="EM_ANDAMENTO">Em Andamento</MenuItem>
                  <MenuItem value="REALIZADA">Realizada</MenuItem>
                  <MenuItem value="ENCERRADA">Encerrada</MenuItem>
                  <MenuItem value="CANCELADA">Cancelada</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            <Stack direction="row" spacing={2} sx={{ mt: 3, justifyContent: 'flex-end' }}>
              <Button 
                variant="outlined" 
                onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    setStatusFilter('');
                }}
                sx={{ 
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontWeight: 600,
                    minWidth: '120px'
                }}
              >
                Limpar
              </Button>
              <Button 
                variant="contained" 
                onClick={fetchSessions}
                startIcon={<Search />}
                sx={{ 
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontWeight: 600,
                    minWidth: '120px'
                }}
              >
                Filtrar
              </Button>
            </Stack>
          </Paper>

          {viewMode === 'calendar' ? (
            <SessionCalendarView sessions={sessions} basePath={basePath} />
          ) : (
            <Paper 
                elevation={3}
                sx={{ 
                backgroundColor: theme.palette.background.paper,
                backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))',
                borderRadius: '16px',
                p: 3,
                mt: 3
                }}
            >
                <TableContainer component={Box} sx={{ backgroundColor: 'transparent', overflowX: 'auto' }}>
                <Table sx={{ borderCollapse: 'separate', borderSpacing: '0 8px', minWidth: 650 }}>
                    <TableHead>
                    <TableRow>
                        <TableCell sx={{ color: 'text.secondary', fontWeight: '700', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: 'none', py: 1, pl: 3 }}>TÍTULO</TableCell>
                        <TableCell sx={{ color: 'text.secondary', fontWeight: '700', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: 'none', py: 1 }}>TIPO</TableCell>
                        <TableCell sx={{ color: 'text.secondary', fontWeight: '700', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: 'none', py: 1 }}>SUBTIPO</TableCell>
                        <TableCell sx={{ color: 'text.secondary', fontWeight: '700', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: 'none', py: 1 }}>DATA</TableCell>
                        <TableCell sx={{ color: 'text.secondary', fontWeight: '700', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: 'none', py: 1 }}>STATUS</TableCell>
                        <TableCell sx={{ color: 'text.secondary', fontWeight: '700', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: 'none', py: 1, textAlign: 'right', pr: 3 }}>AÇÕES</TableCell>
                    </TableRow>
                    </TableHead>
                    <TableBody>
                    {sessions.map((session) => (
                        <TableRow
                        key={session.id}
                        sx={{ 
                            backgroundColor: alpha(theme.palette.background.paper, 0.7),
                            '&:hover': { 
                            backgroundColor: alpha(theme.palette.background.paper, 0.85),
                            transform: 'translateY(-1px)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                            },
                            transition: 'all 0.2s ease',
                        }}
                        >
                        <TableCell 
                            component="th" 
                            scope="row"
                            sx={{ 
                                borderBottom: 'none', 
                                py: 1, 
                                pl: 3,
                                borderTopLeftRadius: '50px',
                                borderBottomLeftRadius: '50px',
                                fontWeight: 500,
                                color: 'text.primary'
                            }}
                        >
                            {session.title}
                        </TableCell>
                        <TableCell sx={{ borderBottom: 'none', py: 1, fontSize: '0.8rem', color: 'text.secondary' }}>{session.type || '-'}</TableCell>
                        <TableCell sx={{ borderBottom: 'none', py: 1, fontSize: '0.8rem', color: 'text.secondary' }}>{session.subtype || '-'}</TableCell>
                        <TableCell sx={{ borderBottom: 'none', py: 1, fontSize: '0.8rem', color: 'text.primary' }}>{new Date(session.session_date + 'T00:00:00').toLocaleDateString()}</TableCell>
                        <TableCell sx={{ borderBottom: 'none', py: 1 }}>
                            <Chip 
                                icon={
                                    session.status === 'REALIZADA' ? <CheckCircle sx={{ fontSize: '16px !important' }} /> :
                                    session.status === 'ENCERRADA' ? <CheckCircle sx={{ fontSize: '16px !important' }} /> :
                                    session.status === 'EM_ANDAMENTO' ? <PlayArrow sx={{ fontSize: '16px !important' }} /> :
                                    session.status === 'CANCELADA' ? <Cancel sx={{ fontSize: '16px !important' }} /> :
                                    <Event sx={{ fontSize: '16px !important' }} />
                                }
                                label={session.status} 
                                size="small" 
                                sx={{ 
                                height: '24px',
                                fontSize: '0.7rem',
                                backgroundColor: 
                                    session.status === 'REALIZADA' ? '#22c55e' : 
                                    session.status === 'ENCERRADA' ? '#64748b' : 
                                    session.status === 'EM_ANDAMENTO' ? theme.palette.info.main :
                                    session.status === 'CANCELADA' ? theme.palette.error.main :
                                    alpha(theme.palette.warning.main, 0.8),
                                color: '#fff',
                                fontWeight: 700,
                                borderRadius: '12px',
                                px: 1,
                                '& .MuiChip-icon': {
                                    color: 'inherit',
                                    marginLeft: '4px'
                                }
                                }} 
                            />
                        </TableCell>
                        <TableCell 
                            sx={{ 
                                borderBottom: 'none', 
                                py: 1, 
                                textAlign: 'right',
                                pr: 3,
                                borderTopRightRadius: '50px',
                                borderBottomRightRadius: '50px'
                            }}
                        >
                            <IconButton
                            component={Link}
                            to={`${basePath}/${session.id}/balaustre`}
                            size="small"
                            title="Editor de Balaústre"
                            sx={{ 
                                color: 'text.secondary',
                                mr: 1,
                                '&:hover': {
                                color: theme.palette.secondary.main,
                                backgroundColor: alpha(theme.palette.secondary.main, 0.1)
                                }
                            }}
                            >
                            <Description fontSize="small" />
                            </IconButton>
                            <IconButton
                            component={Link}
                            to={`${basePath}/${session.id}`}
                            size="small"
                            title="Detalhes da Sessão"
                            sx={{ 
                                color: 'text.secondary',
                                '&:hover': {
                                color: theme.palette.primary.main,
                                backgroundColor: alpha(theme.palette.primary.main, 0.1)
                                }
                            }}
                            >
                            <Visibility fontSize="small" />
                            </IconButton>
                        </TableCell>
                        </TableRow>
                    ))}
                    {sessions.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                Nenhuma sessão encontrada.
                            </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
                </TableContainer>
            </Paper>
          )}
        </>
      )}
    </Container>
  );
};

export default SessionsPage;

