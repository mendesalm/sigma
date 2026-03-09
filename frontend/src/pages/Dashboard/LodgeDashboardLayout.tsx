import React, { useState, useEffect, useContext } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CssBaseline,
  Typography,
  Avatar,
  useTheme,
  alpha,
  AppBar,
  Toolbar,
  ListSubheader,
  Skeleton,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Logout,
  Dashboard as DashboardIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';

// Import Sigma Logo removed
import {
  SquareCompassIcon,
  AttendanceBookIcon,
  VisitationIcon,
  ScrollIcon,
  BellIcon,
  BooksIcon,
  QuillBookIcon,
  ChecklistIcon,
  TempleColumnsIcon
} from '../../components/icons/MasonicMenuIcons';

// Import Local Icons
import HomeIcon from '../../assets/icons/Home.png';
import ObreiroIcon from '../../assets/icons/Obreiro.png';
import SecretariaIcon from '../../assets/icons/Secretaria.png';
import ChancelariaIcon from '../../assets/icons/Chancelaria.png';
import WebmasterIcon from '../../assets/icons/Webmaster.png';

const SIDEBAR_WIDTH_EXPANDED = 80;
const SIDEBAR_WIDTH_COLLAPSED = 80;
const HEADER_HEIGHT = 70; // Slightly taller for better logo fit

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Define menu structure - Nova estrutura hierárquica
const MENU_CONFIG = [
  {
    id: 'home',
    label: 'Dashboard',
    icon: <img src={HomeIcon} alt="Dashboard" style={{ width: 35, height: 35, objectFit: 'contain' }} />,
    path: '/dashboard/lodge-dashboard',
    subItems: [] // HOME não possui menu secundário
  },
  {
    id: 'obreiro',
    label: 'Obreiros',
    icon: <img src={ObreiroIcon} alt="Obreiros" style={{ width: 35, height: 35, objectFit: 'contain' }} />,
    path: '/dashboard/lodge-dashboard/obreiro',
    subItems: [
      { text: 'Meu Cadastro', path: '/dashboard/lodge-dashboard/obreiro/meu-cadastro', icon: <SquareCompassIcon sx={{ fontSize: 20 }} /> },
      { text: 'Minhas Presenças', path: '/dashboard/lodge-dashboard/obreiro/minhas-presencas', icon: <AttendanceBookIcon sx={{ fontSize: 20 }} /> },
      { text: 'Minhas Visitações', path: '/dashboard/lodge-dashboard/obreiro/minhas-visitacoes', icon: <VisitationIcon sx={{ fontSize: 20 }} /> },
      { text: 'Publicações', path: '/dashboard/lodge-dashboard/obreiro/minhas-publicacoes', icon: <ScrollIcon sx={{ fontSize: 20 }} /> },
      { text: 'Meus Anúncios', path: '/dashboard/lodge-dashboard/obreiro/meus-anuncios', icon: <BellIcon sx={{ fontSize: 20 }} /> },
      { text: 'Meus Empréstimos', path: '/dashboard/lodge-dashboard/obreiro/meus-emprestimos', icon: <BooksIcon sx={{ fontSize: 20 }} /> },
    ]
  },
  {
    id: 'secretario',
    label: 'Secretaria',
    icon: <img src={SecretariaIcon} alt="Secretaria" style={{ width: 35, height: 35, objectFit: 'contain' }} />,
    path: '/dashboard/lodge-dashboard/secretario',
    subItems: [
      // 1 - Gestão de Irmãos
      { type: 'header', text: 'Irmãos' },
      { text: 'Cadastro de Membros', path: '/dashboard/lodge-dashboard/secretario/cadastro', icon: <QuillBookIcon sx={{ fontSize: 20 }} /> },
      { text: 'Relatórios do Quadro', path: '/dashboard/lodge-dashboard/secretario/relatorios', icon: <ChecklistIcon sx={{ fontSize: 20 }} /> },

      // 2 - Gestão de Sessões Maçonicas
      { type: 'header', text: 'Sessões' },
      { text: 'Agenda', path: '/dashboard/lodge-dashboard/secretario/sessoes', icon: <TempleColumnsIcon sx={{ fontSize: 20 }} /> },
      { text: 'Registro de Presenças', path: '/dashboard/lodge-dashboard/secretario/presencas', icon: <AttendanceBookIcon sx={{ fontSize: 20 }} /> },

      // 3 - Gestão de Documentos
      { type: 'header', text: 'Documentos' },
      { text: 'Publicações', path: '/dashboard/lodge-dashboard/secretario/publicacoes', icon: <ScrollIcon sx={{ fontSize: 20 }} /> },
      { text: 'Pranchas', path: '/dashboard/lodge-dashboard/secretario/pranchas', icon: <ScrollIcon sx={{ fontSize: 20 }} />, disabled: true },

      // 4 - Gestão de Processos
      { type: 'header', text: 'Processos' },
      { text: 'Admissão', path: '/dashboard/lodge-dashboard/secretario/processos/admissao', icon: <ChecklistIcon sx={{ fontSize: 20 }} />, disabled: true },

      // 5 - Gestão de Exercícios Maçônicos
      { type: 'header', text: 'Exercícios Maçônicos' },
      { text: 'Gestão de Diretoria', path: '/dashboard/lodge-dashboard/secretario/exercicio/diretoria', icon: <SquareCompassIcon sx={{ fontSize: 20 }} /> },
    ]
  },
  {
    id: 'chanceler',
    label: 'Chancelaria',
    icon: <img src={ChancelariaIcon} alt="Chancelaria" style={{ width: 35, height: 35, objectFit: 'contain' }} />,
    path: '/dashboard/lodge-dashboard/chanceler',
    subItems: [
      { text: 'Cadastro', path: '/dashboard/lodge-dashboard/chanceler/cadastro', icon: <QuillBookIcon sx={{ fontSize: 20 }} /> },
      { text: 'Presenças', path: '/dashboard/lodge-dashboard/chanceler/presencas', icon: <ChecklistIcon sx={{ fontSize: 20 }} /> },
      { text: 'Visitações', path: '/dashboard/lodge-dashboard/chanceler/visitacoes', icon: <VisitationIcon sx={{ fontSize: 20 }} /> },
      { text: 'Visitantes', path: '/dashboard/lodge-dashboard/chanceler/visitantes', icon: <PersonIcon sx={{ fontSize: 20 }} /> },
      { text: 'Gestão de Comissões', path: '/dashboard/lodge-dashboard/chanceler/comissoes', icon: <ChecklistIcon sx={{ fontSize: 20 }} /> },
    ]
  },
  {
    id: 'webmaster',
    label: 'Webmaster',
    icon: <img src={WebmasterIcon} alt="Webmaster" style={{ width: 35, height: 35, objectFit: 'contain' }} />,
    path: '/dashboard/lodge-dashboard/webmaster',
    subItems: [
      { text: 'Minha Loja', path: '/dashboard/lodge-dashboard/webmaster/minha-loja', icon: <TempleColumnsIcon sx={{ fontSize: 20 }} /> },
      { text: 'Administrações', path: '/dashboard/lodge-dashboard/webmaster/administracoes', icon: <TempleColumnsIcon sx={{ fontSize: 20 }} /> },
      { text: 'Documentos', path: '/dashboard/lodge-dashboard/webmaster/documentos', icon: <ScrollIcon sx={{ fontSize: 20 }} /> },
    ]
  },
];

