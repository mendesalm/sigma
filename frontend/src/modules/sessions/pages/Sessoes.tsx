import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { Event } from '@mui/icons-material';

const SecretarioSessoes: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Event sx={{ fontSize: 40, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff' }}>
            Sessões
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            Gerenciamento completo de sessões da loja
          </Typography>
        </Box>
      </Box>

      <Card sx={{ bgcolor: '#1e293b', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
            Funcionalidade em Desenvolvimento
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Esta página permitirá ao Secretário gerenciar sessões, incluindo:
          </Typography>
          <Box component="ul" sx={{ color: 'rgba(255,255,255,0.6)', mt: 2 }}>
            <li>Cadastro de novas sessões</li>
            <li>Edição de data, horário e tipo de sessão</li>
            <li>Definição da ordem do dia</li>
            <li>Geração automática de ata</li>
            <li>Controle de status (Agendada, Realizada, Cancelada)</li>
            <li>Histórico de sessões</li>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SecretarioSessoes;
