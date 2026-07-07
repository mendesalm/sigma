import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '@/modules/access_control/hooks/useAuth';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import logoSigma from "../../../assets/logos/SigmaLogo.png";
import FirstAccessWizard from '../components/FirstAccessWizard';
import { motion } from 'framer-motion';

const AnimatedBox = motion.create(Box);

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const { login } = useAuth();
  const navigate = useNavigate();

  // useEffect(() => {
  //   const tenantPotencia = localStorage.getItem('tenant_potencia');
  //   if (!tenantPotencia) {
  //     navigate('/onboarding');
  //   }
  // }, [navigate]);

  const handleResetPotencia = () => {
    if (window.confirm("Atenção: Redefinir a Potência apagará sua escolha atual e o levá-lo-á de volta à tela inicial. Deseja continuar?")) {
      localStorage.removeItem('tenant_potencia');
      navigate('/onboarding');
    }
  };

  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const user = await login(email, password);
      if (user.requires_selection) {
        navigate('/select-lodge');
      } else if (user.user_type === 'super_admin') {
        navigate('/dashboard');
      } else if (user.user_type === 'webmaster') {
        if (user.obedience_id) {
          navigate('/dashboard/obedience-dashboard');
        } else {
          navigate('/dashboard/lodge-dashboard');
        }
      } else if (user.user_type === 'member') {
        navigate('/dashboard/lodge-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.response?.data?.detail || err.response?.data?.errors?.[0]?.msg || 'Falha no login. Verifique suas credenciais.';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setIsLoading(false);
    }
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
          <Typography component="h1" variant="h5" sx={{ mb: 1, fontWeight: 700, letterSpacing: '0.5px' }}>
            Acesso Restrito
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Insira suas credenciais para continuar
          </Typography>

          <Box component="form" onSubmit={handleFormSubmit} noValidate sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="CIM ou E-mail"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Senha"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              variant="outlined"
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{ color: 'text.secondary' }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    value="remember"
                    color="primary"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isLoading}
                    sx={{ color: 'rgba(255,255,255,0.3)' }}
                  />
                }
                label={<Typography variant="body2" sx={{ color: 'text.secondary' }}>Lembrar-me</Typography>}
              />
              <Link component={RouterLink} to="/forgot-password" variant="body2" sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                Esqueci a senha
              </Link>
            </Box>
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading}
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
              {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Entrar'}
            </Button>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Não tem uma conta?{' '}
                <Link component={RouterLink} to="/register" sx={{ color: 'primary.main', textDecoration: 'none', fontWeight: 600 }}>
                  Solicitar cadastro
                </Link>
              </Typography>
              
              <Button 
                variant="outlined" 
                onClick={() => setWizardOpen(true)} 
                sx={{ mt: 1, borderRadius: 2, py: 1, width: '100%', borderColor: 'rgba(255,255,255,0.1)', color: 'text.secondary' }}
              >
                Primeiro Acesso / Ativar Conta
              </Button>
              
              <Button 
                variant="text" 
                onClick={handleResetPotencia} 
                sx={{ mt: 2, fontSize: '0.75rem', color: 'text.secondary', opacity: 0.6, '&:hover': { opacity: 1 } }}
              >
                Redefinir Potência Selecionada
              </Button>
            </Box>
          </Box>
        </AnimatedBox>
      </Container>
      <FirstAccessWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
    </Box>
  );
};

export default LoginPage;