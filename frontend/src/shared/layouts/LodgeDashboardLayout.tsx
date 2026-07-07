import React, { useState, useEffect, useContext } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  Box,
  CssBaseline,
  Typography,
  Avatar,
  useTheme,
  AppBar,
  Toolbar,
  Skeleton,
  IconButton,
  alpha
} from '@mui/material';
import {
  Logout,
  Dashboard as DashboardIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { AuthContext } from '@/modules/access_control/context/AuthContext';

import api from '@/shared/services/api';

const HEADER_HEIGHT = 70; // Slightly taller for better logo fit
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const LodgeDashboardLayout: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext) || {};
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

    return `${API_URL}/storage/lodges/loja_${safeNumber}/assets/images/logo/logo_jpg.png`;
  };

  const logoUrl = getLogoUrl();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#090B10' }}>
      <CssBaseline />

      <AppBar position="static" elevation={0} sx={{ height: HEADER_HEIGHT, bgcolor: '#0B0F19', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', backgroundImage: 'none', zIndex: 1300 }}>
        <Toolbar sx={{ height: '100%', display: 'flex', justifyContent: 'space-between', px: { xs: 2, md: 4 } }}>

          {/* Left: Sigma Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, pl: 1 }}>
            <Box
              component="img"
              src="/src/assets/images/logos/Sigma_Logo_PrataAzul_P.png"
              alt="Sigma Logo"
              sx={{
                height: { xs: 32, md: 45 },
                width: 'auto',
                filter: "drop-shadow(0px 0px 8px rgba(0, 176, 255, 0.3))",
              }}
            />
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
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
                  textShadow: '0 0 5px rgba(180, 180, 180, 0.2)'
                }}
              >
                SiGMa
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: alpha(theme.palette.text.primary, 0.7),
                  letterSpacing: '0.05em',
                  display: 'block',
                  mt: 0.5,
                  fontSize: '0.7rem',
                  textTransform: 'uppercase'
                }}
              >
                Sistema Integrado de Gerenciamento Maçônico
              </Typography>
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
        {/* Main Content Area - Taking full width since sidebar is removed */}
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
