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
import logoSigma from "../../../assets/logos/SigmaLogo.png";
import api from '@/shared/services/api';
import { motion } from 'framer-motion';

const AnimatedBox = motion(Box);

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
        const response = await api.get('/auth/obediences?only_top_level=true');
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
        position: 'relative', 
        overflow: 'hidden',
        bgcolor: '#0b111b',
      }}
    >
      {/* Animated Gradient Background */}
      <Box
        sx={{
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: 'radial-gradient(circle at 50% 50%, rgba(0, 176, 255, 0.15) 0%, rgba(11, 17, 27, 1) 50%)',
          animation: 'spin 30s linear infinite',
          zIndex: 0,
          '@keyframes spin': {
            '0%': { transform: 'rotate(0deg)' },
            '100%': { transform: 'rotate(360deg)' },
          }
        }}
      />
      
      {/* Glow Orbs */}
      <Box sx={{ position: 'absolute', top: '10%', left: '20%', width: '300px', height: '300px', background: '#00B0FF', filter: 'blur(150px)', opacity: 0.1, borderRadius: '50%', zIndex: 0 }} />
      <Box sx={{ position: 'absolute', bottom: '10%', right: '20%', width: '300px', height: '300px', background: '#00B0FF', filter: 'blur(150px)', opacity: 0.1, borderRadius: '50%', zIndex: 0 }} />

      <Container component="main" maxWidth="sm" sx={{
        position: 'relative',
        zIndex: 1,
        margin: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flexGrow: 1,
        py: 4,
      }}>
        <AnimatedBox
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: 'rgba(19, 27, 41, 0.6)', 
            backdropFilter: 'blur(20px)', 
            border: '1px solid rgba(255, 255, 255, 0.08)', 
            p: { xs: 4, md: 6 },
            borderRadius: 4,
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)', 
            width: '100%',
          }}
        >
          <Box sx={{ mb: 4, mt: 1 }}>
            <img
              src={logoSigma}
              alt="Sigma Logo"
              style={{ maxHeight: "100px", width: "auto" }}
            />
          </Box>
          <Typography component="h1" variant="h5" sx={{ mb: 1, fontWeight: 700, letterSpacing: '0.5px', textAlign: 'center' }}>
            Bem-vindo ao Sigma
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
            Para iniciar seu acesso, por favor selecione a Potência (Obediência) a qual você pertence.
          </Typography>

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <FormControl fullWidth sx={{ mb: 4 }}>
              <InputLabel id="obedience-select-label">Qual a sua Potência?</InputLabel>
              <Select
                labelId="obedience-select-label"
                id="obedience-select"
                value={selectedObedience}
                label="Qual a sua Potência?"
                onChange={(e) => setSelectedObedience(e.target.value)}
                sx={{
                  bgcolor: 'rgba(0,0,0,0.2)',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255,255,255,0.1)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255,255,255,0.2)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                  }
                }}
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
            sx={{ 
              py: 1.5, 
              mb: 3, 
              fontSize: '1rem', 
              borderRadius: 2,
              boxShadow: '0 4px 14px 0 rgba(0, 176, 255, 0.39)',
              '&:hover': {
                boxShadow: '0 6px 20px rgba(0, 176, 255, 0.23)'
              }
            }}
          >
            Continuar
          </Button>

          <Box sx={{ mt: 2 }}>
            <Button
              variant="text"
              onClick={handleAdminAccess}
              sx={{ fontSize: '0.8rem', color: 'text.secondary', opacity: 0.6, '&:hover': { opacity: 1 } }}
            >
              Acesso Restrito (Webmaster/Admin)
            </Button>
          </Box>
        </AnimatedBox>
      </Container>
    </Box>
  );
};

export default TenantOnboarding;
