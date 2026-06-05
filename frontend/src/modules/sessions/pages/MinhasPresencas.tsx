import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { EventAvailable } from '@mui/icons-material';

const MinhasPresencas: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <EventAvailable sx={{ fontSize: 40, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff' }}>
            Minhas Presenças
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            Acompanhe seu histórico de presenças em sessões da loja
          </Typography>
        </Box>
      </Box>

      <Card sx={{ bgcolor: '#1e293b', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
            Funcionalidade em Desenvolvimento
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Esta página permitirá que você visualize relatórios das suas presenças, incluindo:
          </Typography>
          <Box component="ul" sx={{ color: 'rgba(255,255,255,0.6)', mt: 2 }}>
            <li>Histórico completo de presenças</li>
            <li>Percentual de assiduidade</li>
            <li>Filtros por período e tipo de sessão</li>
            <li>Exportação de relatórios em PDF</li>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default MinhasPresencas;
