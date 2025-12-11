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
  Toolbar,
  ListSubheader
} from '@mui/material';
import { 
  Logout,
  Dashboard as DashboardIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';

// Import Sigma Logo
import SigmaLogo from '../../assets/images/SigmaLogo.png';
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

const MAIN_SIDEBAR_WIDTH = 120;
const SECONDARY_SIDEBAR_WIDTH = 250;
const HEADER_HEIGHT = 70; // Slightly taller for better logo fit

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Define menu structure - Nova estrutura hierárquica
const MENU_CONFIG = [
  {
    id: 'home',
    label: 'Home',
    icon: <img src={HomeIcon} alt="Home" style={{ width: 35, height: 35, objectFit: 'contain' }} />,
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
      { text: 'Gestão de Diretoria', path: '/dashboard/lodge-dashboard/secretario/exercicio/diretoria', icon: <SquareCompassIcon sx={{ fontSize: 20 }} />, disabled: true },
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

    // Para menus com subitens, encontrar o primeiro item navegável (ignora headers e disabled)
    const firstNavigableItem = category.subItems.find((item: any) => item.path && !item.disabled && item.type !== 'header');

    if (firstNavigableItem && firstNavigableItem.path) {
      setActiveCategory(category.id);
      navigate(firstNavigableItem.path);
    } else {
        // Fallback: apenas ativa a categoria se não houver subitem navegável
       setActiveCategory(category.id);
    }
  };

  const activeMenu = filteredMenu.find(c => c.id === activeCategory);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#0f172a' }}>
      <CssBaseline />
      
      {/* Custom Header */}
      <AppBar position="static" square sx={{ height: HEADER_HEIGHT, bgcolor: '#1e293b', backgroundImage: 'none', boxShadow: 1, zIndex: 1300, borderRadius: 0 }}>
        <Toolbar sx={{ height: '100%', display: 'flex', justifyContent: 'space-between' }}>
          {/* Left: Lodge Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar 
              src={logoUrl}
              sx={{ width: 50, height: 50, bgcolor: 'transparent' }}
              imgProps={{ style: { objectFit: 'contain' }, onError: (e) => (e.currentTarget.style.display = 'none') }}
              variant="square"
            >
              <DashboardIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ lineHeight: 1.2, fontWeight: 700, color: '#fff' }}>
                {lodgeData?.lodge_name || 'Carregando...'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                {lodgeData?.lodge_number ? `Nº ${lodgeData.lodge_number}` : ''}
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
                    '& svg': { fontSize: 28 },
                    '& img': {
                      transition: 'all 0.3s ease',
                      filter: activeCategory === item.id 
                        ? `drop-shadow(0 0 8px ${theme.palette.primary.main})` 
                        : 'grayscale(100%) opacity(0.7)'
                    },
                    '&:hover img': {
                      filter: `drop-shadow(0 0 5px ${theme.palette.primary.main}) grayscale(0%) opacity(1)`
                    }
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
              {activeMenu.subItems.map((subItem: any, index: number) => {
                if (subItem.type === 'header') {
                  return (
                    <ListSubheader 
                      key={index} 
                      disableSticky
                      sx={{ 
                        bgcolor: 'transparent', 
                        color: 'rgba(255,255,255,0.5)', 
                        textTransform: 'uppercase', 
                        fontSize: '0.7rem', 
                        fontWeight: 700,
                        lineHeight: '32px',
                        mt: 2,
                        mb: 0.5,
                        pl: 2
                      }}
                    >
                      {subItem.text}
                    </ListSubheader>
                  );
                }

                const isDisabled = subItem.disabled;

                return (
                  <ListItemButton
                    key={subItem.path || index}
                    component={isDisabled ? 'div' : RouterLink}
                    to={isDisabled ? undefined : subItem.path}
                    disabled={isDisabled}
                    sx={{
                      mb: 0.5,
                      borderRadius: '8px',
                      backgroundColor: (!isDisabled && location.pathname === subItem.path) ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                      color: (!isDisabled && location.pathname === subItem.path) ? theme.palette.primary.main : 'rgba(255,255,255,0.7)',
                      opacity: isDisabled ? 0.5 : 1,
                      cursor: isDisabled ? 'default' : 'pointer',
                      '&:hover': {
                        backgroundColor: !isDisabled ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
                        color: !isDisabled ? '#fff' : 'inherit'
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
                        fontWeight: (!isDisabled && location.pathname === subItem.path) ? 600 : 400 
                      }} 
                    />
                    {isDisabled && (
                       <Typography variant="caption" sx={{ fontSize: '0.6rem', ml: 1, border: '1px solid rgba(255,255,255,0.2)', borderRadius: 1, px: 0.5 }}>
                         Breve
                       </Typography>
                    )}
                  </ListItemButton>
                );
              })}
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
