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
    ListItemButton,
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
    Close as CloseIcon,
    Castle,
    Campaign,
    ArrowBackIosNew,
    ArrowForwardIos,
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Cake as CakeIcon, // For birthdays
    Gavel as GavelIcon, // For Apprentice/Iniciação/Instalação
    Event as EventIcon,  // Fallback
    AllInclusive as WeddingIcon, // For Casamento/Rings
    Architecture as ArchitectureIcon // For Masonic degrees (Compass/Square)
} from '@mui/icons-material';
import { getDashboardStats, getCalendarEvents, getNotices, createNotice, updateNotice, deleteNotice, DashboardStats, CalendarEvent, Notice } from '../../services/dashboardService';
import MinhaLojaWidget from './components/MinhaLojaWidget';
import QuickAccessWidget from './components/QuickAccessWidget';
import { useAuth } from '../../hooks/useAuth'; // Import useAuth
import { TextField, DialogContentText } from '@mui/material'; // Import form components
import { useNavigate } from 'react-router-dom';

// Define Colors
const COLORS = {
    background: '#0B0E14',
    cardCheck: '#151B26', // Keep for fallback
    glassBg: 'rgba(21, 27, 38, 0.4)',
    glassBorderUrl: 'rgba(255, 255, 255, 0.08)',
    glassBorderTop: 'rgba(255, 255, 255, 0.12)',
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
    instalacao: COLORS.orange,
};

