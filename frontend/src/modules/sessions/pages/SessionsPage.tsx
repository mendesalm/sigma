import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, CircularProgress, Alert, Stack, TextField, FormControl, InputLabel, Select, MenuItem, Container, useTheme, alpha, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar } from '@mui/material';
import { Add, Search, Event, PlayArrow, CheckCircle, Cancel, Visibility, Description } from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';
import { getSessions, generateAnnualCalendar, confirmMonthSessions } from '@/shared/services/api';

interface Session {
  id: number;
  title: string;
  session_date: string;
  status: string;
  type?: string;
  subtype?: string;
}

import SessionCalendarView from '@/modules/sessions/pages/components/SessionCalendarView';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';

import AttendanceStats from '@/modules/sessions/pages/components/AttendanceStats';
import { ViewList, CalendarMonth, BarChart } from '@mui/icons-material';

const SessionsPage: React.FC = () => {
  const theme = useTheme();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'stats'>('list');

  // Calendar Actions States
  const [openGenerateCalendar, setOpenGenerateCalendar] = useState(false);
  const [generateYear, setGenerateYear] = useState(new Date().getFullYear());
  const [generatingCalendar, setGeneratingCalendar] = useState(false);
  
  const [openConfirmMonth, setOpenConfirmMonth] = useState(false);
  const [confirmMonthStr, setConfirmMonthStr] = useState('');
  const [confirmingMonth, setConfirmingMonth] = useState(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleViewChange = (
    _event: React.MouseEvent<HTMLElement>,
    newView: 'list' | 'calendar' | 'stats',
  ) => {
    if (newView !== null) {
      setViewMode(newView);
    }
  };

  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error' | 'info'}>({ open: false, message: '', severity: 'success' });

  const handleGenerateCalendar = async () => {
    setGeneratingCalendar(true);
    try {
      await generateAnnualCalendar(generateYear);
      setSnackbar({ open: true, message: `Calendário para ${generateYear} gerado com sucesso!`, severity: 'success' });
      setOpenGenerateCalendar(false);
      fetchSessions();
    } catch (err: any) {
      console.error(err);
      setSnackbar({ open: true, message: err.response?.data?.detail || 'Erro ao gerar calendário.', severity: 'error' });
    } finally {
      setGeneratingCalendar(false);
    }
  };

  const handleConfirmMonth = async () => {
    if (!confirmMonthStr) {
      setSnackbar({ open: true, message: 'Selecione um mês', severity: 'error' });
      return;
    }
    
    setConfirmingMonth(true);
    try {
      // confirmMonthStr comes as 'YYYY-MM'. Let's convert to startDate and endDate
      const year = parseInt(confirmMonthStr.split('-')[0]);
      const month = parseInt(confirmMonthStr.split('-')[1]) - 1; // 0-indexed
      
      // first day of the month
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      // last day of the month
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
      
      const response = await confirmMonthSessions(startDate, endDate);
      setSnackbar({ open: true, message: `Mês confirmado! ${response.data.confirmed_count} sessões agendadas.`, severity: 'success' });
      setOpenConfirmMonth(false);
      fetchSessions();
    } catch (err: any) {
      console.error(err);
      setSnackbar({ open: true, message: err.response?.data?.detail || 'Erro ao confirmar mês.', severity: 'error' });
    } finally {
      setConfirmingMonth(false);
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
            variant="outlined"
            onClick={() => setOpenGenerateCalendar(true)}
            startIcon={<Event />}
            sx={{
              fontWeight: 'bold',
              textTransform: 'none',
              borderRadius: '8px',
            }}
          >
            Gerar Calendário
          </Button>
          <Button
            variant="outlined"
            color="success"
            onClick={() => setOpenConfirmMonth(true)}
            startIcon={<CheckCircle />}
            sx={{
              fontWeight: 'bold',
              textTransform: 'none',
              borderRadius: '8px',
            }}
          >
            Confirmar Mês
          </Button>

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
                                      session.status === 'SUPRIMIDA' ? <Cancel sx={{ fontSize: '16px !important' }} /> :
                                        session.status === 'PREVISTA' ? <Event sx={{ fontSize: '16px !important' }} /> :
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
                                        session.status === 'SUPRIMIDA' ? theme.palette.error.dark :
                                          session.status === 'PREVISTA' ? theme.palette.grey[400] :
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

      {/* Modal Gerar Calendário */}
      <Dialog open={openGenerateCalendar} onClose={() => setOpenGenerateCalendar(false)}>
        <DialogTitle>Gerar Calendário Anual</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Esta ação irá criar sessões PREVISTAS para todo o ano, com base nas configurações da Loja (dia da sessão, feriados, recessos).
          </Typography>
          <TextField
            label="Ano"
            type="number"
            value={generateYear}
            onChange={(e) => setGenerateYear(parseInt(e.target.value))}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenGenerateCalendar(false)}>Cancelar</Button>
          <Button onClick={handleGenerateCalendar} variant="contained" disabled={generatingCalendar}>
            {generatingCalendar ? <CircularProgress size={24} /> : 'Gerar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Confirmar Mês */}
      <Dialog open={openConfirmMonth} onClose={() => setOpenConfirmMonth(false)}>
        <DialogTitle>Confirmar Mês de Sessões</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Selecione o mês para confirmar as sessões PREVISTAS, convertendo-as em AGENDADAS e criando a pauta básica (Balaústre).
          </Typography>
          <TextField
            label="Mês/Ano"
            type="month"
            InputLabelProps={{ shrink: true }}
            value={confirmMonthStr}
            onChange={(e) => setConfirmMonthStr(e.target.value)}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmMonth(false)}>Cancelar</Button>
          <Button onClick={handleConfirmMonth} variant="contained" color="success" disabled={confirmingMonth || !confirmMonthStr}>
            {confirmingMonth ? <CircularProgress size={24} /> : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
};

export default SessionsPage;

