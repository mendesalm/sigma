import React from "react";
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Button, 
  IconButton, 
  Container,
  useTheme,
  Chip
} from "@mui/material";
import { 
  Security, 
  People, 
  Cloud, 
  Speed, 
  Brightness4, 
  Brightness7, 
  AccountBalance,
  MenuBook,
  Restaurant,
  Architecture,
  SyncAlt,
  Login
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useCustomTheme } from "@/shared/contexts/ThemeContext";
import logoSigma from "@/assets/images/SigmaLogo.png";

const basicModules = [
  { title: "Secretaria", icon: <People fontSize="large" />, desc: "Gestão completa de membros e documentação." },
  { title: "Tesouraria", icon: <AccountBalance fontSize="large" />, desc: "Controle financeiro, mensalidades e balancetes." },
  { title: "Chancelaria", icon: <Security fontSize="large" />, desc: "Controle de presenças, graus e interações." }
];

const optionalModules = [
  { title: "Banquete", icon: <Restaurant />, desc: "Gestão de eventos e ágapes." },
  { title: "Biblioteca", icon: <MenuBook />, desc: "Acervo literário e empréstimos." },
  { title: "Harmonia", icon: <Speed />, desc: "Gestão musical e acervo sonoro." },
  { title: "Arquiteto", icon: <Architecture />, desc: "Controle patrimonial e inventário." }
];

