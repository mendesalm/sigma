import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { Assessment } from '@mui/icons-material';

const SecretarioPresencas: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Assessment sx={{ fontSize: 40, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff' }}>
            Presenças
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            Relatórios de presenças de todos os membros da loja
          </Typography>
        </Box>
      </Box>

      <Card sx={{ bgcolor: '#1e293b', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
            Funcionalidade em Desenvolvimento
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Esta página permitirá ao Secretário gerar relatórios de presenças, incluindo:
          </Typography>
          <Box component="ul" sx={{ color: 'rgba(255,255,255,0.6)', mt: 2 }}>
            <li>Relatórios gerais de assiduidade</li>
            <li>Filtros por período, tipo de sessão, membro</li>
            <li>Estatísticas de presença por membro</li>
            <li>Exportação em PDF e Excel</li>
            <li>Gráficos de assiduidade</li>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SecretarioPresencas;
