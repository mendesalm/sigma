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

const MAIN_SIDEBAR_WIDTH = 120;
const SECONDARY_SIDEBAR_WIDTH = 250;
const HEADER_HEIGHT = 70; // Slightly taller for better logo fit

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ... MENU_CONFIG remains the same ...
// Define menu structure
const MENU_CONFIG = [
  {
    id: 'perfil',
    label: 'Perfil',
    icon: <img src={`${API_URL}/storage/assets/images/icons/Macom-D.png`} alt="Perfil" style={{ width: 35, height: 35, objectFit: 'contain' }} />,
    path: '/dashboard/member-dashboard', 
    subItems: [
      { text: 'Meus Dados', path: '/dashboard/member-dashboard' },
      { text: 'Alterar Senha', path: '/dashboard/change-password' },
    ]
  },
  {
    id: 'secretaria',
    label: 'Secretaria',
    icon: <img src={`${API_URL}/storage/assets/images/icons/Secretario-D.png`} alt="Secretaria" style={{ width: 35, height: 35, objectFit: 'contain' }} />,
    path: '/dashboard/lodge-dashboard/management',
    subItems: [
      { text: 'Gestão de Membros', path: '/dashboard/lodge-dashboard/management/members' },
      { text: 'Gestão de Sessões', path: '/dashboard/lodge-dashboard/sessions' },
      { text: 'Histórico de Sessões', path: '/dashboard/sessions/history' },
      { text: 'Gestão de Publicações', path: '/dashboard/publications' },
      { text: 'Documentos', path: '/dashboard/documents' },
      { text: 'Arquivos Diversos', path: '/dashboard/files' },
    ]
  },
  {
    id: 'chancelaria',
    label: 'Chancelaria',
    icon: <img src={`${API_URL}/storage/assets/images/icons/Chanceler-D.png`} alt="Chancelaria" style={{ width: 35, height: 35, objectFit: 'contain' }} />,
    path: '/dashboard/chancelaria',
    subItems: [
      { text: 'Livro de Presenças', path: '/dashboard/chancelaria/attendance' },
      { text: 'Visitantes', path: '/dashboard/chancelaria/visitors' },
    ]
  },
  {
    id: 'tesouraria',
    label: 'Tesouraria',
    icon: <img src={`${API_URL}/storage/assets/images/icons/Tesoureiro-D.png`} alt="Tesouraria" style={{ width: 35, height: 35, objectFit: 'contain' }} />,
    path: '/dashboard/financial',
    subItems: [
      { text: 'Mensalidades', path: '/dashboard/financial/fees' },
      { text: 'Fluxo de Caixa', path: '/dashboard/financial/cashflow' },
    ]
  },
  {
    id: 'oratoria',
    label: 'Oratória',
    icon: <img src={`${API_URL}/storage/assets/images/icons/Orador-D.png`} alt="Oratória" style={{ width: 35, height: 35, objectFit: 'contain' }} />,
    path: '/dashboard/oratory',
    subItems: [
      { text: 'Peças de Arquitetura', path: '/dashboard/oratory/pieces' },
    ]
  },
  {
    id: 'arquiteto',
    label: 'Arquiteto',
    icon: <img src={`${API_URL}/storage/assets/images/icons/Arquiteto-D.png`} alt="Arquiteto" style={{ width: 35, height: 35, objectFit: 'contain' }} />,
    path: '/dashboard/architect',
    subItems: [
      { text: 'Patrimônio', path: '/dashboard/architect/assets' },
    ]
  },
  {
    id: 'biblioteca',
    label: 'Biblioteca',
    icon: <img src={`${API_URL}/storage/assets/images/icons/Biblioteca-D.png`} alt="Biblioteca" style={{ width: 35, height: 35, objectFit: 'contain' }} />,
    path: '/dashboard/library',
    subItems: [
      { text: 'Acervo', path: '/dashboard/library/books' },
      { text: 'Empréstimos', path: '/dashboard/library/loans' },
    ]
  },
  {
    id: 'harmonia',
    label: 'Harmonia',
    icon: <img src={`${API_URL}/storage/assets/images/icons/Harmonia-D.png`} alt="Harmonia" style={{ width: 35, height: 35, objectFit: 'contain' }} />,
    path: '/dashboard/harmony',
    subItems: [
      { text: 'Playlists', path: '/dashboard/harmony/playlists' },
    ]
  },
];

const LodgeDashboardLayout: React.FC = () => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext) || {};
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Determine active category based on current path
  useEffect(() => {
    const currentPath = location.pathname;
    
    // If exact match for dashboard home, no active category
    if (currentPath === '/dashboard/lodge-dashboard' || currentPath === '/dashboard/lodge-dashboard/') {
      setActiveCategory(null);
      return;
    }

    // Find category that matches the start of the path
    let found = false;
    for (const category of MENU_CONFIG) {
      if (category.subItems.some(item => currentPath.startsWith(item.path))) {
        setActiveCategory(category.id);
        found = true;
        break;
      }
      if (currentPath.startsWith(category.path)) {
        setActiveCategory(category.id);
        found = true;
        break;
      }
    }
    
    if (!found) {
      setActiveCategory(null);
    }
  }, [location.pathname]);

  const handleMainIconClick = (category: typeof MENU_CONFIG[0]) => {
    if (activeCategory === category.id) {
      if (category.subItems.length > 0) {
        navigate(category.subItems[0].path);
      }
    } else {
      setActiveCategory(category.id);
      if (category.subItems.length > 0) {
        navigate(category.subItems[0].path);
      }
    }
  };

  const activeMenu = MENU_CONFIG.find(c => c.id === activeCategory);

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
                    {user.role || (user.user_type === 'webmaster' ? 'Webmaster' : 'Membro')}
                  </Typography>
                </Box>
                <Avatar 
                  src={user.profile_picture ? `${API_URL}${user.profile_picture}` : undefined}
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
            {MENU_CONFIG.map((item) => (
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
               component={RouterLink}
               to="/logout" // Or handle logout
               sx={{
                  flexDirection: 'column',
                  alignItems: 'center',
                  py: 1.5,
                  color: 'rgba(255,255,255,0.5)',
                  '&:hover': { color: theme.palette.error.main }
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
              {activeMenu.subItems.map((subItem) => (
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
