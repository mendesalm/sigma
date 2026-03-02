import React, { useState } from 'react';
import { Outlet, Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CssBaseline,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  useTheme,
  AppBar,
  Toolbar
} from '@mui/material';
import {
  Home as HomeIcon,
  Business as BusinessIcon,
  Gavel as GavelIcon,
  People as PeopleIcon,
  AdminPanelSettings as AdminIcon,
  Computer as WebmasterIcon,
  Event as EventIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';

const drawerWidth = 260;

const navItems = [
  { text: 'Home', path: '/dashboard', icon: <HomeIcon />, allowedTypes: ['super_admin', 'webmaster', 'member'] },
  { text: 'Obediências', path: '/dashboard/management/obediences', icon: <BusinessIcon />, allowedTypes: ['super_admin'] },
  { text: 'Lojas', path: '/dashboard/management/lodges', icon: <GavelIcon />, allowedTypes: ['super_admin'] },
  { text: 'Membros', path: '/dashboard/management/members', icon: <PeopleIcon />, allowedTypes: ['super_admin', 'webmaster'] },
  { text: 'Super Admins', path: '/dashboard/management/super-admins', icon: <AdminIcon />, allowedTypes: ['super_admin'] },
  { text: 'Webmasters', path: '/dashboard/management/webmasters', icon: <WebmasterIcon />, allowedTypes: ['super_admin'] },
  { text: 'Cargos', path: '/dashboard/roles', icon: <AdminIcon />, allowedTypes: ['super_admin'] },
  { text: 'Sessões', path: '/dashboard/sessions', icon: <EventIcon />, allowedTypes: ['super_admin', 'webmaster', 'member'] },
  { text: 'Modelos de Documentos', path: '/dashboard/management/templates', icon: <DescriptionIcon />, allowedTypes: ['super_admin'] },
  { text: 'Modelos Universais', path: '/dashboard/management/admin-templates', icon: <DescriptionIcon />, allowedTypes: ['super_admin'] },
];

const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    const currentItem = navItems.find(item => item.path === location.pathname);
    return currentItem ? currentItem.text : 'Dashboard';
  };

  const filteredNavItems = navItems.filter(item =>
    user?.user_type && item.allowedTypes.includes(user.user_type)
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#090B10' }}>
      <CssBaseline />

      {/* Brutalist Sharp Header (Global Admin) */}
      <AppBar position="static" elevation={0} sx={{ height: 70, bgcolor: '#0B0F19', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', backgroundImage: 'none', zIndex: 1300 }}>
        <Toolbar sx={{ height: '100%', display: 'flex', justifyContent: 'space-between', px: { xs: 2, md: 4 } }}>

          {/* Left: Global Title */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pl: 3 }}>
              <Avatar
                sx={{ width: 40, height: 40, bgcolor: 'transparent', borderRadius: 0 }}
                variant="square"
              >
                <AdminIcon sx={{ color: theme.palette.primary.main, fontSize: 32 }} />
              </Avatar>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="subtitle1" sx={{ lineHeight: 1.2, fontWeight: 700, color: '#fff', fontFamily: '"Playfair Display", serif', letterSpacing: 1 }}>
                  Sigma Global
                </Typography>
                <Typography variant="caption" sx={{ color: theme.palette.primary.main, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>
                  {getPageTitle()}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Right: User Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            {user && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' }} onClick={handleMenu}>
                <Box sx={{ textAlign: 'right', display: { xs: 'none', md: 'block' } }}>
                  <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>
                    {user.name || user.sub || 'Usuário'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                    {user.user_type.replace('_', ' ')}
                  </Typography>
                </Box>
                <Avatar
                  src={user.profile_picture_path ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${user.profile_picture_path}` : undefined}
                  sx={{ width: 36, height: 36, bgcolor: theme.palette.primary.dark, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 1 }}
                  variant="rounded"
                >
                  {user?.[0]?.toUpperCase() || <PersonIcon />}
                </Avatar>
              </Box>
            )}
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              keepMounted
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              sx={{ '& .MuiPaper-root': { bgcolor: '#121826', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', mt: 1.5 } }}
            >
              <MenuItem onClick={handleClose} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}>
                <ListItemIcon><PersonIcon fontSize="small" sx={{ color: 'rgba(255,255,255,0.7)' }} /></ListItemIcon>
                Perfil
              </MenuItem>
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
              <MenuItem onClick={handleLogout} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}>
                <ListItemIcon><LogoutIcon fontSize="small" sx={{ color: 'theme.palette.error.main' }} /></ListItemIcon>
                Sair
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex', flexGrow: 1, height: `calc(100vh - 70px)`, overflow: 'hidden' }}>

        {/* Dark Sidebar matches LodgeDashboardLayout */}
        <Box
          sx={{
            width: drawerWidth, // keep original admin width since titles are long
            flexShrink: 0,
            backgroundColor: '#0B0F19',
            borderRight: '1px solid rgba(255, 255, 255, 0.05)',
            overflowY: 'auto',
            overflowX: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1200
          }}
        >
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%', pt: 4 }}>
            <Box sx={{ px: 1, mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: theme.palette.primary.main, fontWeight: 700, flexGrow: 1, textTransform: 'uppercase', letterSpacing: 1 }}>
                Gerenciamento
              </Typography>
            </Box>
            <List sx={{ width: '100%', flexGrow: 1, pt: 0 }}>
              {filteredNavItems.map((item) => {
                const isActive = location.pathname === item.path;

                return (
                  <ListItemButton
                    key={item.text}
                    component={RouterLink}
                    to={item.path}
                    selected={isActive}
                    sx={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      py: 1.5,
                      px: 2,
                      mb: 1,
                      borderRadius: 2,
                      backgroundColor: isActive ? 'rgba(0, 176, 255, 0.1)' : 'transparent',
                      color: isActive ? theme.palette.primary.light : 'rgba(255,255,255,0.6)',
                      borderLeft: isActive ? `4px solid ${theme.palette.primary.main}` : '4px solid transparent',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 176, 255, 0.05)',
                        color: '#fff',
                      },
                      '&.Mui-selected:hover': {
                        backgroundColor: 'rgba(0, 176, 255, 0.15)',
                      }
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 48,
                        color: isActive ? theme.palette.primary.main : 'inherit',
                        justifyContent: 'center',
                        '& svg': {
                          transition: 'all 0.3s ease',
                          filter: isActive
                            ? `drop-shadow(0 0 5px rgba(0, 176, 255, 0.5))`
                            : 'none'
                        }
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>

                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        fontSize: '0.9rem',
                        fontWeight: isActive ? 700 : 500,
                        letterSpacing: 0.5
                      }}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          </Box>
        </Box>

        {/* Main Content Area - Dark matched */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            backgroundColor: '#090B10',
            backgroundImage: 'radial-gradient(circle at 100% 0%, rgba(0, 176, 255, 0.03) 0%, transparent 40%)',
            overflow: 'auto',
            height: '100%',
            pt: { xs: 2, md: 3 },
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

export default DashboardLayout;
