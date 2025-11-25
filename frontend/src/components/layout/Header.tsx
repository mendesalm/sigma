import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import logoSigma from '../../assets/images/logo_sigma.png'; // Import the logo

const Header: React.FC = () => {
  return (
    <AppBar
      position="fixed"
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
    >
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <RouterLink to="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
            <img src={logoSigma} alt="Sigma Logo" style={{ height: '40px', marginRight: '10px' }} />
            <Typography variant="h6" noWrap component="div">
              Sistema de Gerenciamento de Lojas Maçônicas - SiGMa
            </Typography>
          </RouterLink>
        </Box>
        <Box>
          <Button color="inherit" component={RouterLink} to="/login">
            Login
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
