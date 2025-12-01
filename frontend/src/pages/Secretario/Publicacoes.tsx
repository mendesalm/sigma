import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { Article } from '@mui/icons-material';

const SecretarioPublicacoes: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Article sx={{ fontSize: 40, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff' }}>
            Publicações
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            Gerenciamento completo de todas as publicações da loja
          </Typography>
        </Box>
      </Box>

      <Card sx={{ bgcolor: '#1e293b', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
            Funcionalidade em Desenvolvimento
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Esta página permitirá ao Secretário gerenciar todas as publicações, incluindo:
          </Typography>
          <Box component="ul" sx={{ color: 'rgba(255,255,255,0.6)', mt: 2 }}>
            <li>Criação de novas publicações</li>
            <li>Edição e remoção de publicações</li>
            <li>Aprovação de publicações de membros</li>
            <li>Categorização e tags</li>
            <li>Agendamento de publicações</li>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SecretarioPublicacoes;
