import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { MenuBook } from '@mui/icons-material';

const MeusEmprestimos: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <MenuBook sx={{ fontSize: 40, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff' }}>
            Meus Empréstimos
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            Solicitação e histórico de empréstimos da biblioteca
          </Typography>
        </Box>
      </Box>

      <Card sx={{ bgcolor: '#1e293b', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
            Funcionalidade em Desenvolvimento
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Esta página permitirá gerenciar empréstimos da biblioteca, incluindo:
          </Typography>
          <Box component="ul" sx={{ color: 'rgba(255,255,255,0.6)', mt: 2 }}>
            <li>Solicitar empréstimo de livros</li>
            <li>Histórico de empréstimos</li>
            <li>Visualização de prazos de devolução</li>
            <li>Renovação de empréstimos</li>
            <li>Livros em atraso</li>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default MeusEmprestimos;
