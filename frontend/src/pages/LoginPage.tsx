import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
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
  Alert,
} from '@mui/material';
import logoSigma from "../assets/images/SigmaLogo.png";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();


  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
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
      const errorMessage = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Login failed. Please check your credentials.';
      setError(errorMessage);
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
        backgroundImage: `url('/src/assets/images/bg.jpg')`, 
        backgroundSize: "cover", 
        backgroundPosition: "center", 
        backgroundRepeat: "no-repeat", 
        backgroundAttachment: "fixed", 
        position: 'relative', 
        pt: { xs: 10, md: 12 }, // Adjusted for new header height + spacing
      }}
    >
      {/* Blur effect box removed */}
      <Container component="main" maxWidth="xs" sx={{
        margin: 'auto',
        display: 'flex',
        flexDirection: 'column', // Align items in a column
        alignItems: 'center',
        justifyContent: 'center',
        flexGrow: 1, // Allow it to grow and center content vertically
        py: 4, // Add some vertical padding
      }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.05)', // More transparent white
            backdropFilter: 'blur(10px)', // Glassmorphism blur
            border: '1px solid rgba(255, 255, 255, 0.1)', // More transparent subtle border
            p: 4,
            borderRadius: 2,
            boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.2)', // Lighter glassmorphism shadow
            width: '100%',
            maxWidth: '600px', // Limit the width of the form box
          }}
        >
          <Box sx={{ mb: 3 }}> {/* Box for the logo */}
            <img
              src={logoSigma}
              alt="Sigma Logo"
              style={{ maxHeight: "120px", width: "auto", filter: "drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.5))" }}
            />
          </Box>
          <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
            Área Restrita
          </Typography>
          <Box component="form" onSubmit={handleFormSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
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
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Senha"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              variant="outlined"
            />
            <FormControlLabel
              control={
                <Checkbox
                  value="remember"
                  color="primary"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                />
              }
              label="Lembrar-me"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Entrar'}
            </Button>
            {error && (
              <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
                {error}
              </Alert>
            )}
                      <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', mt: 2, gap: 1 }}>
                                                <Link component={RouterLink} to="/forgot-password" variant="body2" sx={{ textAlign: 'center' }}>
                                                  Esqueci a senha
                                                </Link>
                                                <Link component={RouterLink} to="/register" variant="body2" sx={{ textAlign: 'center' }}>
                                                  Não tem uma conta? Solicitar cadastro
                                                </Link>            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default LoginPage;