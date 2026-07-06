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
import { AuthContext } from '@/modules/access_control/context/AuthContext';

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
} from '@/shared/components/icons/MasonicMenuIcons';

// Import Local Icons
import HomeIcon from '@/assets/icons/Home.png';
import ObreiroIcon from '@/assets/icons/Obreiro.png';
import SecretariaIcon from '@/assets/icons/Secretaria.png';
import ChancelariaIcon from '@/assets/icons/Chancelaria.png';
import WebmasterIcon from '@/assets/icons/Webmaster.png';
import TesourariaIcon from '@/assets/icons/Tesouraria.png';
import StoreIcon from '@mui/icons-material/Store';

const SIDEBAR_WIDTH_EXPANDED = 80;
const SIDEBAR_WIDTH_COLLAPSED = 80;
const HEADER_HEIGHT = 70; // Slightly taller for better logo fit

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Define menu structure - Nova estrutura hierárquica (Grids)
const MENU_CONFIG = [
  {
    id: 'home',
    label: 'Dashboard',
    icon: <img src={HomeIcon} alt="Dashboard" style={{ width: 35, height: 35, objectFit: 'contain' }} />,
    path: '/dashboard/lodge-dashboard',
    subItems: []
  },
  {
    id: 'obreiro',
    label: 'Painel do Obreiro',
    icon: <img src={ObreiroIcon} alt="Painel do Obreiro" style={{ width: 35, height: 35, objectFit: 'contain' }} />,
    path: '/dashboard/lodge-dashboard/obreiro',
    subItems: []
  },
  {
    id: 'admin',
    label: 'Painel Admin',
    icon: <img src={SecretariaIcon} alt="Painel Administrativo" style={{ width: 35, height: 35, objectFit: 'contain' }} />,
    path: '/dashboard/lodge-dashboard/admin',
    subItems: []
  }
];

import api from '@/shared/services/api';

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

    const sanitize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

    const safeNumber = lodgeData.lodge_number
      ? lodgeData.lodge_number.replace(/[^a-zA-Z0-9 \-_]/g, '').trim().replace(/\s+/g, '_')
      : `id_${lodgeData.id}`;

    if (lodgeData.potencia) {
      const safePotency = sanitize(lodgeData.potencia);
      const safeSubpotency = lodgeData.subpotencia ? sanitize(lodgeData.subpotencia) : null;
      const subpotencyPart = safeSubpotency ? `subpotencias/${safeSubpotency}/` : '';
      return `${API_URL}/storage/potencias/${safePotency}/${subpotencyPart}lojas/loja${safeNumber}/assets/images/logo/logo_jpg.png`;
    }

    // Fallback for legacy paths
    return `${API_URL}/storage/lodges/loja_${safeNumber}/assets/images/logo/logo_jpg.png`;
  };

  const logoUrl = getLogoUrl();

  // Filter menu based on user role and available modules
  const filteredMenu = React.useMemo(() => {
    if (!user) return [];

    return MENU_CONFIG.filter(item => {
      if (item.id === 'home' || item.id === 'obreiro') return true;

      if (item.id === 'admin') {
        if (user.user_type === 'super_admin' || user.user_type === 'webmaster') return true;
        const adminRoles = [
          'Venerável Mestre',
          'Secretário',
          'Secretário Adjunto',
          'Chanceler',
          'Chanceler Adjunto',
          'Tesoureiro',
          'Tesoureiro Adjunto',
          'Arquiteto',
          'Arquiteto Adjunto',
          'Bibliotecário',
          'Bibliotecário Adjunto',
          'Mestre de Harmonia',
          'Mestre de Harmonia Adjunto',
          'Mestre de Banquetes',
          'Mestre de Banquetes Adjunto'
        ];
        return adminRoles.includes(user.active_role_name);
      }
      return false;
    });
  }, [user, lodgeData]);

  // Determine active category based on current path
  useEffect(() => {
    const currentPath = location.pathname;

    if (currentPath === '/dashboard/lodge-dashboard' || currentPath === '/dashboard/lodge-dashboard/') {
      setActiveCategory('home');
      return;
    }

    if (currentPath.startsWith('/dashboard/lodge-dashboard/obreiro')) {
      setActiveCategory('obreiro');
      return;
    }

    if (currentPath.startsWith('/dashboard/lodge-dashboard/admin')) {
      setActiveCategory('admin');
      return;
    }

    setActiveCategory(null);
  }, [location.pathname]);

  const handleMainIconClick = (event: React.MouseEvent<HTMLElement>, category: typeof MENU_CONFIG[0]) => {
    setActiveCategory(category.id);
    navigate(category.path);
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

                {/* No sub-menus in the sidebar anymore */}
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
