import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { FlightTakeoff } from '@mui/icons-material';

const ChancelerVisitacoes: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <FlightTakeoff sx={{ fontSize: 40, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff' }}>
            Visitações
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            Gerenciamento de visitações dos membros a outras lojas
          </Typography>
        </Box>
      </Box>

      <Card sx={{ bgcolor: '#1e293b', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
            Funcionalidade em Desenvolvimento
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Esta página permitirá ao Chanceler gerenciar visitações, incluindo:
          </Typography>
          <Box component="ul" sx={{ color: 'rgba(255,255,255,0.6)', mt: 2 }}>
            <li>Cadastro de visitações realizadas</li>
            <li>Edição e remoção de registros</li>
            <li>Filtros por membro, loja visitada, período</li>
            <li>Relatórios de visitações</li>
            <li>Exportação de dados</li>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ChancelerVisitacoes;
