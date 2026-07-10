import React, { useState, useEffect, useContext } from 'react';
import { Outlet, useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  CssBaseline,
  Typography,
  Avatar,
  useTheme,
  AppBar,
  Toolbar,
  IconButton,
  alpha,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Logout,
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Computer as WebmasterIcon,
  QrCodeScanner as QrCodeScannerIcon,
} from '@mui/icons-material';
import { AuthContext } from '@/modules/access_control/context/AuthContext';
import api from '@/shared/services/api';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import SessionCheckIn from '@/modules/sessions/components/SessionCheckIn';

import SecretariaSvg from '@/assets/icons/Secretaria.svg';
import ChancelariaSvg from '@/assets/icons/chancelaria.svg';
import TesourariaSvg from '@/assets/icons/Tesouraria.svg';
import BibliotecaSvg from '@/assets/icons/Biblioteca.svg';
import HarmoniaSvg from '@/assets/icons/Harmonia.svg';
import ArquitetoSvg from '@/assets/icons/Arquiteto.svg';
import { SigmaAnimatedLogo } from '@/shared/components/SigmaAnimatedLogo';
import LodgeDetailsModal from '../../modules/core/components/LodgeDetailsModal';

const HEADER_HEIGHT = 70;
const DRAWER_WIDTH = 260;
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const adminRoles = [
  'Venerável Mestre', '1º Vigilante', '2º Vigilante', 'Orador', 'Secretário', 'Tesoureiro', 'Chanceler', 'Hospitaleiro',
  'Mestre de Cerimônias', 'Orador Adjunto', 'Secretário Adjunto', 'Tesoureiro Adjunto', 'Chanceler Adjunto', 'Hospitaleiro Adjunto', 'Mestre de Cerimônias Adjunto',
  'Porta-Bandeira', 'Porta-Estandarte', 'Porta-Espada', 'Guarda do Templo', 'Cobridor', 'Arquiteto', 'Bibliotecário',
  'Bibliotecário Adjunto', 'Mestre de Harmonia', 'Mestre de Harmonia Adjunto',
  'Mestre de Banquetes', 'Mestre de Banquetes Adjunto'
];

