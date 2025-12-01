import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { Article } from '@mui/icons-material';

const MinhasPublicacoes: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Article sx={{ fontSize: 40, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff' }}>
            Minhas Publicações
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            Acompanhe suas publicações cadastradas no site
          </Typography>
        </Box>
      </Box>

      <Card sx={{ bgcolor: '#1e293b', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
            Funcionalidade em Desenvolvimento
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Esta página permitirá gerenciar suas publicações, incluindo:
          </Typography>
          <Box component="ul" sx={{ color: 'rgba(255,255,255,0.6)', mt: 2 }}>
            <li>Histórico de publicações</li>
            <li>Filtros por tipo e data</li>
            <li>Visualização e edição de rascunhos</li>
            <li>Estatísticas de visualizações</li>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default MinhasPublicacoes;
