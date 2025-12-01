import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { HowToReg } from '@mui/icons-material';

const ChancelerPresencas: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <HowToReg sx={{ fontSize: 40, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff' }}>
            Presenças
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            Gerenciamento completo de presenças dos membros em sessões
          </Typography>
        </Box>
      </Box>

      <Card sx={{ bgcolor: '#1e293b', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
            Funcionalidade em Desenvolvimento
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Esta página permitirá ao Chanceler gerenciar presenças, incluindo:
          </Typography>
          <Box component="ul" sx={{ color: 'rgba(255,255,255,0.6)', mt: 2 }}>
            <li>Registro manual de presenças</li>
            <li>Registro via QR Code</li>
            <li>Edição de presenças registradas</li>
            <li>Relatórios de assiduidade</li>
            <li>Controle de geolocalização (check-in)</li>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ChancelerPresencas;
