import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '@/shared/layouts/Header';
import Footer from '@/shared/layouts/Footer';
import { Box } from '@mui/material';

const PublicLayout: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <Box component="main" sx={{ flexGrow: 1, overflowY: 'scroll', scrollSnapType: 'y mandatory' }}>
        <Outlet />
      </Box>
      <Footer />
    </Box>
  );
};

export default PublicLayout;
