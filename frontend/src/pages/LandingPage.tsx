import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Box, Typography, Grid, Paper, AppBar, Toolbar } from '@mui/material';
import { Security, People, Cloud, Speed } from '@mui/icons-material';

const features = [
  {
    icon: <Security fontSize="large" />,
    title: 'Segurança e Privacidade',
    description: 'Acesso restrito por perfil (RBAC), garantindo que apenas usuários autorizados acessem informações sensíveis.',
  },
  {
    icon: <People fontSize="large" />,
    title: 'Gestão de Membros',
    description: 'Cadastro centralizado, controle de graus, e histórico completo dos membros de sua loja ou obediência.',
  },
  {
    icon: <Cloud fontSize="large" />,
    title: 'Tudo na Nuvem',
    description: 'Acesse suas informações de qualquer lugar, a qualquer hora, com a segurança de uma plataforma web moderna.',
  },
  {
    icon: <Speed fontSize="large" />,
    title: 'Agilidade e Automação',
    description: 'Processos automatizados para agendamento de sessões, comunicação e geração de documentos.',
  },
];

const LandingPage: React.FC = () => {
  return (
    <Box sx={{ backgroundColor: 'background.default', color: 'text.primary' }}>
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar sx={{ maxWidth: 'lg', mx: 'auto', width: '100%' }}>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            SiGMa
          </Typography>
          <Box>
            <Button component="a" href="#features" color="inherit">
              Funcionalidades
            </Button>
            <Button component="a" href="#contact" color="inherit">
              Contato
            </Button>
            <Button component={Link} to="/login" variant="contained" color="primary">
              Login
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ textAlign: 'center', py: { xs: 8, md: 16 }, px: { xs: 2, md: 0 } }}>
        <Box sx={{ maxWidth: 'lg', mx: 'auto' }}>
          <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Conectando Lojas, Fortalecendo a Ordem.
          </Typography>
          <Typography variant="h5" component="p" color="text.secondary" sx={{ mb: 4, maxWidth: '800px', mx: 'auto' }}>
            SiGMa é a plataforma digital moderna para a gestão integrada de Lojas e Obediências Maçônicas. Centralize sua comunicação, administre seus membros e organize suas sessões com segurança e eficiência.
          </Typography>
          <Button component={Link} to="/login" variant="contained" size="large" color="secondary">
            Acessar o Sistema
          </Button>
        </Box>
      </Box>

      <Box id="features" sx={{ py: 8, backgroundColor: 'background.paper', px: { xs: 2, md: 0 } }}>
        <Box sx={{ maxWidth: 'lg', mx: 'auto' }}>
          <Typography variant="h3" component="h2" gutterBottom align="center" sx={{ fontWeight: 'bold', mb: 6 }}>
            Uma Plataforma Completa
          </Typography>
          <Grid container spacing={4}>
            {features.map((feature) => (
              <Grid item xs={12} sm={6} md={3} key={feature.title}>
                <Paper elevation={3} sx={{ p: 4, textAlign: 'center', height: '100%' }}>
                  <Box sx={{ color: 'secondary.main', mb: 2 }}>{feature.icon}</Box>
                  <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'medium' }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>

      <Box component="footer" id="contact" sx={{ py: 4, backgroundColor: 'background.default', px: { xs: 2, md: 0 } }}>
        <Box sx={{ maxWidth: 'lg', mx: 'auto' }}>
          <Typography variant="body2" align="center" color="text.secondary">
            &copy; {new Date().getFullYear()} SiGMa. Todos os direitos reservados.
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary">
            Para mais informações, entre em contato: <a href="mailto:suporte@sigma.com.br" style={{ color: 'lightblue' }}>suporte@sigma.com.br</a>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default LandingPage;