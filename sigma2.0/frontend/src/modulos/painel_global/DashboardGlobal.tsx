import React from 'react';
import { Box, Typography } from '@mui/material';

export const DashboardGlobal: React.FC = () => {
  return (
    <Box p={4}>
      <Typography variant="h3" color="primary">Painel Global (Obediência)</Typography>
      <Typography variant="body1">Visão macro: Grão-Mestres e Webmasters gerindo subobediências e Lojas Jurisdicionadas.</Typography>
    </Box>
  );
};