const LandingPage: React.FC = () => {
  const muiTheme = useTheme();
  const { mode, toggleColorMode } = useCustomTheme();
  const navigate = useNavigate();

  const isDark = mode === 'dark';

  // Estilos de Glassmorphism
  const glassStyle = {
    background: isDark ? 'rgba(19, 27, 41, 0.65)' : 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.5)'}`,
    boxShadow: isDark ? '0 8px 32px 0 rgba(0, 0, 0, 0.37)' : '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
    borderRadius: '16px',
  };

  return (
    <Box
      sx={{
        color: "text.primary",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundImage: `url('/src/assets/images/bg.jpg')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.3)',
          zIndex: 0
        }
      }}
    >


      {/* Main Content Area */}
      <Box sx={{ position: 'relative', zIndex: 1, pt: 14, pb: 8, flexGrow: 1 }}>
        <Container maxWidth="lg">
          
          {/* Hero Section */}
          <Box sx={{ textAlign: 'center', mt: 4, mb: 10 }}>
            <Paper elevation={0} sx={{ ...glassStyle, p: { xs: 4, md: 8 }, display: 'inline-block', maxWidth: '800px', mx: 'auto' }}>
              <img
                src={logoSigma}
                alt="Sigma Logo"
                style={{ maxHeight: "220px", width: "auto", filter: "drop-shadow(0px 8px 16px rgba(0,0,0,0.4))", marginBottom: '24px' }}
              />
              <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: "800", background: muiTheme.palette.primary.main, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Sistema Sigma
              </Typography>
              <Typography variant="h5" color="text.secondary" sx={{ mb: 4, fontWeight: 400 }}>
                A plataforma maçônica mais moderna e integrada.
                Conectando Lojas, Potências e Subpotências em um único ecossistema.
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Button variant="contained" size="large" color="primary" sx={{ borderRadius: '30px', px: 4, py: 1.5, fontSize: '1.1rem' }}>
                  Teste Grátis por 30 Dias
                </Button>
                <Button variant="outlined" size="large" sx={{ borderRadius: '30px', px: 4, py: 1.5, fontSize: '1.1rem', borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)', color: isDark ? '#fff' : '#000' }}>
                  Conheça os Módulos
                </Button>
              </Box>
            </Paper>
          </Box>

          {/* Abrangência e Integração */}
          <Box sx={{ mb: 10 }}>
            <Grid container spacing={4} alignItems="stretch">
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper elevation={0} sx={{ ...glassStyle, p: 5, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Abrangência Total
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 3, fontSize: '1.1rem' }}>
                    O Sistema Sigma foi desenhado para atender todos os níveis da estrutura maçônica brasileira:
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Cloud color="primary" />
                      <Typography><strong>Potências:</strong> GOB, Grandes Lojas, COMAB</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <People color="primary" />
                      <Typography><strong>Subpotências:</strong> Grandes Orientes Estaduais</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <AccountBalance color="primary" />
                      <Typography><strong>Lojas:</strong> Diretamente subordinadas e jurisdicionadas</Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper elevation={0} sx={{ ...glassStyle, p: 5, height: '100%', background: isDark ? 'linear-gradient(135deg, rgba(19, 27, 41, 0.8) 0%, rgba(0, 176, 255, 0.1) 100%)' : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(0, 176, 255, 0.2) 100%)' }}>
                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <SyncAlt sx={{ fontSize: 60, color: muiTheme.palette.primary.main }} />
                  </Box>
                  <Typography variant="h4" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
                    Integração Poderosa
                  </Typography>
                  <Typography variant="body1" align="center" sx={{ fontSize: '1.1rem', mb: 2 }}>
                    Nosso maior diferencial. Esqueça sistemas isolados e redigitação de dados.
                  </Typography>
                  <Typography variant="body1" align="center" sx={{ fontSize: '1.1rem' }}>
                    Com a forte integração do Sigma, a comunicação entre <strong>Loja ↔ Loja</strong> e <strong>Loja ↔ Potência/Subpotência</strong> flui naturalmente de forma segura e imediata.
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>

          {/* Módulos do Sistema */}
          <Box sx={{ mb: 10 }}>
            <Typography variant="h3" align="center" gutterBottom sx={{ fontWeight: 'bold', mb: 6, color: isDark ? '#fff' : '#000' }}>
              Módulos do Sistema
            </Typography>
            
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: muiTheme.palette.primary.main, mb: 3 }}>
              Módulos Básicos (Inclusos no Teste de 30 Dias)
            </Typography>
            <Grid container spacing={4} sx={{ mb: 6 }}>
              {basicModules.map((mod) => (
                <Grid size={{ xs: 12, sm: 4 }} key={mod.title}>
                  <Paper elevation={0} sx={{ ...glassStyle, p: 4, textAlign: "center", height: "100%", transition: 'transform 0.3s', '&:hover': { transform: 'translateY(-10px)' } }}>
                    <Box sx={{ color: "primary.main", mb: 2 }}>{mod.icon}</Box>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>{mod.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{mod.desc}</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: muiTheme.palette.secondary.main, mb: 3 }}>
              Módulos Opcionais (Integração Futura)
            </Typography>
            <Grid container spacing={3}>
              {optionalModules.map((mod) => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={mod.title}>
                  <Paper elevation={0} sx={{ ...glassStyle, p: 3, textAlign: "center", height: "100%", opacity: 0.85 }}>
                    <Box sx={{ color: "secondary.main", mb: 2 }}>{mod.icon}</Box>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: "bold" }}>{mod.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{mod.desc}</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Assinatura */}
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Paper elevation={0} sx={{ ...glassStyle, p: 6, display: 'inline-block', maxWidth: '800px', mx: 'auto', border: `2px solid ${muiTheme.palette.primary.main}` }}>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
                Experimente o Sigma Hoje
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
                Transforme a gestão da sua Loja ou Potência. Cadastre-se e aproveite <Chip label="30 Dias Grátis" color="primary" sx={{ fontWeight: 'bold', fontSize: '1rem', py: 2 }} /> em todos os módulos básicos.
              </Typography>
              <Button variant="contained" size="large" color="primary" onClick={() => navigate('/login')} sx={{ borderRadius: '30px', px: 5, py: 1.5, fontSize: '1.2rem', fontWeight: 'bold' }}>
                Começar Agora
              </Button>
            </Paper>
          </Box>

        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
