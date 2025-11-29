import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Chip,
  List,
  ListItem,
  ListItemText,
  useTheme,
  Checkbox,
  FormControlLabel,
  FormGroup,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import { 
  Event as EventIcon,
  Notifications,
  Cake,
  Group,
  Close as CloseIcon
} from '@mui/icons-material';
import { getDashboardStats, getCalendarEvents, DashboardStats, CalendarEvent } from '../../services/dashboardService';

const EVENT_COLORS: Record<string, string> = {
  exaltacao: '#8b5cf6', // Purple
  aniversario: '#f43f5e', // Pink/Red
  elevacao: '#6366f1', // Indigo
  iniciacao: '#22c55e', // Green
  sessao: '#0ea5e9',    // Blue
  evento: '#f59e0b',    // Amber
  aniversario_familiar: '#ec4899', // Pink-500
};

const LodgeDashboard: React.FC = () => {
  const theme = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const events = await getCalendarEvents(currentDate.getMonth() + 1, currentDate.getFullYear());
        setCalendarEvents(events);
      } catch (error) {
        console.error("Error fetching calendar events:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayClick = (day: number) => {
    setSelectedDay(day);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedDay(null);
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const renderCalendarDays = () => {
    const days = [];
    // Empty cells for previous month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<Box key={`empty-${i}`} sx={{ height: '100%', border: '1px solid rgba(255,255,255,0.1)' }} />);
    }
    // Days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const events = calendarEvents.filter(e => e.date === day);
      days.push(
        <Box 
          key={day} 
          onClick={() => handleDayClick(day)}
          sx={{ 
            height: '100%', 
            border: '1px solid rgba(255,255,255,0.1)', 
            p: 0.5,
            position: 'relative',
            backgroundColor: 'transparent',
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.03)', cursor: 'pointer' },
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <Typography variant="caption" sx={{ position: 'absolute', top: 2, right: 4, color: 'text.secondary', fontSize: '0.7rem' }}>
            {day.toString().padStart(2, '0')}
          </Typography>
          <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 0.2, flexGrow: 1, overflowY: 'auto', overflowX: 'hidden' }}>
            {events.map((event, idx) => (
              <Chip
                key={idx}
                label={event.title}
                size="small"
                sx={{
                  height: 14,
                  fontSize: '0.55rem',
                  backgroundColor: EVENT_COLORS[event.type] || theme.palette.primary.main,
                  color: '#fff',
                  width: '100%',
                  justifyContent: 'flex-start',
                  px: 0.2,
                  '& .MuiChip-label': { 
                    paddingLeft: 0.5, 
                    paddingRight: 0.5,
                    display: 'block',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    textAlign: 'left',
                    width: '100%'
                  }
                }}
              />
            ))}
          </Box>
        </Box>
      );
    }
    return days;
  };

  if (loading && !stats) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  const statCards = [
    { title: 'TOTAL DE MEMBROS ATIVOS', value: stats?.total_members || 0, icon: <Group fontSize="large" />, color: '#0ea5e9' },
    { title: 'PRÓXIMOS EVENTOS', value: stats?.next_events.length || 0, icon: <EventIcon fontSize="large" />, color: '#8b5cf6' },
    { title: 'PRÓXIMOS ANIVERSARIANTES', value: stats?.upcoming_birthdays.length || 0, icon: <Cake fontSize="large" />, color: '#f59e0b' },
    { title: 'AVISOS', value: stats?.active_notices_count || 0, icon: <Notifications fontSize="large" />, color: '#ef4444' },
  ];

  const selectedEvents = selectedDay ? calendarEvents.filter(e => e.date === selectedDay) : [];
  const selectedDateObj = selectedDay ? new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay) : null;

  return (
    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top Stats Row */}
      <Grid container spacing={2} sx={{ mb: 2, flexShrink: 0 }}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ bgcolor: '#1e293b', color: '#fff', height: '100%', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
              <CardContent sx={{ textAlign: 'center', py: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600, letterSpacing: 0.5, fontSize: '0.7rem' }}>
                  {stat.title}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, mb: 0.5 }}>
                  {stat.value}
                </Typography>
                {stat.title === 'AVISOS' && stat.value === 0 && (
                   <Typography variant="caption" sx={{ color: theme.palette.primary.main, cursor: 'pointer', fontSize: '0.7rem' }}>Ver todos</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2} sx={{ flexGrow: 1, overflow: 'hidden' }}>
        {/* Left Column */}
        <Grid item xs={12} md={3}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%', overflowY: 'auto' }}>
            {/* Next Session */}
            <Card sx={{ bgcolor: '#1e293b', color: '#fff', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
              <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="subtitle1" sx={{ color: theme.palette.primary.main, fontWeight: 700, mb: 1 }}>
                  Próxima Sessão
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                  {stats?.next_session ? (
                    <>
                      {new Date(stats.next_session.session_date).toLocaleDateString('pt-BR')} - {stats.next_session.title}
                      {stats.next_session.start_time && ` às ${stats.next_session.start_time}`}
                    </>
                  ) : (
                    'Nenhuma sessão agendada.'
                  )}
                </Typography>
              </CardContent>
            </Card>

            {/* Classifieds */}
            <Card sx={{ bgcolor: '#1e293b', color: '#fff', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
              <CardContent sx={{ textAlign: 'center', py: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                   <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Classificados</Typography>
                </Box>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 0.5, fontSize: '0.85rem' }}>
                  Total de Anúncios Publicados
                </Typography>
                <Typography variant="h4" sx={{ color: '#22c55e', fontWeight: 700 }}>
                  {stats?.classifieds_count || 0}
                </Typography>
              </CardContent>
            </Card>

            {/* Dining Scale */}
            <Card sx={{ bgcolor: '#1e293b', color: '#fff', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
              <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                  Próximos na Escala do Jantar
                </Typography>
                <List dense disablePadding>
                  {stats?.dining_scale && stats.dining_scale.length > 0 ? (
                    stats.dining_scale.map((item, idx) => (
                      <ListItem key={idx} sx={{ 
                        bgcolor: 'rgba(255,255,255,0.03)', 
                        mb: 0.5, 
                        borderRadius: 1,
                        borderLeft: `3px solid ${theme.palette.warning.main}`,
                        py: 0.5
                      }}>
                        <Typography variant="caption" sx={{ color: theme.palette.warning.main, fontWeight: 700, mr: 1 }}>
                          {item.position}*
                        </Typography>
                        <ListItemText 
                          primary={item.name} 
                          secondary={new Date(item.date).toLocaleDateString('pt-BR')}
                          primaryTypographyProps={{ fontSize: '0.75rem', fontWeight: 500 }} 
                          secondaryTypographyProps={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)' }}
                        />
                      </ListItem>
                    ))
                  ) : (
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Nenhum registro encontrado.</Typography>
                  )}
                </List>
              </CardContent>
            </Card>
          </Box>
        </Grid>

        {/* Right Column - Calendar */}
        <Grid item xs={12} md={9} sx={{ height: '100%' }}>
          <Card sx={{ bgcolor: '#1e293b', color: '#fff', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 }, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              {/* Calendar Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexShrink: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                   <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Mostrar Aniversários:</Typography>
                   <FormGroup row>
                     <FormControlLabel control={<Checkbox defaultChecked size="small" sx={{ color: theme.palette.primary.main, p: 0.5 }} />} label={<Typography variant="caption" sx={{ fontSize: '0.7rem' }}>Ativo</Typography>} />
                     <FormControlLabel control={<Checkbox defaultChecked size="small" sx={{ color: theme.palette.primary.main, p: 0.5 }} />} label={<Typography variant="caption" sx={{ fontSize: '0.7rem' }}>Regular</Typography>} />
                     <FormControlLabel control={<Checkbox defaultChecked size="small" sx={{ color: theme.palette.primary.main, p: 0.5 }} />} label={<Typography variant="caption" sx={{ fontSize: '0.7rem' }}>Remido</Typography>} />
                   </FormGroup>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, bgcolor: 'rgba(0,0,0,0.2)', p: 0.5, borderRadius: 1, flexShrink: 0 }}>
                <Box>
                  <Button size="small" onClick={handleToday} sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem', minWidth: 'auto', px: 1 }}>Hoje</Button>
                  <Button size="small" onClick={handlePrevMonth} sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem', minWidth: 'auto', px: 1 }}>Anterior</Button>
                  <Button size="small" onClick={handleNextMonth} sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem', minWidth: 'auto', px: 1 }}>Próximo</Button>
                </Box>
                <Typography variant="subtitle2" sx={{ textTransform: 'capitalize', fontWeight: 600 }}>
                  {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </Typography>
                <Box width={100} /> {/* Spacer */}
              </Box>

              {/* Calendar Grid */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gridTemplateRows: '30px repeat(6, 1fr)', gap: '1px', bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)', flexGrow: 1, overflow: 'hidden' }}>
                {/* Weekdays */}
                {['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'].map(day => (
                  <Box key={day} sx={{ p: 0.5, textAlign: 'center', bgcolor: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'lowercase', fontSize: '0.7rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{day}</Typography>
                  </Box>
                ))}
                {/* Days */}
                {renderCalendarDays()}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Event Details Modal */}
      <Dialog 
        open={modalOpen} 
        onClose={handleCloseModal}
        PaperProps={{
          sx: {
            bgcolor: '#1e293b',
            color: '#fff',
            minWidth: 300,
            backgroundImage: 'none',
            border: '1px solid rgba(255,255,255,0.1)'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {selectedDateObj?.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Typography>
          <IconButton onClick={handleCloseModal} size="small" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          {selectedEvents.length > 0 ? (
            <List>
              {selectedEvents.map((event, idx) => (
                <ListItem key={idx} sx={{ px: 0 }}>
                  <Box sx={{ 
                    width: 10, 
                    height: 10, 
                    borderRadius: '50%', 
                    bgcolor: EVENT_COLORS[event.type] || theme.palette.primary.main,
                    mr: 2,
                    flexShrink: 0
                  }} />
                  <ListItemText 
                    primary={event.title}
                    secondary={event.type.replace('_', ' ').toUpperCase()}
                    primaryTypographyProps={{ color: '#fff', fontWeight: 500 }}
                    secondaryTypographyProps={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', py: 2, textAlign: 'center' }}>
              Nenhum evento registrado para este dia.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LodgeDashboard;