// Helper function to normalize event types to properly accented Portuguese
const normalizeEventType = (type: string): string => {
    if (!type) return '';
    const t = type.toLowerCase();

    if (t.includes('eleva')) return 'Elevação';
    if (t.includes('inicia')) return 'Iniciação';
    if (t.includes('exalta')) return 'Exaltação';
    if (t.includes('anivers') || t.includes('aniversario') || t.includes('aniversário')) return 'Aniversário';
    if (t.includes('sess')) return 'Sessão';
    if (t.includes('casamento')) return 'Casamento';
    if (t.includes('instala')) return 'Instalação';

    // Fallback capitalizing first letter
    return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
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

    const navigate = useNavigate();

    const handleOpenClassifiedsModal = () => {
        navigate('/dashboard/lodge-dashboard/obreiro/classificados');
    };

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
                                label={normalizeEventType(event.title || event.type)}
                                size="small"
                                sx={{
                                    height: 18,
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    borderRadius: 4,
                                    backgroundColor: event.type === 'sessao' ? COLORS.blue : (EVENT_COLORS[event.type] || COLORS.blue),
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

    // Commemorative events filtered from current month's calendarEvents
    const commemorativeTypes = ['Aniversário', 'Elevação', 'Iniciação', 'Exaltação', 'Casamento', 'Instalação'];
    const commemorativeEvents = calendarEvents
        .filter(event => commemorativeTypes.includes(normalizeEventType(event.type)))
        .sort((a, b) => {
            const dayA = parseInt(a.full_date.split('-')[2], 10);
            const dayB = parseInt(b.full_date.split('-')[2], 10);
            return dayA - dayB;
        });

    return (
        <Box sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            height: { xs: 'auto', md: 'calc(100vh - 80px)' }, // Fit screen height minus header on desktop
            minHeight: { xs: 'calc(100vh - 80px)', md: 'auto' },
            bgcolor: COLORS.background,
            color: COLORS.text,
            fontFamily: '"Inter", sans-serif',
            p: 2, // reduced padding
            overflow: { xs: 'visible', md: 'hidden' } // allow page scroll on mobile
        }}>

            {/* Main Grid: Left Side List, Center Calendar, Right Side Widgets */}
            {/* Main Grid: Asymmetrical Layout (20% - 60% - 20%) */}
            <Grid container spacing={1.5} columns={10} sx={{ flexGrow: 1, height: '100%' }}>

                {/* Left Column - Minha Loja, Membros, Datas Comemorativas */}
                <Grid size={{ xs: 10, lg: 2 }} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, height: { xs: 'auto', lg: '100%' }, overflowY: { xs: 'auto', lg: 'hidden' } }}>
                    {/* Minha Loja Widget */}
                    <Box sx={{ flexShrink: 0 }}>
                        <MinhaLojaWidget lodgeInfo={stats?.lodge_info} canManageLodge={canManageLodge} />
                    </Box>

                    {/* Membros da Loja Widget */}
                    <Card
                        sx={{
                            bgcolor: COLORS.glassBg,
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                            color: '#fff',
                            borderRadius: '16px',
                            border: `1px solid ${COLORS.glassBorderUrl}`,
                            borderTop: `1px solid ${COLORS.glassBorderTop}`,
                            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            position: 'relative',
                            overflow: 'hidden',
                            flexGrow: 0,
                            flexShrink: 0,
                            '&:hover': {
                                transform: 'translateY(-3px)',
                                boxShadow: `0 12px 40px rgba(0,0,0,0.5)`,
                                borderColor: 'rgba(212, 175, 55, 0.4)'
                            }
                        }}
                        onClick={() => setMembersModalOpen(true)}
                    >
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 0.5, mb: 1 }}>
                                <Typography variant="h6" sx={{ color: COLORS.gold, fontFamily: '"Playfair Display", serif', fontWeight: 600, fontSize: '1rem', lineHeight: 1 }}>
                                    Membros da Loja
                                </Typography>
                                <Typography variant="h4" sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 700, color: '#fff', lineHeight: 1 }}>
                                    {stats?.lodge_members_stats?.total || 0}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Mestres</Typography>
                                    <Typography variant="body2" sx={{ color: COLORS.gold, fontStyle: 'italic', fontWeight: 500 }}>
                                        {stats?.lodge_members_stats?.masters || 0}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Companheiros</Typography>
                                    <Typography variant="body2" sx={{ color: COLORS.blue, fontStyle: 'italic', fontWeight: 500 }}>
                                        {stats?.lodge_members_stats?.fellows || 0}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Aprendizes</Typography>
                                    <Typography variant="body2" sx={{ color: COLORS.green, fontStyle: 'italic', fontWeight: 500 }}>
                                        {stats?.lodge_members_stats?.apprentices || 0}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Datas Comemorativas (restored to left column) */}
                    <Card sx={{
                        bgcolor: COLORS.glassBg,
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        color: '#fff',
                        borderRadius: '16px',
                        border: `1px solid ${COLORS.glassBorderUrl}`,
                        borderTop: `1px solid ${COLORS.glassBorderTop}`,
                        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
                        flexGrow: 1,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: 0
                    }}>
                        <CardContent sx={{ p: 0, display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0 }}>
                            <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <Typography variant="h6" sx={{ fontFamily: '"Playfair Display", serif', color: COLORS.gold, fontWeight: 600, fontSize: '1rem', lineHeight: 1.2 }}>
                                    Datas Comemorativas de {currentDate.toLocaleDateString('pt-BR', { month: 'long' }).charAt(0).toUpperCase() + currentDate.toLocaleDateString('pt-BR', { month: 'long' }).slice(1)}
                                </Typography>
                            </Box>
                            <List disablePadding sx={{ overflowY: 'auto', flexGrow: 1, p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {commemorativeEvents && commemorativeEvents.length > 0 ? (
                                    commemorativeEvents.map((event, idx) => {
                                        const dateParts = event.full_date.split('-'); // YYYY-MM-DD
                                        const formattedDate = `${dateParts[2]}/${dateParts[1]}`;

                                        const today = new Date();
                                        const isToday = parseInt(dateParts[1], 10) === (today.getMonth() + 1) && parseInt(dateParts[2], 10) === today.getDate();

                                        const displayType = normalizeEventType(event.type);

                                        let IconComponent = EventIcon;
                                        let typeColor = EVENT_COLORS[event.type] || COLORS.gold;

                                        if (['Elevação', 'Iniciação', 'Exaltação'].includes(displayType)) {
                                            typeColor = displayType === 'Elevação' ? COLORS.blue : displayType === 'Iniciação' ? COLORS.green : COLORS.purple;
                                            IconComponent = ArchitectureIcon; // Represents Square and Compass
                                        }
                                        else if (displayType === 'Aniversário') {
                                            typeColor = COLORS.red;
                                            IconComponent = CakeIcon; // Birthday cake
                                        }
                                        else if (displayType === 'Casamento') {
                                            typeColor = COLORS.fuchsia;
                                            IconComponent = WeddingIcon; // Wedding/Rings
                                        }
                                        else if (displayType === 'Instalação') {
                                            typeColor = COLORS.orange;
                                            IconComponent = GavelIcon; // Malhete
                                        }

                                        return (
                                            <ListItem key={idx} disablePadding sx={{
                                                alignItems: 'flex-start',
                                                borderLeft: '4px solid',
                                                borderLeftColor: typeColor,
                                                pl: 1.5,
                                                ...(isToday && {
                                                    bgcolor: 'rgba(212, 175, 55, 0.1)',
                                                    border: `1px solid ${COLORS.gold}`,
                                                    borderLeft: `4px solid ${typeColor}`,
                                                    borderRadius: '8px',
                                                    p: 1.5,
                                                    mb: 1
                                                })
                                            }}>
                                                <Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                        <Typography variant="caption" sx={{ fontFamily: '"Inter", sans-serif', color: typeColor, fontWeight: 500, fontStyle: 'italic', bgcolor: 'rgba(255,255,255,0.05)', px: 0.5, borderRadius: 1, fontSize: '0.75rem' }}>
                                                            {formattedDate}
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'rgba(255,255,255,0.7)' }}>
                                                            <IconComponent sx={{ fontSize: 14, color: typeColor }} />
                                                            <Typography variant="caption" sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 400, fontSize: '0.75rem' }}>
                                                                {displayType} de
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                    <Typography variant="body2" sx={{ fontFamily: '"Inter", sans-serif', color: '#fff', fontWeight: 400, fontSize: '0.875rem', lineHeight: 1.2 }}>
                                                        {event.title}
                                                    </Typography>
                                                </Box>
                                            </ListItem>
                                        );
                                    })
                                ) : (
                                    <ListItem sx={{ p: 2 }}>
                                        <ListItemText primary="Nenhuma data próxima" secondaryTypographyProps={{ color: 'rgba(255,255,255,0.5)' }} />
                                    </ListItem>
                                )}
                            </List>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Core Column - Massive Calendar */}
                <Grid size={{ xs: 10, lg: 6 }} sx={{ height: { xs: 'auto', lg: '100%' }, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                    <Card sx={{
                        bgcolor: COLORS.glassBg,
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        color: '#fff',
                        borderRadius: '16px',
                        border: `1px solid ${COLORS.glassBorderUrl}`,
                        borderTop: `1px solid ${COLORS.glassBorderTop}`,
                        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
                        flexGrow: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }}>

                        <CardContent sx={{ p: 0, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                            {/* Calendar Toolbar matching brutalist style */}
                            <Box sx={{ pt: { xs: 1.5, md: 2 }, px: { xs: 1.5, md: 2 }, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box>
                                    <Typography variant="h3" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 800, color: COLORS.gold, letterSpacing: -1, mb: 0 }}>
                                        {currentDate.toLocaleDateString('pt-BR', { month: 'long' })}
                                    </Typography>
                                    <Typography variant="h6" sx={{ fontFamily: '"Inter", sans-serif', color: 'rgba(255,255,255,0.4)', fontWeight: 300, letterSpacing: 1, mb: 1.5 }}>
                                        {currentDate.getFullYear()}
                                    </Typography>

                                    {/* Filters as Brutalist Chips */}
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Chip
                                            label="Sessões"
                                            onClick={() => setFilters({ ...filters, sessao: !filters.sessao })}
                                            sx={{ borderRadius: 8, fontWeight: 700, px: 1, bgcolor: filters.sessao ? COLORS.blue : 'rgba(255,255,255,0.05)', color: filters.sessao ? '#fff' : 'rgba(255,255,255,0.5)', border: 'none' }}
                                        />
                                        <Chip
                                            label="Eventos"
                                            onClick={() => setFilters({ ...filters, maconico: !filters.maconico })}
                                            sx={{ borderRadius: 8, fontWeight: 700, px: 1, bgcolor: filters.maconico ? COLORS.orange : 'rgba(255,255,255,0.05)', color: filters.maconico ? '#fff' : 'rgba(255,255,255,0.5)', border: 'none' }}
                                        />
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button
                                        variant="outlined"
                                        onClick={handlePrevMonth}
                                        sx={{ minWidth: 40, width: 40, height: 40, borderColor: 'rgba(255,255,255,0.1)', color: 'white', borderRadius: 2 }}
                                    >
                                        <ArrowBackIosNew fontSize="small" />
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        onClick={handleToday}
                                        sx={{ height: 40, px: 2, borderColor: 'rgba(255,255,255,0.1)', color: COLORS.gold, borderRadius: 2, fontWeight: 700, letterSpacing: 1, '&:hover': { bgcolor: 'rgba(212, 175, 55, 0.1)' } }}
                                    >
                                        HOJE
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        onClick={handleNextMonth}
                                        sx={{ minWidth: 40, width: 40, height: 40, borderColor: 'rgba(255,255,255,0.1)', color: 'white', borderRadius: 2 }}
                                    >
                                        <ArrowForwardIos fontSize="small" />
                                    </Button>
                                </Box>
                            </Box>

                            {/* Calendar Grid Header */}
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', bgcolor: '#0B0F19', py: 1, borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'].map(d => (
                                    <Typography key={d} variant="caption" sx={{ textAlign: 'center', color: COLORS.gold, fontWeight: 800, letterSpacing: 2 }}>
                                        {d}
                                    </Typography>
                                ))}
                            </Box>

                            {/* Calendar Grid Body */}
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: '1fr', flexGrow: 1, bgcolor: '#090B10' }}>
                                {renderCalendarDays()}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Right Column - Mural, QuickAccessWidget */}
                <Grid size={{ xs: 10, lg: 2 }} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, height: { xs: 'auto', lg: '100%' }, overflowY: { xs: 'auto', lg: 'hidden' } }}>

                    {/* Mural de Avisos */}
                    <Card sx={{
                        bgcolor: COLORS.glassBg,
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        color: '#fff',
                        borderRadius: '16px',
                        border: `1px solid ${COLORS.glassBorderUrl}`,
                        borderTop: `1px solid ${COLORS.glassBorderTop}`,
                        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
                        flexGrow: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: 300,
                        overflow: 'hidden'
                    }}>
                        <CardContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h6" sx={{ fontFamily: '"Playfair Display", serif', color: COLORS.gold, fontWeight: 600, fontSize: '1rem' }}>
                                    Mural de Avisos
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    {canManageNotices && (
                                        <IconButton size="small" onClick={handleOpenAddNotice} sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: COLORS.gold } }}>
                                            <AddIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                    <Button
                                        size="small"
                                        onClick={handleOpenAllNotices}
                                        sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', '&:hover': { color: '#fff' } }}
                                    >
                                        VER TODOS
                                    </Button>
                                </Box>
                            </Box>
                            <List disablePadding sx={{ overflowY: 'auto', flexGrow: 1, p: 2 }}>

                                {/* 1. Próxima Sessão (Merged here) */}
                                {stats?.next_session ? (
                                    <ListItemButton
                                        onClick={() => handleNoticeClick('Próxima Sessão', `
                                    <strong>Título:</strong> ${stats.next_session!.title}<br/>
                                    <strong>Data:</strong> ${new Date(stats.next_session!.session_date).toLocaleDateString('pt-BR')}<br/>
                                    <strong>Horário:</strong> ${stats.next_session!.start_time || 'A definir'}<br/>
                                    <strong>Local:</strong> Templo Principal
                                `)}
                                        sx={{
                                            alignItems: 'flex-start',
                                            p: 1.5,
                                            border: `1px solid rgba(255,255,255,0.05)`,
                                            bgcolor: 'transparent',
                                            mb: 1,
                                            transition: 'all 0.2s',
                                            '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
                                        }}
                                    >
                                        <Castle sx={{ color: COLORS.gold, fontSize: 20, mt: 0.5, mr: 1.5 }} />
                                        <ListItemText
                                            primary="PRÓXIMA SESSÃO"
                                            primaryTypographyProps={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: 1, color: COLORS.gold }}
                                            secondary={
                                                <>
                                                    <Typography component="span" variant="body2" sx={{ color: '#fff', display: 'block', fontWeight: 400, mt: 0.5 }}>
                                                        {stats.next_session.title}
                                                    </Typography>
                                                    <Typography component="span" variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', mt: 0.5, display: 'block', fontStyle: 'italic' }}>
                                                        {new Date(stats.next_session.session_date).toLocaleDateString('pt-BR')} às {stats.next_session.start_time}
                                                    </Typography>
                                                </>
                                            }
                                        />
                                    </ListItemButton>
                                ) : (
                                    <ListItem sx={{ alignItems: 'flex-start', p: 2, border: '1px dashed rgba(255,255,255,0.1)' }}>
                                        <Castle sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 20, mt: 0.5, mr: 1.5 }} />
                                        <ListItemText primary="Nenhuma sessão agendada" secondaryTypographyProps={{ color: 'rgba(255,255,255,0.5)' }} />
                                    </ListItem>
                                )}

                                {/* 2. Other Notices */}
                                {stats?.active_notices && stats.active_notices.length > 0 ? (
                                    stats.active_notices.map((notice) => (
                                        <ListItemButton
                                            key={notice.id}
                                            onClick={() => handleNoticeClick(notice.title, notice.content)}
                                            sx={{ alignItems: 'flex-start', p: 1.5, borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.2s', '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}
                                        >
                                            <Campaign sx={{ color: COLORS.blue, fontSize: 18, mt: 0.5, mr: 1.5 }} />
                                            <ListItemText
                                                primary={notice.title}
                                                primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 500, color: '#fff' }}
                                                secondary="Clique para ver detalhes."
                                                secondaryTypographyProps={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', mt: 0.5, fontStyle: 'italic' }}
                                            />
                                        </ListItemButton>
                                    ))
                                ) : null}
                            </List>
                        </CardContent>
                    </Card>

                    {/* Quick Access links replacing Escala and Classificados */}
                    <Box sx={{ flexShrink: 0 }}>
                        <QuickAccessWidget
                            onOpenClassifieds={handleOpenClassifiedsModal}
                            onOpenDiningScale={() => alert("Modal da Escala do Ágape pronto para ser implementado.")}
                        />
                    </Box>

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
                            {selectedEvents.map((event, idx) => {
                                const normalizedType = normalizeEventType(event.type);
                                let IconComponent = EventIcon;

                                if (normalizedType === 'Elevação' || normalizedType === 'Iniciação' || normalizedType === 'Exaltação') {
                                    IconComponent = ArchitectureIcon;
                                }
                                else if (normalizedType === 'Aniversário') IconComponent = CakeIcon;
                                else if (normalizedType === 'Instalação') IconComponent = GavelIcon;
                                else if (normalizedType === 'Casamento') IconComponent = WeddingIcon;

                                const color = EVENT_COLORS[event.type] || COLORS.blue;

                                return (
                                    <ListItem key={idx} sx={{ px: 0, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'flex-start' }}>
                                        <IconComponent sx={{ color: color, fontSize: 18, mr: 1.5, mt: 0.5, flexShrink: 0 }} />
                                        <ListItemText
                                            primary={event.title}
                                            secondary={normalizedType}
                                            primaryTypographyProps={{ color: '#fff', fontWeight: 500 }}
                                            secondaryTypographyProps={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontStyle: 'italic' }}
                                        />
                                    </ListItem>
                                );
                            })}
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
                            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={member.id}>
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
                                            <span style={{ opacity: 0.5 }}>✉</span> {member.email}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <span style={{ opacity: 0.5 }}>📞</span> {member.phone || 'Sem telefone'}
                                        </Typography>
                                    </Box>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
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

        </Box >
    );
};

export default LodgeDashboard;
