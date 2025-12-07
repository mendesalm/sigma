import React, { useState, useEffect, useContext } from 'react';
import { Outlet, Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
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
  Toolbar
} from '@mui/material';
import { 
  Logout,
  Dashboard as DashboardIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';

// Import Sigma Logo
import SigmaLogo from '../../assets/images/SigmaLogo.png';
import MasonicHomeIcon from '../../components/icons/MasonicHomeIcon';
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

const MAIN_SIDEBAR_WIDTH = 120;
const SECONDARY_SIDEBAR_WIDTH = 250;
const HEADER_HEIGHT = 70; // Slightly taller for better logo fit

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Define menu structure - Nova estrutura hierárquica
const MENU_CONFIG = [
  {
    id: 'home',
    label: 'Home',
    icon: <MasonicHomeIcon sx={{ fontSize: 60 }} />,
    path: '/dashboard/lodge-dashboard',
    subItems: [] // HOME não possui menu secundário
  },
  {
    id: 'obreiro',
    label: 'Obreiro',
    icon: <img src={`${API_URL}/storage/assets/images/icons/Macom-D.png`} alt="Obreiro" style={{ width: 35, height: 35, objectFit: 'contain' }} />,
    path: '/dashboard/lodge-dashboard/obreiro',
    subItems: [
      { text: 'Meu Cadastro', path: '/dashboard/lodge-dashboard/obreiro/meu-cadastro', icon: <SquareCompassIcon sx={{ fontSize: 20 }} /> },
      { text: 'Minhas Presenças', path: '/dashboard/lodge-dashboard/obreiro/minhas-presencas', icon: <AttendanceBookIcon sx={{ fontSize: 20 }} /> },
      { text: 'Minhas Visitações', path: '/dashboard/lodge-dashboard/obreiro/minhas-visitacoes', icon: <VisitationIcon sx={{ fontSize: 20 }} /> },
      { text: 'Minhas Publicações', path: '/dashboard/lodge-dashboard/obreiro/minhas-publicacoes', icon: <ScrollIcon sx={{ fontSize: 20 }} /> },
      { text: 'Meus Anúncios', path: '/dashboard/lodge-dashboard/obreiro/meus-anuncios', icon: <BellIcon sx={{ fontSize: 20 }} /> },
      { text: 'Meus Empréstimos', path: '/dashboard/lodge-dashboard/obreiro/meus-emprestimos', icon: <BooksIcon sx={{ fontSize: 20 }} /> },
    ]
  },
  {
    id: 'secretario',
    label: 'Secretário',
    icon: <img src={`${API_URL}/storage/assets/images/icons/Secretario-D.png`} alt="Secretário" style={{ width: 35, height: 35, objectFit: 'contain' }} />,
    path: '/dashboard/lodge-dashboard/secretario',
    subItems: [
      { text: 'Cadastro', path: '/dashboard/lodge-dashboard/secretario/cadastro', icon: <QuillBookIcon sx={{ fontSize: 20 }} /> },
      { text: 'Presenças', path: '/dashboard/lodge-dashboard/secretario/presencas', icon: <ChecklistIcon sx={{ fontSize: 20 }} /> },
      { text: 'Publicações', path: '/dashboard/lodge-dashboard/secretario/publicacoes', icon: <ScrollIcon sx={{ fontSize: 20 }} /> },
      { text: 'Sessões', path: '/dashboard/lodge-dashboard/secretario/sessoes', icon: <TempleColumnsIcon sx={{ fontSize: 20 }} /> },
    ]
  },
  {
    id: 'chanceler',
    label: 'Chanceler',
    icon: <img src={`${API_URL}/storage/assets/images/icons/Chanceler-D.png`} alt="Chanceler" style={{ width: 35, height: 35, objectFit: 'contain' }} />,
    path: '/dashboard/lodge-dashboard/chanceler',
    subItems: [
      { text: 'Cadastro', path: '/dashboard/lodge-dashboard/chanceler/cadastro', icon: <QuillBookIcon sx={{ fontSize: 20 }} /> },
      { text: 'Presenças', path: '/dashboard/lodge-dashboard/chanceler/presencas', icon: <ChecklistIcon sx={{ fontSize: 20 }} /> },
      { text: 'Visitações', path: '/dashboard/lodge-dashboard/chanceler/visitacoes', icon: <VisitationIcon sx={{ fontSize: 20 }} /> },
      { text: 'Visitantes', path: '/dashboard/lodge-dashboard/chanceler/visitantes', icon: <PersonIcon sx={{ fontSize: 20 }} /> },
      { text: 'Gestão de Comissões', path: '/dashboard/lodge-dashboard/chanceler/comissoes', icon: <ChecklistIcon sx={{ fontSize: 20 }} /> },
    ]
  },
];

const LodgeDashboardLayout: React.FC = () => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext) || {};
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const handleLogout = () => {
    if (logout) {
      logout();
      navigate('/login');
    }
  };

  // Filter menu based on user role
  const filteredMenu = React.useMemo(() => {
    if (!user) return [];
    
    return MENU_CONFIG.filter(item => {
      // Always show Home and Obreiro
      if (item.id === 'home' || item.id === 'obreiro') return true;
      
      // Webmasters and SuperAdmins see everything
      if (user.user_type === 'webmaster' || user.user_type === 'super_admin') return true;
      
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

  const handleMainIconClick = (category: typeof MENU_CONFIG[0]) => {
    // Se o menu não tem subitens (como HOME), navega diretamente e remove menu secundário
    if (category.subItems.length === 0) {
      setActiveCategory(null);
      navigate(category.path);
      return;
    }

    // Para menus com subitens
    if (activeCategory === category.id) {
      // Se já está ativo, navega para o primeiro subitem
      navigate(category.subItems[0].path);
    } else {
      // Ativa a categoria e navega para o primeiro subitem
      setActiveCategory(category.id);
      navigate(category.subItems[0].path);
    }
  };

  const activeMenu = filteredMenu.find(c => c.id === activeCategory);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#0f172a' }}>
      <CssBaseline />
      
      {/* Custom Header */}
      <AppBar position="static" sx={{ height: HEADER_HEIGHT, bgcolor: '#1e293b', backgroundImage: 'none', boxShadow: 1, zIndex: 1300 }}>
        <Toolbar sx={{ height: '100%', display: 'flex', justifyContent: 'space-between' }}>
          {/* Left: Lodge Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar 
              src={`${API_URL}/storage/lodges/loja_2181/logo/logo_jpg.png`}
              sx={{ width: 50, height: 50, bgcolor: 'transparent' }}
              imgProps={{ style: { objectFit: 'contain' } }}
              variant="square"
            >
              <DashboardIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ lineHeight: 1.2, fontWeight: 700, color: '#fff' }}>
                Loja João Pedro Junqueira
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                Nº 2181
              </Typography>
            </Box>
          </Box>

          {/* Right: User Info & Sigma Logo Link */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            {/* User Info */}
            {user && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                  <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 600 }}>
                    {user.name || user.sub || 'Usuário'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', display: 'block' }}>
                    {user.active_role_name || (user.user_type === 'member' ? 'Obreiro' : user.role)}
                  </Typography>
                </Box>
                <Avatar 
                  src={user.profile_picture_path ? `${API_URL}${user.profile_picture_path}` : undefined}
                  alt={user.name}
                  sx={{ width: 40, height: 40, bgcolor: theme.palette.primary.main }}
                >
                  {user.name ? user.name.charAt(0).toUpperCase() : <PersonIcon />}
                </Avatar>
              </Box>
            )}

            {/* Sigma Logo */}
            <Box component={RouterLink} to="/" sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
              <img 
                src={SigmaLogo} 
                alt="Sigma" 
                style={{ height: 40, objectFit: 'contain' }} 
              />
            </Box>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Box sx={{ display: 'flex', flexGrow: 1, height: `calc(100vh - ${HEADER_HEIGHT}px)`, overflow: 'hidden' }}>
        {/* Main Sidebar (Fixed 120px) */}
        <Box
          sx={{
            width: MAIN_SIDEBAR_WIDTH,
            flexShrink: 0,
            backgroundColor: '#0a101f',
            borderRight: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            py: 2,
            zIndex: 1200,
            overflowY: 'auto'
          }}
        >
          {/* Main Icons */}
          <List sx={{ width: '100%', flexGrow: 1, pt: 0 }}>
            {filteredMenu.map((item) => (
              <ListItemButton
                key={item.id}
                onClick={() => handleMainIconClick(item)}
                sx={{
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  py: 1.5,
                  mb: 0.5,
                  position: 'relative',
                  color: activeCategory === item.id ? theme.palette.primary.main : 'rgba(255,255,255,0.5)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    color: theme.palette.primary.light,
                  },
                  '&::before': activeCategory === item.id ? {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    height: '60%',
                    width: '4px',
                    backgroundColor: theme.palette.primary.main,
                    borderTopRightRadius: '4px',
                    borderBottomRightRadius: '4px'
                  } : {}
                }}
              >
                <ListItemIcon 
                  sx={{ 
                    minWidth: 'auto', 
                    color: 'inherit',
                    mb: 0.5,
                    '& svg': { fontSize: 28 }
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 600 }}>
                  {item.label}
                </Typography>
              </ListItemButton>
            ))}
          </List>

          {/* Bottom Actions */}
          <Box sx={{ mt: 'auto', width: '100%' }}>
            <ListItemButton
               onClick={handleLogout}
               sx={{
                  flexDirection: 'column',
                  alignItems: 'center',
                  py: 1.5,
                  color: 'rgba(255,255,255,0.5)',
                  '&:hover': { color: theme.palette.error.main, cursor: 'pointer' }
               }}
            >
               <Logout />
               <Typography variant="caption" sx={{ mt: 0.5 }}>Sair</Typography>
            </ListItemButton>
          </Box>
        </Box>

        {/* Secondary Sidebar (250px) - Visible only when activeCategory is set */}
        {activeMenu && (
          <Box
            sx={{
              width: SECONDARY_SIDEBAR_WIDTH,
              flexShrink: 0,
              backgroundColor: '#0f172a', // Slightly lighter or same as main bg?
              borderRight: '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              transition: 'width 0.3s ease',
              overflowY: 'auto'
            }}
          >
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>
                {activeMenu.label}
              </Typography>
            </Box>
            
            <List sx={{ p: 1 }}>
              {activeMenu.subItems.map((subItem: any) => (
                <ListItemButton
                  key={subItem.path}
                  component={RouterLink}
                  to={subItem.path}
                  sx={{
                    mb: 0.5,
                    borderRadius: '8px',
                    backgroundColor: location.pathname === subItem.path ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                    color: location.pathname === subItem.path ? theme.palette.primary.main : 'rgba(255,255,255,0.7)',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.05),
                      color: '#fff'
                    }
                  }}
                >
                  {subItem.icon && (
                    <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
                      {subItem.icon}
                    </ListItemIcon>
                  )}
                  <ListItemText 
                    primary={subItem.text} 
                    primaryTypographyProps={{ 
                      fontSize: '0.85rem', 
                      fontWeight: location.pathname === subItem.path ? 600 : 400 
                    }} 
                  />
                </ListItemButton>
              ))}
            </List>
          </Box>
        )}

        {/* Main Content Area */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 2,
            backgroundColor: '#0f172a', // Dark background
            backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(14, 165, 233, 0.05) 0%, transparent 50%)', // Subtle gradient
            overflow: 'auto',
            height: '100%'
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default LodgeDashboardLayout;
