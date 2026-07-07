import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Box,
    Grid,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    List,
    ListItem,
    ListItemText,
    Avatar,
    Typography,
    Divider,
    IconButton,
    DialogContentText,
    Chip,
    Card
} from '@mui/material';
import {
    Close as CloseIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Campaign,
    Event as EventIcon,
    Cake as CakeIcon,
    Gavel as GavelIcon,
    AllInclusive as WeddingIcon,
    Architecture as ArchitectureIcon,
    ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { getDashboardStats, getCalendarEvents, getNotices, createNotice, updateNotice, deleteNotice, DashboardStats, CalendarEvent, Notice } from '@/modules/core/services/dashboardService';
import MinhaLojaWidget from '@/modules/core/components/MinhaLojaWidget';

import LodgeMembersWidget from '@/modules/core/components/LodgeMembersWidget';
import LodgeCommemorativeEventsWidget from '@/modules/core/components/LodgeCommemorativeEventsWidget';
import LodgeNoticesWidget from '@/modules/core/components/LodgeNoticesWidget';
import LodgeSessionsWidget from '@/modules/core/components/LodgeSessionsWidget';
import { useAuth } from '@/modules/access_control/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { normalizeEventType, EVENT_COLORS, ACCENT_COLOR } from '@/modules/core/constants/LodgeDashboardConstants';

const LodgeDashboard: React.FC = () => {
    const { user } = useAuth();
    const theme = useTheme();
    const navigate = useNavigate();

    // Permission Logic
    const canManageLodge =
        user?.user_type === 'super_admin' ||
        user?.user_type === 'webmaster' ||
        (user?.user_type === 'member' && ['Venerável Mestre', 'Secretário', 'Secretário Adjunto'].includes(user?.active_role_name || ''));

    const canManageNotices = canManageLodge;

    const [currentDate, setCurrentDate] = useState(new Date());
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);

    const [filters, setFilters] = useState({
        sessoes: true,
        aniversarios: true,
        maconicos: true,
    });

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedDay, setSelectedDay] = useState<number | null>(null);

    const [noticeModalOpen, setNoticeModalOpen] = useState(false);
    const [allNoticesModalOpen, setAllNoticesModalOpen] = useState(false);
    const [addNoticeModalOpen, setAddNoticeModalOpen] = useState(false);
    const [selectedNotice, setSelectedNotice] = useState<{ title: string; content: string } | null>(null);
    const [notices, setNotices] = useState<Notice[]>([]);

    const [newNoticeTitle, setNewNoticeTitle] = useState('');
    const [newNoticeContent, setNewNoticeContent] = useState('');
    const [newNoticeExpiration, setNewNoticeExpiration] = useState('');
    const [editingNoticeId, setEditingNoticeId] = useState<number | null>(null);

    const [membersModalOpen, setMembersModalOpen] = useState(false);

    const handleOpenClassifiedsModal = () => {
        navigate('/dashboard/lodge-dashboard/obreiro/classificados');
    };

    useEffect(() => {
        const fetchStats = async () => {
            if (!user?.lodge_id) {
                setLoading(false);
                return;
            }
            try {
                const data = await getDashboardStats();
                setStats(data);
            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
            }
        };
        fetchStats();
    }, [user?.lodge_id]);

    useEffect(() => {
        const fetchEvents = async () => {
            if (!user?.lodge_id) {
                setLoading(false);
                return;
            }
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
    }, [currentDate, user?.lodge_id]);

    const handlePrevMonth = useCallback(() => {
        setCurrentDate(prevDate => new Date(prevDate.getFullYear(), prevDate.getMonth() - 1, 1));
    }, []);

    const handleNextMonth = useCallback(() => {
        setCurrentDate(prevDate => new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 1));
    }, []);

    const handleToday = useCallback(() => {
        setCurrentDate(new Date());
    }, []);

    const handleDayClick = useCallback((day: number) => {
        setSelectedDay(day);
        setModalOpen(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setModalOpen(false);
        setSelectedDay(null);
    }, []);

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

    const { daysInMonth, firstDayOfMonth } = useMemo(() => {
        const days = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
        const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
        return { daysInMonth: days, firstDayOfMonth: firstDay };
    }, [currentDate]);

    const filteredEvents = useMemo(() => {
        return calendarEvents.filter(event => {
            if (['sessao', 'evento'].includes(event.type)) return filters.sessoes;
            if (['aniversario', 'aniversario_familiar', 'casamento'].includes(event.type)) return filters.aniversarios;
            if (['iniciacao', 'elevacao', 'exaltacao', 'instalacao'].includes(event.type)) return filters.maconicos;
            return true;
        });
    }, [calendarEvents, filters]);

    const selectedEvents = useMemo(() => {
        return selectedDay ? filteredEvents.filter(e => e.date === selectedDay) : [];
    }, [filteredEvents, selectedDay]);

    const selectedDateObj = useMemo(() => {
        return selectedDay ? new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay) : null;
    }, [currentDate, selectedDay]);

    const commemorativeEvents = useMemo(() => {
        const commemorativeTypes = ['Aniversário', 'Elevação', 'Iniciação', 'Exaltação', 'Casamento', 'Instalação'];
        return calendarEvents
            .filter(event => commemorativeTypes.includes(normalizeEventType(event.type)))
            .sort((a, b) => {
                const dayA = parseInt(a.full_date.split('-')[2], 10);
                const dayB = parseInt(b.full_date.split('-')[2], 10);
                return dayA - dayB;
            });
    }, [calendarEvents]);

    if (!user?.lodge_id) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: theme.palette.background.default }}>
                <Typography variant="h5" sx={{ color: ACCENT_COLOR, mb: 2, fontFamily: '"Inter", sans-serif' }}>
                    Nenhuma Loja Selecionada
                </Typography>
                <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                    Você não está associado a nenhuma loja no contexto atual.
                </Typography>
            </Box>
        );
    }

    if (loading && !stats) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: theme.palette.background.default }}>
                <CircularProgress sx={{ color: ACCENT_COLOR }} />
            </Box>
        );
    }

    return (
        <Box sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            height: { xs: 'auto', md: 'calc(100vh - 80px)' },
            minHeight: { xs: 'calc(100vh - 80px)', md: 'auto' },
            bgcolor: theme.palette.background.default,
            color: theme.palette.text.primary,
            fontFamily: '"Inter", sans-serif',
            p: 2,
            overflow: { xs: 'visible', md: 'hidden' }
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Button 
                    startIcon={<ArrowBackIcon />} 
                    onClick={() => navigate(-1)}
                    sx={{ 
                        color: 'rgba(255,255,255,0.7)',
                        '&:hover': { color: '#fff', backgroundColor: 'rgba(255,255,255,0.1)' }
                    }}
                >
                    Voltar
                </Button>
            </Box>
            <Grid container spacing={1.5} columns={10} sx={{ flexGrow: 1, height: '100%' }}>
                {/* Left Column - Minha Loja, Membros, Datas Comemorativas */}
                <Grid size={{ xs: 10, lg: 2 }} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, height: { xs: 'auto', lg: '100%' }, overflowY: { xs: 'auto', lg: 'hidden' } }}>
                    <Box sx={{ flexShrink: 0 }}>
                        <MinhaLojaWidget lodgeInfo={stats?.lodge_info} canManageLodge={canManageLodge} />
                    </Box>

                    <LodgeMembersWidget stats={stats} onClick={() => setMembersModalOpen(true)} />

                    <LodgeCommemorativeEventsWidget commemorativeEvents={commemorativeEvents} currentDate={currentDate} />
                </Grid>

                {/* Core Column - Massive Calendar */}
                <Grid size={{ xs: 10, lg: 6 }} sx={{ height: { xs: 'auto', lg: '100%' }, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                    <LodgeSessionsWidget
                        currentDate={currentDate}
                        daysInMonth={daysInMonth}
                        firstDayOfMonth={firstDayOfMonth}
                        filteredEvents={filteredEvents}
                        filters={filters}
                        setFilters={setFilters}
                        onPrevMonth={handlePrevMonth}
                        onNextMonth={handleNextMonth}
                        onToday={handleToday}
                        onDayClick={handleDayClick}
                    />
                </Grid>

                {/* Right Column - Mural, QuickAccessWidget */}
                <Grid size={{ xs: 10, lg: 2 }} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, height: { xs: 'auto', lg: '100%' }, overflowY: { xs: 'auto', lg: 'hidden' } }}>
                    <LodgeNoticesWidget
                        stats={stats}
                        canManageNotices={canManageNotices}
                        onOpenAddNotice={handleOpenAddNotice}
                        onOpenAllNotices={handleOpenAllNotices}
                        onNoticeClick={handleNoticeClick}
                    />


                </Grid>
            </Grid>

            {/* Event Details Modal */}
            <Dialog open={modalOpen} onClose={handleCloseModal} PaperProps={{ sx: { bgcolor: theme.palette.background.paper, minWidth: 320 } }}>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.palette.divider}` }}>
                    <Typography variant="h6" sx={{ fontFamily: '"Inter", sans-serif', color: ACCENT_COLOR }}>
                        {selectedDateObj?.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </Typography>
                    <IconButton onClick={handleCloseModal} size="small" sx={{ color: theme.palette.text.secondary }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    {selectedEvents.length > 0 ? (
                        <List>
                            {selectedEvents.map((event, idx) => {
                                const normalizedType = normalizeEventType(event.type);
                                let IconComponent = EventIcon;
                                if (['Elevação', 'Iniciação', 'Exaltação'].includes(normalizedType)) {
                                    IconComponent = ArchitectureIcon;
                                } else if (normalizedType === 'Aniversário') IconComponent = CakeIcon;
                                else if (normalizedType === 'Instalação') IconComponent = GavelIcon;
                                else if (normalizedType === 'Casamento') IconComponent = WeddingIcon;

                                const color = EVENT_COLORS[event.type] || 'info.main';

                                return (
                                    <ListItem key={idx} sx={{ px: 0, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'flex-start' }}>
                                        <IconComponent sx={{ color: color, fontSize: 18, mr: 1.5, mt: 0.5, flexShrink: 0 }} />
                                        <ListItemText
                                            primary={event.title}
                                            secondary={normalizedType}
                                            primaryTypographyProps={{ color: theme.palette.text.primary, fontWeight: 500 }}
                                            secondaryTypographyProps={{ color: theme.palette.text.secondary, fontSize: '0.75rem', fontStyle: 'italic' }}
                                        />
                                    </ListItem>
                                );
                            })}
                        </List>
                    ) : (
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, textAlign: 'center' }}>
                            Nenhum evento registrado.
                        </Typography>
                    )}
                </DialogContent>
            </Dialog>

            {/* Notice Detail Modal */}
            <Dialog open={noticeModalOpen} onClose={handleCloseNoticeModal} PaperProps={{ sx: { bgcolor: theme.palette.background.paper, minWidth: 400 } }}>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.palette.divider}` }}>
                    <Typography variant="h6" sx={{ fontFamily: '"Inter", sans-serif', color: ACCENT_COLOR }}>
                        {selectedNotice?.title}
                    </Typography>
                    <IconButton onClick={handleCloseNoticeModal} size="small" sx={{ color: theme.palette.text.secondary }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    {selectedNotice && (
                        <Typography variant="body1" sx={{ color: theme.palette.text.primary, lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: selectedNotice.content }} />
                    )}
                </DialogContent>
                <DialogActions sx={{ borderTop: `1px solid ${theme.palette.divider}` }}>
                    <Button onClick={handleCloseNoticeModal} sx={{ color: ACCENT_COLOR }}>Fechar</Button>
                </DialogActions>
            </Dialog>

            {/* Members Network Modal */}
            <Dialog open={membersModalOpen} onClose={() => setMembersModalOpen(false)} maxWidth="lg" fullWidth PaperProps={{ sx: { bgcolor: theme.palette.background.default, minHeight: '60vh' } }}>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.palette.divider}`, pb: 2 }}>
                    <Box>
                        <Typography variant="h5" sx={{ fontFamily: '"Inter", sans-serif', color: ACCENT_COLOR }}>
                            Obreiros da Loja
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                            {stats?.lodge_members_stats?.total || 0} Irmãos Ativos
                        </Typography>
                    </Box>
                    <IconButton onClick={() => setMembersModalOpen(false)} sx={{ color: theme.palette.text.secondary }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ mt: 2, pb: 4 }}>
                    <Grid container spacing={2}>
                        {stats?.lodge_members_stats?.members_list?.map((member) => (
                            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={member.id}>
                                <Card sx={{ bgcolor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3, transition: 'all 0.2s', '&:hover': { transform: 'translateY(-4px)', borderColor: ACCENT_COLOR } }}>
                                    <Box sx={{ position: 'relative', mb: 2 }}>
                                        <Avatar
                                            src={member.profile_picture_path ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${member.profile_picture_path}` : undefined}
                                            alt={member.full_name}
                                            sx={{ width: 80, height: 80, border: `2px solid ${member.degree === 'Aprendiz' ? theme.palette.success.main : member.degree === 'Companheiro' ? theme.palette.info.main : theme.palette.warning.main}` }}
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
                                                bgcolor: theme.palette.background.default,
                                                color: member.degree === 'Aprendiz' ? 'success.main' : member.degree === 'Companheiro' ? 'info.main' : ACCENT_COLOR,
                                                border: `1px solid ${member.degree === 'Aprendiz' ? theme.palette.success.main : member.degree === 'Companheiro' ? theme.palette.info.main : theme.palette.warning.main}`
                                            }}
                                        />
                                    </Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, textAlign: 'center', mb: 0.5, lineHeight: 1.2 }}>
                                        {member.full_name}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary, mb: 2 }}>
                                        CIM: {member.cim || 'N/A'}
                                    </Typography>
                                    <Box sx={{ width: '100%', pt: 2, borderTop: `1px solid ${theme.palette.divider}`, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <span style={{ opacity: 0.5 }}>✉</span> {member.email}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'flex', alignItems: 'center', gap: 1 }}>
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
            <Dialog open={addNoticeModalOpen} onClose={handleCloseAddNotice} PaperProps={{ sx: { bgcolor: theme.palette.background.default, minWidth: 400 } }}>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.palette.divider}` }}>
                    <Typography variant="h6" sx={{ fontFamily: '"Inter", sans-serif', color: ACCENT_COLOR }}>
                        Novo Aviso
                    </Typography>
                    <IconButton onClick={handleCloseAddNotice} size="small" sx={{ color: theme.palette.text.secondary }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <DialogContentText sx={{ color: theme.palette.text.secondary, mb: 2 }}>
                        Publique um novo aviso para os membros da loja.
                    </DialogContentText>
                    <TextField autoFocus margin="dense" id="title" label="Título do Aviso" type="text" fullWidth variant="outlined" value={newNoticeTitle} onChange={(e) => setNewNoticeTitle(e.target.value)} sx={{ mb: 2 }} />
                    <TextField margin="dense" id="content" label="Conteúdo" type="text" fullWidth multiline rows={4} variant="outlined" value={newNoticeContent} onChange={(e) => setNewNoticeContent(e.target.value)} />
                    <TextField margin="dense" id="expiration" label="Data de Expiração (Opcional)" type="date" fullWidth variant="outlined" InputLabelProps={{ shrink: true }} value={newNoticeExpiration} onChange={(e) => setNewNoticeExpiration(e.target.value)} sx={{ '& input::-webkit-calendar-picker-indicator': { filter: theme.palette.mode === 'dark' ? 'invert(1)' : 'none' } }} />
                </DialogContent>
                <DialogActions sx={{ borderTop: `1px solid ${theme.palette.divider}`, p: 2 }}>
                    <Button onClick={handleCloseAddNotice} sx={{ color: theme.palette.text.secondary }}>Cancelar</Button>
                    <Button onClick={handleSaveNotice} variant="contained" sx={{ bgcolor: ACCENT_COLOR, color: '#000', '&:hover': { bgcolor: 'warning.dark' } }}>
                        {editingNoticeId ? 'Salvar Alterações' : 'Publicar'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* All Notices Modal */}
            <Dialog open={allNoticesModalOpen} onClose={() => setAllNoticesModalOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { bgcolor: theme.palette.background.default, minHeight: '50vh' } }}>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.palette.divider}`, pb: 2 }}>
                    <Box>
                        <Typography variant="h5" sx={{ fontFamily: '"Inter", sans-serif', color: ACCENT_COLOR }}>
                            Mural de Avisos - Completo
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                            Todos os avisos da loja
                        </Typography>
                    </Box>
                    <IconButton onClick={() => setAllNoticesModalOpen(false)} sx={{ color: theme.palette.text.secondary }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ mt: 2, pb: 4 }}>
                    <List>
                        {notices.length > 0 ? (
                            notices.map((notice) => (
                                <ListItem key={notice.id} sx={{ bgcolor: theme.palette.background.paper, mb: 2, borderRadius: 1, border: `1px solid ${theme.palette.divider}` }}>
                                    <Box sx={{ width: '100%' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'flex-start' }}>
                                            <Box>
                                                <Typography variant="subtitle1" sx={{ color: ACCENT_COLOR, fontWeight: 700 }}>
                                                    {notice.title}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block' }}>
                                                    Publicado em: {new Date(notice.date_posted).toLocaleDateString('pt-BR')}
                                                </Typography>
                                                {notice.expiration_date && (
                                                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block' }}>
                                                        Expira em: {new Date(notice.expiration_date).toLocaleDateString('pt-BR')}
                                                    </Typography>
                                                )}
                                            </Box>
                                            {canManageNotices && (
                                                <Box>
                                                    <IconButton size="small" onClick={() => handleEditClick(notice)} sx={{ color: theme.palette.text.secondary, '&:hover': { color: 'info.main' } }}>
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton size="small" onClick={() => handleDeleteClick(notice.id)} sx={{ color: theme.palette.text.secondary, '&:hover': { color: 'error.main' } }}>
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            )}
                                        </Box>
                                        <Typography variant="body2" sx={{ color: theme.palette.text.primary, whiteSpace: 'pre-line' }}>
                                            {notice.content}
                                        </Typography>
                                    </Box>
                                </ListItem>
                            ))
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 5 }}>
                                <Campaign sx={{ fontSize: 60, color: theme.palette.text.disabled, mb: 2 }} />
                                <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
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
