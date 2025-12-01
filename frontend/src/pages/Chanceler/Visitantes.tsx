import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { Groups } from '@mui/icons-material';

const ChancelerVisitantes: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Groups sx={{ fontSize: 40, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff' }}>
            Visitantes
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            Gerenciamento de visitantes de outras lojas nas sessões
          </Typography>
        </Box>
      </Box>

      <Card sx={{ bgcolor: '#1e293b', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
            Funcionalidade em Desenvolvimento
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Esta página permitirá ao Chanceler gerenciar visitantes, incluindo:
          </Typography>
          <Box component="ul" sx={{ color: 'rgba(255,255,255,0.6)', mt: 2 }}>
            <li>Cadastro de visitantes</li>
            <li>Registro de presença em sessões</li>
            <li>Consulta de dados cadastrais</li>
            <li>Histórico de visitas recebidas</li>
            <li>Relatórios de visitantes por período</li>
            <li>Exportação de dados</li>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ChancelerVisitantes;
