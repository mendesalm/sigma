import React from 'react';
import { Outlet, Link as RouterLink } from 'react-router-dom';
import { Box, Drawer, List, ListItem, ListItemButton, ListItemText, Toolbar, CssBaseline } from '@mui/material';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';

const drawerWidth = 240;

const navItems = [
  { text: 'Home', path: '/dashboard/webmaster-dashboard' },
  { text: 'Membros', path: '/dashboard/webmaster-dashboard/members' }, // TODO: Update path to actual member management for webmaster
  { text: 'Sessões', path: '/dashboard/webmaster-dashboard/sessions' }, // TODO: Update path to actual session management for webmaster
];

const WebmasterDashboardLayout: React.FC = () => {
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Header />
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', top: 'auto' },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {navItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton component={RouterLink} to={item.path}>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, width: `calc(100% - ${drawerWidth}px)` }}
      >
        <Toolbar />
        <Outlet />
      </Box>
      {/* O Footer pode precisar de um posicionamento diferente dependendo do design final */}
      {/* <Footer /> */}
    </Box>
  );
};

export default WebmasterDashboardLayout;
