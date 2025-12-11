import React, { useState, useContext } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Checkbox, 
  FormControlLabel, 
  Divider,
  Grid,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import { Download as DownloadIcon, Description as PdfIcon } from '@mui/icons-material';
import { AuthContext } from '../../../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const QuadroObreiros: React.FC = () => {
  const { user } = useContext(AuthContext) || {};
  const [loading, setLoading] = useState(false);
  const [showEmail, setShowEmail] = useState(true);
  const [showPhone, setShowPhone] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    if (!user) return;
    
    // Fallback: tenta pegar lodge_id do active_role ou warning
    // Idealmente, o contexto de lodge está no user ou URL
    // Vamos assumir usuario logado com lodge_id (webmaster check)
    // Se for user normal, precisaria de um seletor de loja se tiver multiplas.
    // Vamos usar o lodge_id do token se disponivel ou hardcode do exemplo 2181 para teste
    const lodgeId = user.lodge_id || 1; // Ajustar conforme lógica real da app

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        show_email: showEmail.toString(),
        show_phone: showPhone.toString()
      });

      const response = await fetch(`${API_URL}/reports/lodge/${lodgeId}/members/pdf?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Falha ao gerar relatório');
      }

      // Download Blob
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `quadro_obreiros_${lodgeId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

    } catch (err) {
      console.error(err);
      setError('Erro ao baixar o relatório. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
        <Snackbar 
            open={!!error} 
            autoHideDuration={6000} 
            onClose={() => setError(null)}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
            <Alert severity="error" onClose={() => setError(null)}>
                {error}
            </Alert>
        </Snackbar>

      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', color: '#fff' }}>
        Relatórios do Quadro
      </Typography>

      <Paper sx={{ p: 4, maxWidth: 600, mx: 'auto', bgcolor: '#1e293b', color: '#fff' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <PdfIcon sx={{ fontSize: 40, mr: 2, color: '#e53935' }} />
          <Typography variant="h6">
            Quadro de Obreiros da Loja
          </Typography>
        </Box>
        
        <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />
        
        <Typography variant="body2" sx={{ mb: 3, color: 'rgba(255,255,255,0.7)' }}>
          Gera um arquivo PDF contendo a lista completa de membros ativos da Loja, incluindo CIM, Grau e Cargo Atual. Personalize as colunas abaixo:
        </Typography>

        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Checkbox 
                  checked={showEmail} 
                  onChange={(e) => setShowEmail(e.target.checked)} 
                  sx={{ color: 'rgba(255,255,255,0.5)', '&.Mui-checked': { color: '#2196f3' } }}
                />
              }
              label="Incluir E-mail"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Checkbox 
                  checked={showPhone} 
                  onChange={(e) => setShowPhone(e.target.checked)} 
                   sx={{ color: 'rgba(255,255,255,0.5)', '&.Mui-checked': { color: '#2196f3' } }}
                />
              }
              label="Incluir Telefone"
            />
          </Grid>
        </Grid>

        <Button
          variant="contained"
          size="large"
          fullWidth
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
          onClick={handleDownload}
          disabled={loading}
          sx={{
            bgcolor: '#2196f3',
            height: 50,
            '&:hover': { bgcolor: '#1976d2' }
          }}
        >
          {loading ? 'Gerando PDF...' : 'Baixar Relatório (PDF)'}
        </Button>
      </Paper>
    </Box>
  );
};

export default QuadroObreiros;