const LodgeDashboardLayout: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const { user, logout } = useContext(AuthContext) || {};
  const [lodgeData, setLodgeData] = useState<any>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [openCheckIn, setOpenCheckIn] = useState(false);
  const [adminAnchorEl, setAdminAnchorEl] = useState<null | HTMLElement>(null);
  const [lodgeDetailsOpen, setLodgeDetailsOpen] = useState(false);

  const fetchLodgeData = async () => {
    if (user?.lodge_id) {
      try {
        const response = await api.get(`/lodges/${user.lodge_id}`);
        setLodgeData(response.data);
        
        // TODO: Backend não possui endpoint para buscar sessão ativa por lodge_id atualmente
        // const sessionRes = await api.get(`/masonic-sessions/active/${user.lodge_id}`);
        // if (sessionRes.data && sessionRes.data.id) {
        //   setActiveSessionId(sessionRes.data.id);
        // }
      } catch (error) {
        console.error("Failed to fetch lodge data:", error);
      }
    }
  };

  useEffect(() => {
    fetchLodgeData();
  }, [user]);

  const handleLogout = () => {
    if (logout) {
      logout();
      navigate('/login');
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const isWebmaster = user?.user_type === 'webmaster' || user?.is_webmaster || user?.role === 'Webmaster' || false;
  const isAdmin = isWebmaster || adminRoles.includes(user?.active_role_name || '');

  const sidebarItems = [
    { text: 'Início', path: '/dashboard/lodge-dashboard', icon: <DashboardIcon />, visible: true, endMatch: true },
    { text: 'Painel do Obreiro', path: '/dashboard/lodge-dashboard/obreiro', icon: <PersonIcon />, visible: true },
    { text: 'Administração', path: '#admin', icon: <AdminIcon />, visible: isAdmin },
    { text: 'Webmaster', path: '/dashboard', icon: <WebmasterIcon />, visible: isWebmaster }
  ];

  if (activeSessionId) {
    sidebarItems.splice(1, 0, {
      text: 'Check-in Sessão',
      path: '#checkin',
      icon: <QrCodeScannerIcon />,
      visible: true,
      endMatch: false
    });
  }

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#0B0F19', borderRight: '1px solid rgba(255, 255, 255, 0.05)' }}>
      {/* Sidebar Header Space */}
      <Box sx={{ height: HEADER_HEIGHT, display: 'flex', alignItems: 'center', px: 3, borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.4)', letterSpacing: 2 }}>Menu Principal</Typography>
      </Box>

      {/* Navigation List */}
      <List sx={{ px: 2, pt: 3, flexGrow: 1 }}>
        {sidebarItems.filter(item => item.visible).map((item) => {
          // Check if active
          const isActive = item.path.startsWith('#') ? false : (item.endMatch 
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path));

          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                component={item.path.startsWith('#') ? 'button' : RouterLink}
                to={item.path.startsWith('#') ? undefined : item.path}
                onClick={(e) => {
                  if (item.path === '#checkin') {
                    setOpenCheckIn(true);
                  } else if (item.path === '#admin') {
                    setAdminAnchorEl(e.currentTarget);
                  } else {
                    if (isMobile) setMobileOpen(false);
                  }
                }}
                sx={{
                  borderRadius: 2,
                  bgcolor: isActive ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
                  color: isActive ? '#D4AF37' : 'rgba(255, 255, 255, 0.7)',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: isActive ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    color: isActive ? '#D4AF37' : '#fff',
                    transform: 'translateX(4px)'
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{ 
                    fontSize: '0.9rem', 
                    fontWeight: isActive ? 600 : 400,
                    fontFamily: '"Inter", sans-serif'
                  }} 
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      
      {/* Sigma Footer */}
      <Box sx={{ mt: 'auto', p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ height: 48, width: 48, filter: "drop-shadow(0px 0px 8px rgba(0, 176, 255, 0.3))", mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <SigmaAnimatedLogo theme="prata" width="100%" height="100%" showText={false} />
        </Box>
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            fontFamily: "'Tektur', sans-serif",
            textTransform: "uppercase",
            fontWeight: 700, 
            lineHeight: 1,
            background: `linear-gradient(45deg, #B4B4B4, #9F9F9F)`,
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
            letterSpacing: '-0.02em',
            mb: 0.5
          }}
        >
          SiGMa
        </Typography>
        <Typography 
          variant="caption" 
          sx={{ 
            color: 'rgba(255,255,255,0.5)',
            letterSpacing: '0.05em',
            textAlign: 'center',
            fontSize: '0.65rem',
            textTransform: 'uppercase',
            lineHeight: 1.2
          }}
        >
          Sistema Integrado de Gerenciamento Maçônico
        </Typography>
      </Box>

      {/* Admin Secondary Menu */}
      <Menu
        anchorEl={adminAnchorEl}
        open={Boolean(adminAnchorEl)}
        onClose={() => setAdminAnchorEl(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{
          sx: {
            bgcolor: '#151B26',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            mt: 1,
            ml: 1,
            '& .MuiMenuItem-root': {
              fontFamily: '"Inter", sans-serif',
              fontSize: '0.9rem',
              p: 1.5,
              '&:hover': {
                bgcolor: 'rgba(212, 175, 55, 0.1)',
                color: '#D4AF37'
              }
            }
          }
        }}
      >
        <MenuItem component={RouterLink} to="/dashboard/lodge-dashboard/admin/secretaria" onClick={() => setAdminAnchorEl(null)}>
          <Box component="img" src={SecretariaSvg} sx={{ width: 22, height: 22, mr: 1.5 }} />
          Secretaria
        </MenuItem>
        <MenuItem component={RouterLink} to="/dashboard/lodge-dashboard/admin/chancelaria" onClick={() => setAdminAnchorEl(null)}>
          <Box component="img" src={ChancelariaSvg} sx={{ width: 22, height: 22, mr: 1.5 }} />
          Chancelaria
        </MenuItem>
        <MenuItem component={RouterLink} to="/dashboard/lodge-dashboard/admin/tesouraria" onClick={() => setAdminAnchorEl(null)}>
          <Box component="img" src={TesourariaSvg} sx={{ width: 22, height: 22, mr: 1.5 }} />
          Tesouraria
        </MenuItem>
        <MenuItem component={RouterLink} to="/dashboard/lodge-dashboard/admin/biblioteca" onClick={() => setAdminAnchorEl(null)}>
          <Box component="img" src={BibliotecaSvg} sx={{ width: 22, height: 22, mr: 1.5 }} />
          Biblioteca
        </MenuItem>
        <MenuItem component={RouterLink} to="/dashboard/lodge-dashboard/admin/harmonia" onClick={() => setAdminAnchorEl(null)}>
          <Box component="img" src={HarmoniaSvg} sx={{ width: 22, height: 22, mr: 1.5 }} />
          Harmonia
        </MenuItem>
        <MenuItem component={RouterLink} to="/dashboard/lodge-dashboard/admin/arquiteto" onClick={() => setAdminAnchorEl(null)}>
          <Box component="img" src={ArquitetoSvg} sx={{ width: 22, height: 22, mr: 1.5 }} />
          Arquiteto
        </MenuItem>
      </Menu>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#090B10' }}>
      <CssBaseline />

      {/* Top Header */}
      <AppBar 
        position="fixed" 
        elevation={0} 
        sx={{ 
          height: HEADER_HEIGHT, 
          bgcolor: '#0B0F19', 
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)', 
          backgroundImage: 'none', 
          zIndex: theme.zIndex.drawer + 1,
          width: '100%'
        }}
      >
        <Toolbar sx={{ height: '100%', display: 'flex', justifyContent: 'space-between', px: { xs: 1, md: 4 } }}>
          {/* Left: Hamburger & Lodge Info */}
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: { xs: 1, md: 2 },
              cursor: lodgeData ? 'pointer' : 'default',
              '&:hover': lodgeData ? { opacity: 0.8 } : {}
            }}
            onClick={() => lodgeData && setLodgeDetailsOpen(true)}
          >
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 0, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>

            {lodgeData && (
              <>
                {lodgeData.logo_path && (
                  <Box
                    component="img"
                    src={`${API_URL}${lodgeData.logo_path}`}
                    alt="Lodge Logo"
                    sx={{
                      height: { xs: 32, md: 44 },
                      width: 'auto',
                      objectFit: 'contain'
                    }}
                  />
                )}
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                  <Typography 
                    variant="h6" 
                    component="div" 
                    sx={{ 
                      fontFamily: '"Inter", sans-serif',
                      fontWeight: 700, 
                      lineHeight: 1.2,
                      color: '#C49A45', // Dourado do Sigma
                      letterSpacing: '-0.01em',
                      textTransform: 'uppercase'
                    }}
                  >
                    Loja Maçônica {lodgeData.lodge_name} - Nº {lodgeData.lodge_number}
                  </Typography>
                  {lodgeData.obedience_name && (
                    <Box sx={{ mt: 0.5 }}>
                      {lodgeData.obedience_name.includes('Grande Oriente do Brasil') || lodgeData.obedience_name.includes('GOB') ? (
                        <>
                          <Typography variant="caption" sx={{ display: 'block', fontStyle: 'italic', fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.1 }}>
                            Federada ao Grande Oriente do Brasil
                          </Typography>
                          {lodgeData.subobedience_name && (
                            <Typography variant="caption" sx={{ display: 'block', fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.1 }}>
                              Jurisdicionada ao {lodgeData.subobedience_name}
                            </Typography>
                          )}
                        </>
                      ) : (
                        <Typography variant="caption" sx={{ display: 'block', fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.1 }}>
                          Confederada à {lodgeData.obedience_name}
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
              </>
            )}
          </Box>

          {/* Right: User Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 3 } }}>
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

      {/* Sidebar Navigation */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, bgcolor: '#0B0F19', borderRight: 'none' },
          }}
        >
          {drawerContent}
        </Drawer>
        {/* Desktop Permanent Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, bgcolor: '#0B0F19', borderRight: 'none', top: HEADER_HEIGHT, height: `calc(100vh - ${HEADER_HEIGHT}px)` },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mt: `${HEADER_HEIGHT}px`,
          width: { xs: '100%', md: `calc(100% - ${DRAWER_WIDTH}px)` },
          backgroundColor: '#090B10',
          backgroundImage: 'radial-gradient(circle at 100% 0%, rgba(0, 176, 255, 0.03) 0%, transparent 40%)',
          height: { xs: 'auto', md: `calc(100vh - ${HEADER_HEIGHT}px)` },
          overflow: { xs: 'auto', md: 'hidden' },
          pt: { xs: 1, md: 1 },
          px: { xs: 1, md: 2 },
          pb: { xs: 1, md: 1 }
        }}
      >
        <Box sx={{ maxWidth: '100%', margin: '0 auto', height: '100%' }}>
          <Outlet />
        </Box>
      </Box>

      {/* Modal de Check-in */}
      <Dialog open={openCheckIn} onClose={() => setOpenCheckIn(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: '#151B26', color: '#fff' }}}>
        <DialogTitle sx={{ color: '#D4AF37' }}>Registrar Presença</DialogTitle>
        <DialogContent>
          {activeSessionId && (
            <SessionCheckIn 
              sessionId={activeSessionId} 
              onSuccess={() => setOpenCheckIn(false)} 
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCheckIn(false)} sx={{ color: 'rgba(255,255,255,0.7)' }}>Fechar</Button>
        </DialogActions>
      </Dialog>
      {/* Modal de Detalhes da Loja */}
      {lodgeData && (
        <LodgeDetailsModal
          open={lodgeDetailsOpen}
          onClose={() => setLodgeDetailsOpen(false)}
          lodgeData={lodgeData}
          isAdmin={isAdmin}
          isWebmaster={isWebmaster}
          onUpdate={fetchLodgeData}
        />
      )}
    </Box>
  );
};

export default LodgeDashboardLayout;
