import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { Explore } from '@mui/icons-material';

const MinhasVisitacoes: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Explore sx={{ fontSize: 40, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff' }}>
            Minhas Visitações
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            Histórico de visitações realizadas a outras lojas
          </Typography>
        </Box>
      </Box>

      <Card sx={{ bgcolor: '#1e293b', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
            Funcionalidade em Desenvolvimento
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Esta página exibirá o histórico de suas visitações a outras lojas, incluindo:
          </Typography>
          <Box component="ul" sx={{ color: 'rgba(255,255,255,0.6)', mt: 2 }}>
            <li>Data da visitação</li>
            <li>Loja visitada</li>
            <li>Tipo de sessão</li>
            <li>Filtros e busca avançada</li>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default MinhasVisitacoes;
