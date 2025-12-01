import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { Campaign } from '@mui/icons-material';

const MeusAnuncios: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Campaign sx={{ fontSize: 40, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff' }}>
            Meus Anúncios
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            Gerencie seus anúncios no módulo de classificados
          </Typography>
        </Box>
      </Box>

      <Card sx={{ bgcolor: '#1e293b', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
            Funcionalidade em Desenvolvimento
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Esta página permitirá gerenciar seus anúncios, incluindo:
          </Typography>
          <Box component="ul" sx={{ color: 'rgba(255,255,255,0.6)', mt: 2 }}>
            <li>Cadastro de novos anúncios</li>
            <li>Edição de anúncios existentes</li>
            <li>Gerenciamento de status (Ativo, Vendido, Pausado)</li>
            <li>Upload de imagens</li>
            <li>Visualização de interessados</li>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default MeusAnuncios;
