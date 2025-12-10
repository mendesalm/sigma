import React, { useState } from 'react';
import { Outlet, Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CssBaseline,
  Typography,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  useTheme,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  Home as HomeIcon,
  Business as BusinessIcon,
  Gavel as GavelIcon,
  People as PeopleIcon,
  AdminPanelSettings as AdminIcon,
  Computer as WebmasterIcon,
  Event as EventIcon,
  Notifications as NotificationsIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  ChevronRight as ChevronRightIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import logoSigma from "../../assets/images/SigmaLogo.png";

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
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* App Bar */}
      <Box
        component="header"
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 64,
          zIndex: theme.zIndex.drawer + 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          backgroundColor: 'rgba(18, 18, 18, 0.8)',
          backdropFilter: 'blur(10px)',
          borderBottom: `1px solid ${theme.palette.divider}`,
          borderRadius: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', width: drawerWidth - 24 }}>
           <img src={logoSigma} alt="Sigma" style={{ height: 40, marginRight: 16 }} />
           <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold', letterSpacing: 1 }}>
             SIGMA
           </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, ml: 4 }}>
           <Breadcrumbs separator={<ChevronRightIcon fontSize="small" />} aria-label="breadcrumb">
             <Link underline="hover" color="inherit" href="/dashboard">
               Sigma
             </Link>
             <Typography color="text.primary">{getPageTitle()}</Typography>
           </Breadcrumbs>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton color="inherit">
            <NotificationsIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={handleMenu}>
            <Typography variant="subtitle2" sx={{ mr: 1, display: { xs: 'none', sm: 'block' } }}>
              {user?.sub || 'Usuário'}
            </Typography>
            <Avatar sx={{ bgcolor: theme.palette.primary.main, color: theme.palette.primary.contrastText }}>
              {user?.sub?.[0]?.toUpperCase() || 'U'}
            </Avatar>
          </Box>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem onClick={handleClose}>
              <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
              Perfil
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
              Sair
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { 
            width: drawerWidth, 
            boxSizing: 'border-box',
            top: 64,
            height: 'calc(100% - 64px)',
            backgroundColor: theme.palette.background.paper,
            borderRight: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        <Box sx={{ overflow: 'auto', py: 2 }}>
          <Box sx={{ px: 2, mb: 2 }}>
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 'bold' }}>
              Gerenciamento
            </Typography>
          </Box>
          <List>
            {filteredNavItems.map((item) => (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton 
                  component={RouterLink} 
                  to={item.path}
                  selected={location.pathname === item.path}
                  sx={{
                    mx: 1,
                    borderRadius: 2,
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(0, 176, 255, 0.12)', // Primary blue with opacity
                      borderLeft: `4px solid ${theme.palette.primary.main}`,
                      '&:hover': {
                        backgroundColor: 'rgba(0, 176, 255, 0.2)',
                      },
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: location.pathname === item.path ? theme.palette.primary.main : 'inherit', minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{ 
                      fontWeight: location.pathname === item.path ? 600 : 400,
                      color: location.pathname === item.path ? theme.palette.primary.main : 'text.primary'
                    }} 
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 4, 
          mt: 8,
          width: `calc(100% - ${drawerWidth}px)`,
          minHeight: '100vh',
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default DashboardLayout;
