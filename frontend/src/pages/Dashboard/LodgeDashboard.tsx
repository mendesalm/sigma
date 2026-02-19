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
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Avatar,
} from '@mui/material';
import { 
  Notifications,
  Close as CloseIcon,
  Castle,
  Restaurant,
  Campaign,
  ArrowBackIosNew,
  ArrowForwardIos,
  Storefront as StoreIcon, // For Classifieds
  Add as AddIcon,
  ChevronLeft,
  ChevronRight,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { getDashboardStats, getCalendarEvents, getClassifieds, getNotices, createNotice, updateNotice, deleteNotice, DashboardStats, CalendarEvent, Notice } from '../../services/dashboardService';
import { ClassifiedResponse } from '../../types';
import MinhaLojaWidget from './components/MinhaLojaWidget';
import { useAuth } from '../../hooks/useAuth'; // Import useAuth
import { TextField, DialogContentText } from '@mui/material'; // Import form components

// Define Colors
const COLORS = {
  background: '#0B0E14', // Darker background
  cardCheck: '#151B26', // slightly lighter card bg
  gold: '#D4AF37', // Metallic Gold
  goldLight: '#F3E5AB',
  goldDark: '#AA8C2C',
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  purple: '#8b5cf6',
  blue: '#0ea5e9',
  green: '#22c55e',
  red: '#ef4444',
  orange: '#f59e0b',
  pink: '#ec4899',
  fuchsia: '#d946ef',
};

const EVENT_COLORS: Record<string, string> = {
  exaltacao: COLORS.purple, 
  aniversario: COLORS.red, 
  elevacao: COLORS.blue, 
  iniciacao: COLORS.green, 
  sessao: COLORS.blue,    
  evento: COLORS.orange,    
  aniversario_familiar: COLORS.pink, 
  casamento: COLORS.fuchsia, 
};

const LodgeDashboard: React.FC = () => {
  const { user } = useAuth(); // Get user from auth context
  
  // Permission Logic
  const canManageLodge = 
    user?.user_type === 'super_admin' || 
    user?.user_type === 'webmaster' || 
    (user?.user_type === 'member' && ['Venerável Mestre', 'Secretário', 'Secretário Adjunto'].includes(user?.active_role_name));
  
  const canManageNotices = canManageLodge; // Same permission for now

  const [currentDate, setCurrentDate] = useState(new Date());
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters State
  const [filters, setFilters] = useState({
    sessao: true,
    aniversario: true,
    aniversario_familiar: true,
    casamento: true,
    maconico: true, 
  });

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Notice Modal State
  const [noticeModalOpen, setNoticeModalOpen] = useState(false);
  const [allNoticesModalOpen, setAllNoticesModalOpen] = useState(false); // Modal for all notices
  const [addNoticeModalOpen, setAddNoticeModalOpen] = useState(false); // Modal for adding notice
  const [selectedNotice, setSelectedNotice] = useState<{ title: string; content: string } | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]); // Store fetched notices
  
  // New Notice Form State
  const [newNoticeTitle, setNewNoticeTitle] = useState('');
  const [newNoticeContent, setNewNoticeContent] = useState('');
  const [newNoticeExpiration, setNewNoticeExpiration] = useState('');
  const [editingNoticeId, setEditingNoticeId] = useState<number | null>(null);

  // Members Modal State (New)
  const [membersModalOpen, setMembersModalOpen] = useState(false);

  // Classifieds State
  const [classifiedsModalOpen, setClassifiedsModalOpen] = useState(false);
  const [classifiedsList, setClassifiedsList] = useState<ClassifiedResponse[]>([]);
  const [classifiedsPage, setClassifiedsPage] = useState(0);
  const classifiedsPerPage = 4;

  const handleOpenClassifiedsModal = async () => {
      setClassifiedsModalOpen(true);
      try {
          const data = await getClassifieds();
          setClassifiedsList(data);
      } catch (error) {
          console.error("Error fetching classifieds:", error);
      }
  };

  const handlePrevPage = () => {
        setClassifiedsPage((prev) => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
        const maxPage = Math.ceil(classifiedsList.length / classifiedsPerPage) - 1;
        setClassifiedsPage((prev) => Math.min(maxPage, prev + 1));
  };

  const currentClassifieds = classifiedsList.slice(classifiedsPage * classifiedsPerPage, (classifiedsPage + 1) * classifiedsPerPage);

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

  const handleNoticeClick = (title: string, content: string) => {
    setSelectedNotice({ title, content });
    setNoticeModalOpen(true);
  };

  const handleCloseNoticeModal = () => {
    setNoticeModalOpen(false);
    setSelectedNotice(null);
  };
  
  const handleOpenAddNotice = () => {
    setAddNoticeModalOpen(true);
  };

  const handleCloseAddNotice = () => {
    setAddNoticeModalOpen(false);
    setNewNoticeTitle('');
    setNewNoticeContent('');
    setNewNoticeExpiration('');
    setEditingNoticeId(null);
  };

  const handleSaveNotice = async () => {
    if (!newNoticeTitle || !newNoticeContent || !user?.lodge_id) return;
    try {
        if (editingNoticeId) {
             const updatedNotice = await updateNotice(editingNoticeId, {
                title: newNoticeTitle,
                content: newNoticeContent,
                expiration_date: newNoticeExpiration || null,
                lodge_id: user.lodge_id
            });
            setNotices(notices.map(n => n.id === editingNoticeId ? updatedNotice : n));
            // Update stats logic could be here but handled by refetch usually
        } else {
             const newNotice = await createNotice({
                title: newNoticeTitle,
                content: newNoticeContent,
                expiration_date: newNoticeExpiration || undefined,
                lodge_id: user.lodge_id
            });
             setNotices([newNotice, ...notices]);
             if (stats) {
                 setStats({
                     ...stats,
                     active_notices_count: stats.active_notices_count + 1,
                     active_notices: [newNotice, ...(stats.active_notices || [])]
                 });
             }
        }
        handleCloseAddNotice();
    } catch (error) {
        console.error("Error saving notice:", error);
    }
  };
  
  const handleEditClick = (notice: Notice) => {
      setNewNoticeTitle(notice.title);
      setNewNoticeContent(notice.content);
      setNewNoticeExpiration(notice.expiration_date || '');
      setEditingNoticeId(notice.id);
      setAddNoticeModalOpen(true);
      // Close list modal if open? Ideally yes, or keep it open and open edit on top.
      // Let's close list to avoid z-index issues for now or just stack them.
      // Keeping list open might be better UX if user wants to edit another. 
      // But MUI modals stack fine.
  };

  const handleDeleteClick = async (id: number) => {
      if (!user?.lodge_id || !window.confirm('Tem certeza que deseja excluir este aviso?')) return;
      try {
          await deleteNotice(id, user.lodge_id);
          setNotices(notices.filter(n => n.id !== id));
          if (stats) {
             setStats({
                 ...stats,
                 active_notices_count: Math.max(0, stats.active_notices_count - 1),
                 active_notices: (stats.active_notices || []).filter(n => n.id !== id)
             });
          }
      } catch (error) {
          console.error("Error deleting notice:", error);
      }
  };
  
  const handleOpenAllNotices = async () => {
       setAllNoticesModalOpen(true);
       if (user?.lodge_id) {
           try {
               const data = await getNotices(user.lodge_id);
               setNotices(data);
           } catch (error) {
               console.error("Error fetching notices:", error);
           }
       }
  };


  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  // Filter events based on state
  const getFilteredEvents = () => {
    return calendarEvents.filter(event => {
      if (event.type === 'sessao') return filters.sessao;
      if (event.type === 'aniversario') return filters.aniversario;
      if (event.type === 'aniversario_familiar') return filters.aniversario_familiar;
      if (event.type === 'casamento') return filters.casamento;
      if (['iniciacao', 'elevacao', 'exaltacao'].includes(event.type)) return filters.maconico;
      if (event.type === 'evento') return true; 
      return true;
    });
  };

  const filteredEvents = getFilteredEvents();

  const renderCalendarDays = () => {
    const days = [];
    // Empty cells for previous month
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(<Box key={`empty-${i}`} sx={{ height: '100%', border: '1px solid rgba(255,255,255,0.05)' }} />);
    }
    // Days of current month
    const today = new Date();
    const isCurrentMonth = today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();

    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = isCurrentMonth && day === today.getDate();
      const events = filteredEvents.filter(e => e.date === day);
      days.push(
        <Box 
          key={day} 
          onClick={() => handleDayClick(day)}
          sx={{ 
            height: '100%', 
            minHeight: '80px',
            border: isToday ? `1px solid ${COLORS.gold}` : '1px solid rgba(255,255,255,0.05)', 
            p: 1,
            position: 'relative',
            backgroundColor: isToday ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.03)', cursor: 'pointer' },
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <Typography variant="caption" sx={{ 
            position: 'absolute', 
            top: 4, 
            left: 4, 
            color: isToday ? COLORS.gold : 'rgba(255,255,255,0.5)', 
            fontSize: '0.8rem',
            fontFamily: '"Playfair Display", serif',
            fontWeight: isToday ? 700 : 400
          }}>
            {day.toString().padStart(2, '0')}
          </Typography>
          <Box sx={{ mt: 2.5, display: 'flex', flexDirection: 'column', gap: 0.5, flexGrow: 1, overflowY: 'auto' }}>
            {events.map((event, idx) => (
              <Chip
                key={idx}
                label={event.title}
                size="small"
                sx={{
                  height: 16,
                  fontSize: '0.6rem',
                  backgroundColor: event.type === 'sessao' ? '#1e3a8a' : (EVENT_COLORS[event.type] || COLORS.blue),
                  color: '#fff',
                  width: '100%',
                  justifyContent: 'flex-start',
                  px: 0.5,
                  '& .MuiChip-label': { 
                    padding: 0,
                    width: '100%',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    textAlign: 'left',
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

  const selectedEvents = selectedDay ? filteredEvents.filter(e => e.date === selectedDay) : [];
  const selectedDateObj = selectedDay ? new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay) : null;

  if (loading && !stats) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: COLORS.background }}>
        <CircularProgress sx={{ color: COLORS.gold }} />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      flexGrow: 1, 
      display: 'flex', 
      flexDirection: 'column', 
      height: 'calc(100vh - 80px)', // Fit screen height minus header
      bgcolor: COLORS.background,
      color: COLORS.text,
      fontFamily: '"Inter", sans-serif',
      p: 2, // reduced padding
      overflow: 'hidden' // prevent page scroll
    }}>
      
      {/* Main Grid: Left Side List, Center Calendar, Right Side Widgets */}
      <Grid container spacing={2} sx={{ flexGrow: 1, height: '100%' }}>
        
        {/* Left Column */}
        <Grid item xs={12} md={3} sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
            
            {/* Minha Loja Widget - ADDED HERE */}
            <MinhaLojaWidget lodgeInfo={stats?.lodge_info} canManageLodge={canManageLodge} />

            {/* Membros da Loja Widget */}
            <Card 
                sx={{ 
                    bgcolor: COLORS.cardCheck, 
                    color: '#fff', 
                    borderRadius: 2, 
                    border: '1px solid rgba(255,255,255,0.05)', 
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    flexGrow: 0, // Should not grow
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: `0 8px 30px rgba(0,0,0,0.5)`,
                        borderColor: COLORS.gold
                    }
                }}
                onClick={() => setMembersModalOpen(true)}
            >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Grid container alignItems="center">
                        {/* Left Col: Total */}
                        <Grid item xs={6} sx={{ borderRight: '1px solid rgba(255,255,255,0.1)', pr: 2 }}>
                             <Typography variant="subtitle1" sx={{ fontFamily: '"Playfair Display", serif', color: COLORS.gold, lineHeight: 1, mb: 1 }}>
                                Membros da Loja
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                                <Typography variant="h3" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, color: '#fff', lineHeight: 1 }}>
                                    {stats?.lodge_members_stats?.total || 0}
                                </Typography>
                                <Typography variant="caption" sx={{ ml: 1, color: 'rgba(255,255,255,0.5)' }}>
                                    Ativos
                                </Typography>
                            </Box>
                        </Grid>
                        
                        {/* Right Col: Breakdown */}
                        <Grid item xs={6} sx={{ pl: 2 }}>
                             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                 <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Mestres</Typography>
                                 <Typography variant="body2" sx={{ color: COLORS.gold, fontWeight: 700 }}>
                                    {stats?.lodge_members_stats?.masters || 0}
                                 </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                 <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Companheiros</Typography>
                                 <Typography variant="body2" sx={{ color: COLORS.blue, fontWeight: 700 }}>
                                    {stats?.lodge_members_stats?.fellows || 0}
                                 </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                 <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Aprendizes</Typography>
                                 <Typography variant="body2" sx={{ color: COLORS.green, fontWeight: 700 }}>
                                    {stats?.lodge_members_stats?.apprentices || 0}
                                 </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Aniversariantes e Datas List Widget */}
            <Card sx={{ bgcolor: COLORS.cardCheck, color: '#fff', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)', flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <CardContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontFamily: '"Playfair Display", serif', color: COLORS.gold, lineHeight: 1.2 }}>
                                Datas Comemorativas
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                do mês de <span style={{ textTransform: 'capitalize', color: '#fff' }}>{currentDate.toLocaleDateString('pt-BR', { month: 'long' })}</span>
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton 
                                size="small" 
                                onClick={handlePrevMonth} 
                                sx={{ 
                                    color: 'rgba(255,255,255,0.3)', 
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: 1,
                                    p: 0.5,
                                    '&:hover': { color: COLORS.gold, borderColor: COLORS.gold, bgcolor: 'rgba(212, 175, 55, 0.05)' } 
                                }}
                            >
                                <ArrowBackIosNew sx={{ fontSize: '0.8rem' }} />
                            </IconButton>
                            <IconButton 
                                size="small" 
                                onClick={handleNextMonth} 
                                sx={{ 
                                    color: 'rgba(255,255,255,0.3)', 
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: 1,
                                    p: 0.5,
                                    '&:hover': { color: COLORS.gold, borderColor: COLORS.gold, bgcolor: 'rgba(212, 175, 55, 0.05)' } 
                                }}
                            >
                                <ArrowForwardIos sx={{ fontSize: '0.8rem' }} />
                            </IconButton>
                        </Box>
                    </Box>
                    <List disablePadding sx={{ overflowY: 'auto', flexGrow: 1 }}>
                        {(() => {
                            // Filter logic: Only show future dates within the selected month
                            const today = new Date();
                            today.setHours(0,0,0,0);
                            
                            const commemorativeTypes = ['aniversario', 'aniversario_familiar', 'casamento', 'iniciacao', 'elevacao', 'exaltacao'];
                            
                            const widgetEvents = calendarEvents
                                .filter(e => commemorativeTypes.includes(e.type))
                                .filter(e => {
                                    // Parse date string YYYY-MM-DD
                                    const parts = e.full_date.toString().split('T')[0].split('-');
                                    const eventDate = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));
                                    eventDate.setHours(0,0,0,0);
                                    
                                    // If viewing a past month, show nothing? Or show past events?
                                    // "ignorando as que já se passaram" implies filtering out past events relative to TODAY.
                                    // But if we are looking at next month, we show all.
                                    // If we are looking at last month, we show nothing (since all are past).
                                    return eventDate >= today;
                                })
                                .sort((a,b) => a.date - b.date);

                            if (widgetEvents.length === 0) {
                                return (
                                    <Box sx={{ p: 3, textAlign: 'center' }}>
                                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>Nenhuma data futura neste mês.</Typography>
                                    </Box>
                                );
                            }

                            return widgetEvents.map((event, i) => {
                                const eventColor = EVENT_COLORS[event.type] || COLORS.gold;
                                // Parse date
                                const parts = event.full_date.toString().split('T')[0].split('-');
                                const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));
                                
                                const isToday = today.getMonth() === dateObj.getMonth() && today.getDate() === dateObj.getDate();
                                
                                let termo = '';
                                let nome = '';
                                let relacionamento = '';

                                // Parse title based on type patterns from backend
                                if (event.type === 'aniversario_familiar') {
                                    // Format: "Aniversário (Name, Relation do Ir. MemberName)"
                                    const match = event.title.match(/^Aniversário \((.*?), (.*)\)$/);
                                    if (match) {
                                        termo = 'Aniversário de';
                                        nome = match[1];
                                        relacionamento = match[2]; // "filho do Ir. Fulano"
                                    } else {
                                         termo = 'Aniversário de';
                                         nome = event.title;
                                    }
                                } else if (event.type === 'aniversario') {
                                    // Format: "Aniversário (Name)"
                                    const match = event.title.match(/^Aniversário \((.*)\)$/);
                                    termo = 'Aniversário de';
                                    nome = match ? match[1] : event.title;
                                } else if (event.type === 'casamento') {
                                    // Format: "Casamento (Name)"
                                    const match = event.title.match(/^Casamento \((.*)\)$/);
                                    termo = 'Casamento de';
                                    nome = match ? match[1] : event.title;
                                } else if (['iniciacao', 'elevacao', 'exaltacao'].includes(event.type)) {
                                    // Format: "Iniciação de Name", "Elevação de Name"
                                    // Split by first " de "
                                    const splitIndex = event.title.indexOf(' de ');
                                    if (splitIndex !== -1) {
                                        termo = event.title.substring(0, splitIndex + 3); // "Iniciação de"
                                        nome = event.title.substring(splitIndex + 4);
                                    } else {
                                        termo = event.type.charAt(0).toUpperCase() + event.type.slice(1);
                                        nome = event.title;
                                    }
                                } else {
                                    termo = 'Evento';
                                    nome = event.title;
                                }

                                return (
                                <ListItem key={i} sx={{ borderBottom: '1px solid rgba(255,255,255,0.02)', px: 2, py: 1.5, alignItems: 'flex-start' }}>
                                    <Box sx={{ 
                                        width: 4, 
                                        alignSelf: 'stretch', 
                                        bgcolor: eventColor, 
                                        mr: 2,
                                        borderRadius: 1,
                                        mt: 0.5,
                                        mb: 0.5
                                    }} />
                                    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                                         <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                            <Typography component="span" variant="caption" sx={{ 
                                                color: isToday ? COLORS.background : eventColor, 
                                                bgcolor: isToday ? eventColor : 'transparent',
                                                mr: 1, 
                                                fontWeight: 700, 
                                                border: `1px solid ${eventColor}`, 
                                                px: 0.8, 
                                                py: 0.2,
                                                borderRadius: 0.5, 
                                                fontSize: '0.7rem',
                                                lineHeight: 1
                                            }}>
                                                {isToday ? 'HOJE' : dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
                                                {termo}
                                            </Typography>
                                         </Box>
                                         
                                         <Typography variant="body1" sx={{ color: '#fff', fontWeight: 500, fontSize: '0.95rem' }}>
                                            {nome}
                                         </Typography>
                                         
                                         {relacionamento && (
                                             <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', display: 'block', mt: 0.2 }}>
                                                 {relacionamento}
                                             </Typography>
                                         )}
                                    </Box>
                                </ListItem>
                                )
                             });
                        })()}
                    </List>
                </CardContent>
            </Card>
        </Grid>

        {/* Center Column - Calendar */}
        <Grid item xs={12} md={6} sx={{ height: '100%' }}>
             <Card sx={{ bgcolor: COLORS.cardCheck, color: '#fff', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ p: 0, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                     {/* Calendar Toolbar matches image style */}
                     <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                            <Typography variant="h4" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, color: COLORS.gold }}>
                                {currentDate.toLocaleDateString('pt-BR', { month: 'long' })}
                            </Typography>
                            <Typography variant="h5" sx={{ fontFamily: '"Playfair Display", serif', color: 'rgba(255,255,255,0.5)' }}>
                                {currentDate.getFullYear()}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button 
                                variant="outlined" 
                                size="small" 
                                onClick={handlePrevMonth}
                                sx={{ minWidth: 40, borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}
                            >
                                <ArrowBackIosNew fontSize="small" />
                            </Button>
                            <Button 
                                variant="contained" 
                                size="small" 
                                onClick={handleToday}
                                sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: COLORS.gold, '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
                            >
                                HOJE
                            </Button>
                             <Button 
                                variant="outlined" 
                                size="small" 
                                onClick={handleNextMonth}
                                sx={{ minWidth: 40, borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}
                            >
                                <ArrowForwardIos fontSize="small" />
                            </Button>
                        </Box>
                     </Box>

                     {/* Filters as Chips */}
                     <Box sx={{ px: 3, pb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip 
                            label="Sessões" 
                            size="small" 
                            onClick={() => setFilters({...filters, sessao: !filters.sessao})}
                            sx={{ bgcolor: filters.sessao ? COLORS.blue : 'transparent', border: '1px solid', borderColor: COLORS.blue, color: '#fff' }} 
                        />
                         <Chip 
                            label="Eventos" 
                            size="small" 
                            onClick={() => setFilters({...filters, maconico: !filters.maconico})} // Simplified filter logic for demo
                            sx={{ bgcolor: filters.maconico ? COLORS.orange : 'transparent', border: '1px solid', borderColor: COLORS.orange, color: '#fff' }} 
                        />
                     </Box>

                     {/* Calendar Grid Header */}
                     <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', bgcolor: '#0f172a', py: 1, borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'].map(d => (
                            <Typography key={d} variant="caption" sx={{ textAlign: 'center', color: COLORS.gold, fontWeight: 700, letterSpacing: 1 }}>
                                {d}
                            </Typography>
                        ))}
                     </Box>

                     {/* Calendar Grid Body */}
                     <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridTemplateRows: 'repeat(5, 1fr)', flexGrow: 1 }}>
                         {renderCalendarDays()}
                     </Box>
                </CardContent>
             </Card>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={3} sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
            
            {/* Mural de Avisos (Renamed to Mural da Loja) */}
            <Card sx={{ bgcolor: COLORS.cardCheck, color: '#fff', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)', flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                 <CardContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                             <Typography variant="subtitle1" sx={{ fontFamily: '"Playfair Display", serif', color: COLORS.gold }}>
                                Mural de Avisos
                            </Typography>
                             <Chip 
                                label="VER TODOS" 
                                size="small" 
                                onClick={handleOpenAllNotices}
                                sx={{ 
                                    height: 20, 
                                    fontSize: '0.65rem', 
                                    bgcolor: 'rgba(255,255,255,0.05)', 
                                    color: 'rgba(255,255,255,0.6)', 
                                    cursor: 'pointer',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', color: '#fff' }
                                }} 
                            />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            {canManageNotices && (
                                <IconButton size="small" onClick={handleOpenAddNotice} sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: COLORS.gold } }}>
                                    <AddIcon fontSize="small" />
                                </IconButton>
                            )}
                            <Notifications sx={{ color: 'rgba(255,255,255,0.3)' }} />
                        </Box>
                    </Box>
                    <List disablePadding sx={{ overflowY: 'auto', flexGrow: 1 }}>
                        
                        {/* 1. Próxima Sessão (Merged here) */}
                        {stats?.next_session ? (
                           <ListItem 
                                button 
                                onClick={() => handleNoticeClick('Próxima Sessão', `
                                    <strong>Título:</strong> ${stats.next_session!.title}<br/>
                                    <strong>Data:</strong> ${new Date(stats.next_session!.session_date).toLocaleDateString('pt-BR')}<br/>
                                    <strong>Horário:</strong> ${stats.next_session!.start_time || 'A definir'}<br/>
                                    <strong>Local:</strong> Templo Principal
                                `)}
                                sx={{ 
                                    alignItems: 'flex-start', 
                                    py: 1.5, 
                                    borderLeft: `3px solid ${COLORS.gold}`, 
                                    bgcolor: 'rgba(212, 175, 55, 0.05)',
                                    mb: 1
                                }}
                            >
                                <Castle sx={{ color: COLORS.gold, fontSize: 18, mt: 0.5, mr: 1.5 }} />
                                <ListItemText 
                                    primary="PRÓXIMA SESSÃO"
                                    primaryTypographyProps={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: 1 }}
                                    secondary={
                                        <>
                                            <Typography component="span" variant="body2" sx={{ color: '#fff', display: 'block', fontWeight: 600, mt: 0.5, fontSize: '0.9rem' }}>
                                                {stats.next_session.title}
                                            </Typography>
                                            <Typography component="span" variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                                                {new Date(stats.next_session.session_date).toLocaleDateString('pt-BR')} às {stats.next_session.start_time} horas
                                            </Typography>
                                        </>
                                    }
                                />
                            </ListItem> 
                        ) : (
                            <ListItem sx={{ alignItems: 'flex-start', py: 2 }}>
                                 <Castle sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 20, mt: 0.5, mr: 1.5 }} />
                                 <ListItemText primary="Nenhuma sessão agendada" secondaryTypographyProps={{ color: 'rgba(255,255,255,0.5)' }} />
                            </ListItem>
                        )}

                        {/* 2. Other Notices */}
                        {stats?.active_notices && stats.active_notices.length > 0 ? (
                             stats.active_notices.map((notice) => (
                                <ListItem 
                                    key={notice.id} 
                                    button
                                    onClick={() => handleNoticeClick(notice.title, notice.content)}
                                    sx={{ alignItems: 'flex-start', py: 1 }}
                                >
                                    <Campaign sx={{ color: COLORS.blue, fontSize: 18, mt: 0.5, mr: 1.5 }} />
                                    <ListItemText 
                                        primary={notice.title}
                                        secondary="Clique para ver detalhes."
                                        primaryTypographyProps={{ fontSize: '0.9rem' }}
                                        secondaryTypographyProps={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', mt: 0 }}
                                    />
                                </ListItem>
                             ))
                        ) : null}
                    </List>
                </CardContent>
            </Card>

            {/* Escala Ágape */}
             <Card sx={{ bgcolor: COLORS.cardCheck, color: '#fff', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)', flexGrow: 0 }}>
                <CardContent sx={{ p: 0 }}>
                    <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle1" sx={{ fontFamily: '"Playfair Display", serif', color: COLORS.gold }}>
                            Escala Ágape
                        </Typography>
                        <Restaurant fontSize="small" sx={{ color: 'rgba(255,255,255,0.3)' }} />
                    </Box>
                    <List disablePadding>
                        {stats?.dining_scale && stats.dining_scale.length > 0 ? (
                            stats.dining_scale.slice(0, 3).map((item, idx) => (
                                <ListItem key={idx} sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                    <Box sx={{ mr: 2, bgcolor: 'rgba(255,255,255,0.05)', p: 1, borderRadius: 1 }}>
                                        <Restaurant fontSize="small" sx={{ color: COLORS.gold }} />
                                    </Box>
                                    <ListItemText
                                        primary={
                                            <Typography variant="caption" sx={{ color: COLORS.gold, display: 'block', mb: 0.5, fontWeight: 700 }}>
                                                IRMÃO HOSPITALEIRO
                                            </Typography>
                                        }
                                        secondary={
                                            <Typography variant="body2" sx={{ color: '#fff', fontSize: '0.9rem' }}>
                                                {item.name}
                                            </Typography>
                                        }
                                    />
                                </ListItem>
                            ))
                        ) : (
                            <Box sx={{ p: 3, textAlign: 'center' }}>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>Nenhuma escala definida.</Typography>
                            </Box>
                        )}
                    </List>
                </CardContent>
            </Card>

            {/* Classificados Widget */}
            <Card sx={{ bgcolor: COLORS.cardCheck, color: '#fff', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)', flexGrow: 0, cursor: 'pointer', '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }} onClick={() => handleOpenClassifiedsModal()}>
                 <CardContent sx={{ p: 0 }}>
                    <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle1" sx={{ fontFamily: '"Playfair Display", serif', color: COLORS.gold }}>
                            Classificados
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Chip label={stats?.classifieds_count || 0} size="small" sx={{ bgcolor: COLORS.blue, color: '#fff', height: 20, fontSize: '0.7rem' }} />
                            <StoreIcon sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 20 }} />
                        </Box>
                    </Box>
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                         <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', mb: 2, display: 'block' }}>
                             Anúncios ativos na loja
                         </Typography>
                         <Button 
                            variant="outlined" 
                            size="small" 
                            fullWidth
                            startIcon={<AddIcon />} 
                            onClick={(e) => { e.stopPropagation(); alert('Funcionalidade de inserir anúncio será implementada em breve.'); }}
                            sx={{ color: COLORS.gold, borderColor: 'rgba(212, 175, 55, 0.3)' }}
                         >
                             Inserir Anúncio

                         </Button>
                    </Box>
                </CardContent>
            </Card>

        </Grid>

      </Grid>
      
      {/* Event Details Modal - Dark Theme */}
      <Dialog 
        open={modalOpen} 
        onClose={handleCloseModal}
        PaperProps={{
          sx: {
            bgcolor: COLORS.cardCheck,
            color: '#fff',
            minWidth: 320,
            border: `1px solid ${COLORS.gold}`,
            boxShadow: `0 0 20px rgba(0,0,0,0.5)`
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Typography variant="h6" sx={{ fontFamily: '"Playfair Display", serif', color: COLORS.gold }}>
            {selectedDateObj?.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Typography>
          <IconButton onClick={handleCloseModal} size="small" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedEvents.length > 0 ? (
            <List>
              {selectedEvents.map((event, idx) => (
                <ListItem key={idx} sx={{ px: 0, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <Box sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    bgcolor: EVENT_COLORS[event.type] || COLORS.blue,
                    mr: 2,
                    mt: 1,
                    alignSelf: 'flex-start'
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
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
              Nenhum evento registrado.
            </Typography>
          )}
        </DialogContent>
      </Dialog>

       {/* Notice Detail Modal */}
       <Dialog 
        open={noticeModalOpen} 
        onClose={handleCloseNoticeModal}
        PaperProps={{
          sx: {
            bgcolor: COLORS.cardCheck,
            color: '#fff',
            minWidth: 400,
            border: `1px solid ${COLORS.gold}`,
            boxShadow: `0 0 20px rgba(0,0,0,0.5)`
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Typography variant="h6" sx={{ fontFamily: '"Playfair Display", serif', color: COLORS.gold }}>
            {selectedNotice?.title}
          </Typography>
          <IconButton onClick={handleCloseNoticeModal} size="small" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
             {selectedNotice && (
                 <Typography 
                    variant="body1" 
                    sx={{ color: '#fff', lineHeight: 1.6 }}
                    dangerouslySetInnerHTML={{ __html: selectedNotice.content }} 
                 />
             )}
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <Button onClick={handleCloseNoticeModal} sx={{ color: COLORS.gold }}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* Members Network Modal */}
      <Dialog 
        open={membersModalOpen} 
        onClose={() => setMembersModalOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: COLORS.background,
            color: '#fff',
            border: `1px solid ${COLORS.gold}`,
            boxShadow: `0 0 30px rgba(0,0,0,0.8)`,
            minHeight: '60vh'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 2 }}>
            <Box>
                <Typography variant="h5" sx={{ fontFamily: '"Playfair Display", serif', color: COLORS.gold }}>
                    Obreiros da Loja
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    {stats?.lodge_members_stats?.total || 0} Irmãos Ativos
                </Typography>
            </Box>
            <IconButton onClick={() => setMembersModalOpen(false)} sx={{ color: 'rgba(255,255,255,0.5)' }}>
                <CloseIcon />
            </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2, pb: 4 }}>
            <Grid container spacing={2}>
                {stats?.lodge_members_stats?.members_list?.map((member) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={member.id}>
                        <Card sx={{ bgcolor: COLORS.cardCheck, border: '1px solid rgba(255,255,255,0.05)', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3, transition: 'all 0.2s', '&:hover': { transform: 'translateY(-4px)', borderColor: COLORS.gold, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' } }}>
                             <Box sx={{ position: 'relative', mb: 2 }}>
                                <Avatar 
                                    src={member.profile_picture_path ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${member.profile_picture_path}` : undefined}
                                    alt={member.full_name}
                                    sx={{ width: 80, height: 80, border: `2px solid ${member.degree === 'Aprendiz' ? COLORS.green : member.degree === 'Companheiro' ? COLORS.blue : COLORS.gold}` }}
                                >
                                    {member.full_name.charAt(0)}
                                </Avatar>
                                <Chip 
                                    label={member.degree || 'Membro'} 
                                    size="small" 
                                    sx={{ 
                                        position: 'absolute', 
                                        bottom: -10, 
                                        left: '50%', 
                                        transform: 'translateX(-50%)', 
                                        height: 20, 
                                        fontSize: '0.65rem',
                                        bgcolor: COLORS.background, 
                                        color: member.degree === 'Aprendiz' ? COLORS.green : member.degree === 'Companheiro' ? COLORS.blue : COLORS.gold,
                                        border: `1px solid ${member.degree === 'Aprendiz' ? COLORS.green : member.degree === 'Companheiro' ? COLORS.blue : COLORS.gold}`
                                    }} 
                                />
                             </Box>
                             <Typography variant="subtitle1" sx={{ fontWeight: 600, textAlign: 'center', mb: 0.5, lineHeight: 1.2 }}>
                                 {member.full_name}
                             </Typography>
                             <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', mb: 2 }}>
                                 CIM: {member.cim || 'N/A'}
                             </Typography>
                             
                             <Box sx={{ width: '100%', pt: 2, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                 <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 1 }}>
                                     <span style={{opacity: 0.5}}>✉</span> {member.email}
                                 </Typography>
                                 <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 1 }}>
                                     <span style={{opacity: 0.5}}>📞</span> {member.phone || 'Sem telefone'}
                                 </Typography>
                             </Box>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </DialogContent>
      </Dialog>

      {/* Classifieds Modal */}
      <Dialog 
        open={classifiedsModalOpen} 
        onClose={() => setClassifiedsModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: COLORS.background,
            color: '#fff',
            border: `1px solid ${COLORS.gold}`,
            boxShadow: `0 0 30px rgba(0,0,0,0.8)`,
            minHeight: '50vh'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 2 }}>
            <Box>
                <Typography variant="h5" sx={{ fontFamily: '"Playfair Display", serif', color: COLORS.gold }}>
                    Mural de Classificados
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    {classifiedsList.length} Anúncios Disponíveis
                </Typography>
            </Box>
            <IconButton onClick={() => setClassifiedsModalOpen(false)} sx={{ color: 'rgba(255,255,255,0.5)' }}>
                <CloseIcon />
            </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2, pb: 4, display: 'flex', flexDirection: 'column', height: '100%' }}>
            {classifiedsList.length > 0 ? (
                <>
                    <Grid container spacing={2} sx={{ flexGrow: 1 }}>
                        {currentClassifieds.map((ad) => (
                            <Grid item xs={12} sm={6} key={ad.id}>
                                <Card sx={{ bgcolor: COLORS.cardCheck, border: '1px solid rgba(255,255,255,0.05)', height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    <Box sx={{ height: 140, bgcolor: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                        {ad.image_paths && ad.image_paths.length > 0 ? (
                                             <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${ad.image_paths[0]}`} alt={ad.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <StoreIcon sx={{ fontSize: 40, color: 'rgba(255,255,255,0.1)' }} />
                                        )}
                                    </Box>
                                    <CardContent sx={{ flexGrow: 1, p: 2 }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#fff', lineHeight: 1.2, mb: 1 }}>
                                            {ad.title}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: COLORS.textSecondary, mb: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {ad.description}
                                        </Typography>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                                            <Typography variant="h6" sx={{ color: COLORS.green, fontWeight: 700 }}>
                                                {ad.price ? `R$ ${ad.price.toFixed(2)}` : 'A Combinar'}
                                            </Typography>
                                            <Chip label={ad.city || 'Local não inf.'} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }} />
                                        </Box>
                                    </CardContent>
                                    <Box sx={{ p: 2, pt: 0, borderTop: '1px solid rgba(255,255,255,0.05)', mt: 'auto' }}>
                                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block' }}>
                                            Anunciante: {ad.member?.full_name || 'Desconhecido'}
                                        </Typography>
                                         <Typography variant="caption" sx={{ color: COLORS.gold, display: 'block' }}>
                                            {ad.contact_info || ad.contact_email}
                                        </Typography>
                                    </Box>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                    
                    {/* Pagination Controls */}
                    {classifiedsList.length > 4 && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 3, gap: 2 }}>
                            <Button 
                                disabled={classifiedsPage === 0} 
                                onClick={handlePrevPage}
                                startIcon={<ChevronLeft />}
                                sx={{ color: COLORS.gold, '&:disabled': { color: 'rgba(255,255,255,0.1)' } }}
                            >
                                Anterior
                            </Button>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                Página {classifiedsPage + 1} de {Math.ceil(classifiedsList.length / 4)}
                            </Typography>
                            <Button 
                                disabled={(classifiedsPage + 1) * 4 >= classifiedsList.length} 
                                onClick={handleNextPage}
                                endIcon={<ChevronRight />}
                                sx={{ color: COLORS.gold, '&:disabled': { color: 'rgba(255,255,255,0.1)' } }}
                            >
                                Próxima
                            </Button>
                        </Box>
                    )}
                </>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 200 }}>
                    <StoreIcon sx={{ fontSize: 60, color: 'rgba(255,255,255,0.1)', mb: 2 }} />
                    <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        Nenhum anúncio disponível no momento.
                    </Typography>
                </Box>
            )}
        </DialogContent>
      </Dialog>
      
      {/* Add Notice Modal */}
      <Dialog 
        open={addNoticeModalOpen} 
        onClose={handleCloseAddNotice}
         PaperProps={{
          sx: {
            bgcolor: COLORS.background,
            color: '#fff',
            minWidth: 400,
            border: `1px solid ${COLORS.gold}`,
            boxShadow: `0 0 20px rgba(0,0,0,0.5)`
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Typography variant="h6" sx={{ fontFamily: '"Playfair Display", serif', color: COLORS.gold }}>
            Novo Aviso
          </Typography>
          <IconButton onClick={handleCloseAddNotice} size="small" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
            <DialogContentText sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>
                Publique um novo aviso para os membros da loja.
            </DialogContentText>
            <TextField
                autoFocus
                margin="dense"
                id="title"
                label="Título do Aviso"
                type="text"
                fullWidth
                variant="outlined"
                value={newNoticeTitle}
                onChange={(e) => setNewNoticeTitle(e.target.value)}
                sx={{ 
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                        color: '#fff',
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                        '&:hover fieldset': { borderColor: COLORS.gold },
                        '&.Mui-focused fieldset': { borderColor: COLORS.gold },
                    },
                    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                    '& .MuiInputLabel-root.Mui-focused': { color: COLORS.gold },
                }}
            />
             <TextField
                margin="dense"
                id="content"
                label="Conteúdo"
                type="text"
                fullWidth
                multiline
                rows={4}
                variant="outlined"
                value={newNoticeContent}
                onChange={(e) => setNewNoticeContent(e.target.value)}
                sx={{ 
                    '& .MuiOutlinedInput-root': {
                        color: '#fff',
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                        '&:hover fieldset': { borderColor: COLORS.gold },
                        '&.Mui-focused fieldset': { borderColor: COLORS.gold },
                    },
                     '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                    '& .MuiInputLabel-root.Mui-focused': { color: COLORS.gold },
                }}
            />
             <TextField
                margin="dense"
                id="expiration"
                label="Data de Expiração (Opcional)"
                type="date"
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                value={newNoticeExpiration}
                onChange={(e) => setNewNoticeExpiration(e.target.value)}
                sx={{ 
                    '& .MuiOutlinedInput-root': {
                        color: '#fff',
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                        '&:hover fieldset': { borderColor: COLORS.gold },
                        '&.Mui-focused fieldset': { borderColor: COLORS.gold },
                        '& input::-webkit-calendar-picker-indicator': { filter: 'invert(1)' } 
                    },
                     '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                    '& .MuiInputLabel-root.Mui-focused': { color: COLORS.gold },
                }}
            />
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', p: 2 }}>
            <Button onClick={handleCloseAddNotice} sx={{ color: 'rgba(255,255,255,0.5)' }}>Cancelar</Button>
            <Button onClick={handleSaveNotice} variant="contained" sx={{ bgcolor: COLORS.gold, color: '#000', '&:hover': { bgcolor: COLORS.goldDark } }}>
                {editingNoticeId ? 'Salvar Alterações' : 'Publicar'}
            </Button>
        </DialogActions>
      </Dialog>

      {/* All Notices Modal */}
        <Dialog 
        open={allNoticesModalOpen} 
        onClose={() => setAllNoticesModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: COLORS.background,
            color: '#fff',
            border: `1px solid ${COLORS.gold}`,
            boxShadow: `0 0 30px rgba(0,0,0,0.8)`,
            minHeight: '50vh'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 2 }}>
            <Box>
                <Typography variant="h5" sx={{ fontFamily: '"Playfair Display", serif', color: COLORS.gold }}>
                    Mural de Avisos - Completo
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    Todos os avisos da loja
                </Typography>
            </Box>
            <IconButton onClick={() => setAllNoticesModalOpen(false)} sx={{ color: 'rgba(255,255,255,0.5)' }}>
                <CloseIcon />
            </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2, pb: 4 }}>
            <List>
                {notices.length > 0 ? (
                    notices.map((notice) => (
                        <ListItem 
                            key={notice.id} 
                            sx={{ 
                                bgcolor: COLORS.cardCheck, 
                                mb: 2, 
                                borderRadius: 1, 
                                border: '1px solid rgba(255,255,255,0.05)' 
                            }}
                        >
                            <Box sx={{ width: '100%' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'flex-start' }}>
                                    <Box>
                                        <Typography variant="subtitle1" sx={{ color: COLORS.gold, fontWeight: 700 }}>
                                            {notice.title}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block' }}>
                                            Publicado em: {new Date(notice.date_posted).toLocaleDateString('pt-BR')}
                                        </Typography>
                                        {notice.expiration_date && (
                                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block' }}>
                                                Expira em: {new Date(notice.expiration_date).toLocaleDateString('pt-BR')}
                                            </Typography>
                                        )}
                                    </Box>
                                    
                                    {canManageNotices && (
                                        <Box>
                                            <IconButton size="small" onClick={() => handleEditClick(notice)} sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: COLORS.blue } }}>
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton size="small" onClick={() => handleDeleteClick(notice.id)} sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: '#ef4444' } }}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    )}
                                </Box>
                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', whiteSpace: 'pre-line' }}>
                                    {notice.content}
                                </Typography>
                            </Box>
                        </ListItem>
                    ))
                ) : (
                    <Box sx={{ textAlign: 'center', py: 5 }}>
                        <Campaign sx={{ fontSize: 60, color: 'rgba(255,255,255,0.1)', mb: 2 }} />
                        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                            Nenhum aviso encontrado.
                        </Typography>
                    </Box>
                )}
            </List>
        </DialogContent>
      </Dialog>

    </Box>
  );
};

export default LodgeDashboard;
