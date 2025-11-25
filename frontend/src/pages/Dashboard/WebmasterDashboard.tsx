import React from 'react';
import { Typography } from '@mui/material';

const WebmasterDashboard: React.FC = () => {
  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Painel do Webmaster
      </Typography>
      <Typography variant="body1">
        Bem-vindo ao painel de controle da sua loja.
      </Typography>
    </div>
  );
};

export default WebmasterDashboard;
