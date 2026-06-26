import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Link
} from '@mui/material';
import logoSigma from "../../../assets/images/SigmaLogo.png";
import api from '@/shared/services/api';

interface Obedience {
  id: number;
  name: string;
}

const TenantOnboarding: React.FC = () => {
  const [obediences, setObediences] = useState<Obedience[]>([]);
  const [selectedObedience, setSelectedObedience] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchObediences = async () => {
      try {
        const response = await api.get('/auth/obediences');
        setObediences(response.data);
      } catch (error) {
        console.error("Erro ao carregar potências:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchObediences();
  }, []);

  const handleContinue = () => {
    if (selectedObedience) {
      localStorage.setItem('tenant_potencia', selectedObedience);
      navigate('/login');
    }
  };

  const handleAdminAccess = () => {
    localStorage.setItem('tenant_potencia', 'admin');
    navigate('/login');
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
        backgroundRepeat: "no-repeat", 
        backgroundAttachment: "fixed", 
        position: 'relative', 
        pt: { xs: 10, md: 12 },
      }}
    >
      <Container component="main" maxWidth="xs" sx={{
        margin: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flexGrow: 1,
        py: 4,
      }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            p: 4,
            borderRadius: 2,
            boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.2)',
            width: '100%',
            maxWidth: '600px',
          }}
        >
          <Box sx={{ mb: 3 }}>
            <img
              src={logoSigma}
              alt="Sigma Logo"
              style={{ maxHeight: "120px", width: "auto", filter: "drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.5))" }}
            />
          </Box>
          <Typography component="h1" variant="h5" sx={{ mb: 1, textAlign: 'center' }}>
            Bem-vindo ao Sigma
          </Typography>
          <Typography variant="body2" sx={{ mb: 3, textAlign: 'center', color: 'text.secondary' }}>
            Para iniciar seu acesso, por favor selecione a Potência (Obediência) a qual você pertence.
          </Typography>

          {isLoading ? (
            <CircularProgress />
          ) : (
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="obedience-select-label">Qual a sua Potência?</InputLabel>
              <Select
                labelId="obedience-select-label"
                id="obedience-select"
                value={selectedObedience}
                label="Qual a sua Potência?"
                onChange={(e) => setSelectedObedience(e.target.value)}
              >
                {obediences.map((ob) => (
                  <MenuItem key={ob.id} value={ob.id.toString()}>
                    {ob.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={handleContinue}
            disabled={!selectedObedience || isLoading}
            sx={{ mb: 2 }}
          >
            Continuar
          </Button>

          <Button
            fullWidth
            variant="text"
            color="inherit"
            onClick={handleAdminAccess}
            sx={{ mt: 1, fontSize: '0.8rem', opacity: 0.7 }}
          >
            Acesso Restrito (Webmaster/Admin)
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default TenantOnboarding;
