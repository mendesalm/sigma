import React from 'react';
import { Box, Card, CardContent, Typography, Button, Stack, Divider } from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useNavigate } from 'react-router-dom';

const OnboardingGuide: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Card sx={{ maxWidth: 800, mx: 'auto', mt: 4, p: 2, bgcolor: 'background.paper', boxShadow: 3 }}>
      <CardContent>
        <Typography variant="h4" component="div" gutterBottom color="primary">
          Bem-vindo à sua nova Loja!
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Parabéns pela criação da sua loja no sistema Sigma. Para começar a operar, você precisa configurar os dados iniciais.
          Siga os passos abaixo para deixar tudo pronto:
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Stack spacing={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <PersonAddIcon color="primary" sx={{ fontSize: 40 }} />
            <Box flexGrow={1}>
              <Typography variant="h6">1. Cadastrar Membros</Typography>
              <Typography variant="body2" color="text.secondary">
                Adicione os primeiros irmãos da loja. Você precisará dos dados pessoais e maçônicos deles.
              </Typography>
            </Box>
            <Button variant="contained" onClick={() => navigate('/dashboard/management/members')}>
              Cadastrar
            </Button>
          </Box>

          <Box display="flex" alignItems="center" gap={2}>
            <AdminPanelSettingsIcon color="secondary" sx={{ fontSize: 40 }} />
            <Box flexGrow={1}>
              <Typography variant="h6">2. Atribuir Cargos</Typography>
              <Typography variant="body2" color="text.secondary">
                Defina quem ocupará os cargos administrativos e ritualísticos da loja.
              </Typography>
            </Box>
            <Button variant="outlined" onClick={() => navigate('/dashboard/webmaster-role-assignment')}>
              Atribuir
            </Button>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default OnboardingGuide;
