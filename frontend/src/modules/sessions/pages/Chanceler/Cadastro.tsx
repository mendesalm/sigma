import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { People } from '@mui/icons-material';

const ChancelerCadastro: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <People sx={{ fontSize: 40, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff' }}>
            Cadastro de Membros
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            Gerenciamento completo do cadastro de membros da loja
          </Typography>
        </Box>
      </Box>

      <Card sx={{ bgcolor: '#1e293b', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
            Funcionalidade em Desenvolvimento
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Esta página permitirá ao Chanceler gerenciar todos os membros (mesmas funcionalidades do Secretário), incluindo:
          </Typography>
          <Box component="ul" sx={{ color: 'rgba(255,255,255,0.6)', mt: 2 }}>
            <li>Cadastro de novos membros</li>
            <li>Edição de dados pessoais e maçônicos</li>
            <li>Gerenciamento de familiares</li>
            <li>Histórico de cargos e condecorações</li>
            <li>Reset de senha</li>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ChancelerCadastro;
