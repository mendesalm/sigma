import React, { useEffect } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, CssBaseline, Box, Toolbar, Typography, AppBar } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import GavelIcon from '@mui/icons-material/Gavel';
import { useAuth } from '../hooks/useAuth';

const drawerWidth = 240;

const DashboardPage: React.FC = () => {
  const { user, requiresSelection } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (requiresSelection) {
      navigate('/select-lodge');
    } else if (user) {
      switch (user.role) {
        case 'super_admin':
          // Already on the correct dashboard
          break;
        case 'webmaster':
          navigate('/dashboard/webmaster-dashboard');
          break;
        case 'member':
          navigate('/dashboard/member-dashboard');
          break;
        default:
          // Handle unknown role by navigating to a safe page or showing an error
          navigate('/login');
          break;
      }
    }
  }, [user, requiresSelection, navigate]);

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            Painel Sigma
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            <ListItem button component={Link} to="/dashboard/management/obediences">
              <ListItemIcon>
                <BusinessIcon />
              </ListItemIcon>
              <ListItemText primary="Obediências" />
            </ListItem>
            <ListItem button component={Link} to="/dashboard/management/lodges">
              <ListItemIcon>
                <GavelIcon />
              </ListItemIcon>
              <ListItemText primary="Lojas" />
            </ListItem>
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default DashboardPage;
