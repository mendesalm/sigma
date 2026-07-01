import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '@/shared/layouts/Header';
import Footer from '@/shared/layouts/Footer';
import { Box } from '@mui/material';

const PublicLayout: React.FC = () => {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Outlet />
      </Box>
      {!isLandingPage && <Footer />}
    </Box>
  );
};

export default PublicLayout;
