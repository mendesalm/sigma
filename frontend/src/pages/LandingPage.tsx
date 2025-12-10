import React from "react";
import { Box, Typography, Grid, Paper } from "@mui/material";
import { Security, People, Cloud, Speed } from "@mui/icons-material";
import logoSigma from "../assets/images/SigmaLogo.png";

const features = [
  {
    icon: <Security fontSize="large" />,
    title: "Segurança e Privacidade",
    description:
      "Acesso restrito por perfil (RBAC), garantindo que apenas usuários autorizados acessem informações sensíveis.",
  },
  {
    icon: <People fontSize="large" />,
    title: "Gestão de Membros",
    description:
      "Cadastro centralizado, controle de graus, e histórico completo dos membros de sua loja ou obediência.",
  },
  {
    icon: <Cloud fontSize="large" />,
    title: "Tudo na Nuvem",
    description:
      "Acesse suas informações de qualquer lugar, a qualquer hora, com a segurança de uma plataforma web moderna.",
  },
  {
    icon: <Speed fontSize="large" />,
    title: "Agilidade e Automação",
    description:
      "Processos automatizados para agendamento de sessões, comunicação e geração de documentos.",
  },
];

const LandingPage: React.FC = () => {
// const theme = useTheme();
  return (
    <Box
      sx={{
        color: "text.primary", // Revert to theme's primary text color
        minHeight: "100vh", // Ensure the entire page takes at least full viewport height
        display: "flex",
        flexDirection: "column",
        backgroundImage: `url('/src/assets/images/bg.jpg')`, // Use Sigma.jpg as background
        backgroundSize: "cover", // Cover the entire background
        backgroundPosition: "center", // Center the background image
        backgroundRepeat: "no-repeat", // Do not repeat the image
        backgroundAttachment: "fixed", // Keep the background fixed during scroll
        position: 'relative', // Needed for absolute positioning of the blur box
      }}
    >
      <Box
        sx={{
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "calc(100vh)", 
          mt: { xs: 10, md: 12 }, // Adjusted for new header height
          px: { xs: 2, md: 0 }, 
          scrollSnapAlign: 'start', 
          scrollSnapStop: 'always', 
          boxSizing: 'border-box', 
        }}
      >
        <Box sx={{ maxWidth: "lg", mx: "auto" }}>
          <Box sx={{ mb: 4 }}>
            <img
              src={logoSigma}
              alt="Sigma Logo"
              style={{ maxHeight: "400px", width: "auto", filter: "drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.5))" }}
            />
          </Box>
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            sx={{ fontWeight: "bold" }}
          >
            SiGMa
          </Typography>
          <Typography
            variant="h5"
            component="p"
            color="text.secondary"
            sx={{ mb: 4, maxWidth: "800px", mx: "auto" }}
          >
            Sua plataforma completa para gestão integrada de Lojas Maçônicas.
          </Typography>
        </Box>
      </Box>

      <Box sx={{ scrollSnapAlign: 'start', scrollSnapStop: 'always', width: '100%' }}>
        <Box
          id="features"
          sx={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            py: 8, // Keep some vertical padding
            backgroundColor: "background.paper",
            px: { xs: 2, md: 0 },
          }}
        >
          <Box sx={{ maxWidth: "lg", mx: "auto" }}>
            <Typography
              variant="h3"
              component="h2"
              gutterBottom
              align="center"
              sx={{ fontWeight: "bold", mb: 6 }}
            >
              Uma Plataforma Completa
            </Typography>
            <Grid container spacing={4}>
              {features.map((feature) => (
                <Grid item xs={12} sm={6} md={3} key={feature.title}>
                  <Paper
                    elevation={3}
                    sx={{ p: 4, textAlign: "center", height: "100%" }}
                  >
                    <Box sx={{ color: "secondary.main", mb: 2 }}>
                      {feature.icon}
                    </Box>
                    <Typography
                      variant="h6"
                      component="h3"
                      gutterBottom
                      sx={{ fontWeight: "medium" }}
                    >
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
      </Box>
    </Box>
  );
};

export default LandingPage;