import api from '../../services/api';

const LodgeDashboardLayout: React.FC = () => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext) || {};
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [hoveredMenuId, setHoveredMenuId] = useState<string | null>(null);
  const isSidebarExpanded = false;
  const [lodgeData, setLodgeData] = useState<any>(null);

  useEffect(() => {
    const fetchLodgeData = async () => {
      if (user?.lodge_id) {
        try {
          const response = await api.get(`/lodges/${user.lodge_id}`);
          setLodgeData(response.data);
        } catch (error) {
          console.error("Failed to fetch lodge data:", error);
        }
      }
    };
    fetchLodgeData();
  }, [user]);

  const handleLogout = () => {
    if (logout) {
      logout();
      navigate('/login');
    }
  };

  // Helper to generate logo URL
  const getLogoUrl = () => {
    if (!lodgeData) return undefined;
    // Replica a lógica do backend (lodge_service.py) para gerar o nome da pasta
    const safeNumber = lodgeData.lodge_number
      ? lodgeData.lodge_number.replace(/[^a-zA-Z0-9 \-_]/g, '').trim().replace(/\s+/g, '_')
      : `id_${lodgeData.id}`;

    return `${API_URL}/storage/lodges/loja_${safeNumber}/assets/images/logo/logo_jpg.png`;
  };

  const logoUrl = getLogoUrl();

  // Filter menu based on user role
  const filteredMenu = React.useMemo(() => {
    if (!user) return [];

    return MENU_CONFIG.filter(item => {
      // Always show Home and Obreiro
      if (item.id === 'home' || item.id === 'obreiro') return true;

      // Webmaster specific
      if (item.id === 'webmaster') {
        return user.user_type === 'webmaster' || user.user_type === 'super_admin';
      }

      // Webmasters and SuperAdmins see everything else (except webmaster specific which is handled above, but here we can just let them pass if we want, OR explicitly filter)
      // Actually, let's refine:

      // If user is super_admin, they see everything
      if (user.user_type === 'super_admin') return true;

      // If user is webmaster, they see everything EXCEPT maybe purely role-based stuff if they don't have the role? 
      // Typically Webmasters manage the system, so they see all admin menus.
      if (user.user_type === 'webmaster') return true;

      // Check specific roles for members
      if (item.id === 'secretario') {
        return user.active_role_name === 'Secretário';
      }
      if (item.id === 'chanceler') {
        return user.active_role_name === 'Chanceler';
      }

      return false;
    });
  }, [user]);

  // Determine active category based on current path
  useEffect(() => {
    const currentPath = location.pathname;

    // If exact match for dashboard home, no active category
    if (currentPath === '/dashboard/lodge-dashboard' || currentPath === '/dashboard/lodge-dashboard/') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveCategory(null);
      return;
    }

    // Find category that matches the current path
    let found = false;
    for (const category of filteredMenu) {
      // Skip HOME menu (no subitems)
      if (category.subItems.length === 0) continue;

      // Check if we're in any of the category's sub-routes
      // Example: /dashboard/lodge-dashboard/obreiro/meu-cadastro should match 'obreiro'
      const categoryBasePath = category.path;

      if (currentPath.startsWith(categoryBasePath)) {
        setActiveCategory(category.id);
        found = true;
        break;
      }
    }

    if (!found) {
      setActiveCategory(null);
    }
  }, [location.pathname, filteredMenu]);

  const handleMainIconClick = (event: React.MouseEvent<HTMLElement>, category: typeof MENU_CONFIG[0]) => {
    if (category.subItems.length === 0) {
      setActiveCategory(null);
      setMenuAnchorEl(null);
      setHoveredMenuId(null);
      navigate(category.path);
      return;
    }

    setMenuAnchorEl(event.currentTarget);
    setHoveredMenuId(category.id);
  };

  const renderSidebarContent = () => {
    return (
      <Box sx={{ p: isSidebarExpanded ? 2 : 1, display: 'flex', flexDirection: 'column', height: '100%', pt: 4 }}>
        <List sx={{ width: '100%', flexGrow: 1, pt: 0 }}>
          {filteredMenu.map((item) => {
            const isActive = activeCategory === item.id || (!activeCategory && location.pathname === item.path);

            return (
              <React.Fragment key={item.id}>
                <ListItemButton
                  onClick={(e) => handleMainIconClick(e, item)}
                  sx={{
                    flexDirection: isSidebarExpanded ? 'row' : 'column',
                    alignItems: 'center',
                    justifyContent: isSidebarExpanded ? 'flex-start' : 'center',
                    py: isSidebarExpanded ? 1.5 : 2,
                    px: isSidebarExpanded ? 2 : 1,
                    mb: 1,
                    borderRadius: 2,
                    backgroundColor: isActive ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                    color: isActive ? theme.palette.primary.light : 'rgba(255,255,255,0.6)',
                    borderLeft: isSidebarExpanded && isActive ? `4px solid ${theme.palette.primary.main}` : '4px solid transparent',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.05),
                      color: '#fff',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: isSidebarExpanded ? 48 : 'auto',
                      mb: isSidebarExpanded ? 0 : 1,
                      color: 'inherit',
                      justifyContent: 'center',
                      '& img': {
                        transition: 'all 0.3s ease',
                        filter: isActive
                          ? `drop-shadow(0 0 8px ${alpha(theme.palette.primary.main, 0.5)}) grayscale(0%)`
                          : 'grayscale(100%) opacity(0.7)'
                      },
                      '&:hover img': {
                        filter: `drop-shadow(0 0 5px ${theme.palette.primary.main}) grayscale(0%) opacity(1)`
                      }
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>

                  {isSidebarExpanded ? (
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: isActive ? 700 : 500, letterSpacing: 0.5 }}
                    />
                  ) : (
                    <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 600 }}>
                      {item.label}
                    </Typography>
                  )}
                </ListItemButton>

                {/* Sub-menu Flyout for collapsed mode */}
                <Menu
                  anchorEl={menuAnchorEl}
                  open={Boolean(menuAnchorEl) && hoveredMenuId === item.id}
                  onClose={() => { setMenuAnchorEl(null); setHoveredMenuId(null); }}
                  anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'center', horizontal: 'left' }}
                  sx={{ '& .MuiPaper-root': { bgcolor: '#0B0F19', color: '#fff', border: `1px solid rgba(255,255,255,0.1)`, ml: 2, minWidth: 240, boxShadow: `0 8px 32px 0 rgba(0,0,0,0.6)` } }}
                >
                  <Box sx={{ px: 2, pt: 1, pb: 2, borderBottom: '1px solid rgba(255,255,255,0.05)', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ color: theme.palette.primary.main, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                      {item.label}
                    </Typography>
                  </Box>

                  {item.subItems.map((sub: any, idx: number) => {
                    if (sub.type === 'header') {
                      return (
                        <ListSubheader
                          key={idx}
                          disableSticky
                          sx={{ bgcolor: 'transparent', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 800, lineHeight: '24px', mt: 1, mb: 0.5, px: 2 }}
                        >
                          {sub.text}
                        </ListSubheader>
                      );
                    }

                    const isDisabled = sub.disabled;
                    const isActiveLink = location.pathname === sub.path;

                    return (
                      <MenuItem
                        key={idx}
                        disabled={isDisabled}
                        onClick={() => {
                          if (!isDisabled && sub.path) {
                            navigate(sub.path);
                            setActiveCategory(item.id);
                            setMenuAnchorEl(null);
                            setHoveredMenuId(null);
                          }
                        }}
                        sx={{
                          mb: 0.5, mx: 1, borderRadius: 1.5, py: 1,
                          bgcolor: isActiveLink ? alpha(theme.palette.primary.main, 0.15) : 'transparent',
                          color: isActiveLink ? theme.palette.primary.main : 'rgba(255,255,255,0.7)',
                          display: 'flex', gap: 1.5,
                          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1), color: '#fff' }
                        }}
                      >
                        {sub.icon && <Box sx={{ display: 'flex', color: 'inherit' }}>{sub.icon}</Box>}
                        <ListItemText primary={sub.text} primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: isActiveLink ? 600 : 400 }} />
                      </MenuItem>
                    );
                  })}
                </Menu>
              </React.Fragment>
            );
          })}
        </List>
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#090B10' }}>
      <CssBaseline />

      <AppBar position="static" elevation={0} sx={{ height: HEADER_HEIGHT, bgcolor: '#0B0F19', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', backgroundImage: 'none', zIndex: 1300 }}>
        <Toolbar sx={{ height: '100%', display: 'flex', justifyContent: 'space-between', px: { xs: 2, md: 4 } }}>

          {/* Left: Lodge Info & Sidebar Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pl: 3 }}>
              <Avatar
                key={logoUrl}
                src={logoUrl}
                sx={{ width: 40, height: 40, bgcolor: 'transparent', borderRadius: 0 }}
                imgProps={{ style: { objectFit: 'contain' } }}
                variant="square"
              >
                {lodgeData ? <DashboardIcon /> : <Skeleton variant="circular" width={40} height={40} />}
              </Avatar>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="subtitle1" sx={{ lineHeight: 1.2, fontWeight: 700, color: '#fff', fontFamily: '"Playfair Display", serif', letterSpacing: 1 }}>
                  {lodgeData?.lodge_name || <Skeleton width={150} />}
                </Typography>
                <Typography variant="caption" sx={{ color: theme.palette.primary.main, fontWeight: 600, letterSpacing: 1 }}>
                  {lodgeData?.lodge_number ? `LOJA Nº ${lodgeData.lodge_number}` : (lodgeData ? '' : <Skeleton width={80} />)}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Right: User Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            {user && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ textAlign: 'right', display: { xs: 'none', md: 'block' } }}>
                  <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>
                    {user.name || user.sub || 'Usuário'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5 }}>
                    {user.active_role_name || (user.user_type === 'member' ? 'Obreiro' : user.role)}
                  </Typography>
                </Box>
                <Avatar
                  src={user.profile_picture_path ? `${API_URL}${user.profile_picture_path}` : undefined}
                  sx={{ width: 36, height: 36, bgcolor: theme.palette.primary.dark, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 1 }}
                  variant="rounded"
                >
                  {user.name ? user.name.charAt(0).toUpperCase() : <PersonIcon />}
                </Avatar>
              </Box>
            )}
            <IconButton onClick={handleLogout} sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: theme.palette.error.main } }}>
              <Logout fontSize="small" />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex', flexGrow: 1, height: `calc(100vh - ${HEADER_HEIGHT}px)`, overflow: 'hidden' }}>

        {/* Single Collapsible Sidebar */}
        <Box
          sx={{
            width: isSidebarExpanded ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED,
            flexShrink: 0,
            backgroundColor: '#0B0F19',
            borderRight: '1px solid rgba(255, 255, 255, 0.05)',
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflowY: 'auto',
            overflowX: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1200
          }}
        >
          {renderSidebarContent()}
        </Box>

        {/* Main Content Area - Maximizing Space */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            backgroundColor: '#090B10', // Deepest black/navy
            backgroundImage: 'radial-gradient(circle at 100% 0%, rgba(0, 176, 255, 0.03) 0%, transparent 40%)',
            overflow: 'auto',
            height: '100%',
            pt: { xs: 1, md: 1.5 },
            px: { xs: 2, md: 4 },
            pb: { xs: 2, md: 4 }
          }}
        >
          <Box sx={{ maxWidth: '100%', margin: '0 auto', height: '100%' }}>
            <Outlet />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default LodgeDashboardLayout;
