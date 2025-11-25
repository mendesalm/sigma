import React from 'react';
import { Box, Typography, Container } from '@mui/material';

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) =>
          theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[200],
      }}
    >
      <Container maxWidth="lg">
        <Typography variant="body2" color="text.secondary" align="center">
          &copy; {new Date().getFullYear()} SiGMa. Todos os direitos reservados.
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          Desenvolvido por [Seu Nome/Empresa]
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          Contato: suporte@sigma.com.br
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;
