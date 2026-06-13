import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Send as SendIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '@/shared/services/api';

const NewMessage: React.FC = () => {
  const navigate = useNavigate();
  const [recipientType, setRecipientType] = useState('lodge');
  const [recipientId, setRecipientId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);

  const getBasePath = () => {
    if (window.location.pathname.includes('/webmaster')) {
      return '/dashboard/lodge-dashboard/webmaster/comunicacoes';
    }
    return '/dashboard/lodge-dashboard/secretario/comunicacoes';
  };

  const handleSend = async () => {
    if (!recipientId || !subject || !body) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        subject,
        body
      };

      if (recipientType === 'lodge') {
        payload.recipient_lodge_id = parseInt(recipientId);
      } else {
        payload.recipient_obedience_id = parseInt(recipientId);
      }

      const res = await api.post('/messages/', payload);
      // Sucesso
      alert("Ofício enviado com sucesso!");
      navigate(`${getBasePath()}/sent`);
    } catch (error) {
      console.error("Erro ao enviar ofício", error);
      alert("Erro ao enviar ofício. Verifique se o ID existe.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#fff' }}>
          Novo Ofício
        </Typography>
        <Button
          variant="outlined"
          onClick={() => navigate(`${getBasePath()}/inbox`)}
          sx={{ borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }}
          startIcon={<ArrowBackIcon />}
        >
          Voltar
        </Button>
      </Box>

      <Paper sx={{ p: 4, bgcolor: '#121826', backgroundImage: 'none', border: '1px solid rgba(255,255,255,0.05)', maxWidth: 800 }}>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <FormControl fullWidth sx={{ maxWidth: 200 }}>
            <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Tipo de Destinatário</InputLabel>
            <Select
              value={recipientType}
              onChange={(e) => setRecipientType(e.target.value)}
              label="Tipo de Destinatário"
              sx={{ color: '#fff', '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' } }}
            >
              <MenuItem value="lodge">Loja</MenuItem>
              <MenuItem value="obedience">Obediência</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label={`ID da ${recipientType === 'lodge' ? 'Loja' : 'Obediência'} (Apenas números)`}
            type="number"
            value={recipientId}
            onChange={(e) => setRecipientId(e.target.value)}
            InputLabelProps={{ style: { color: 'rgba(255,255,255,0.7)' } }}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#fff',
                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
              }
            }}
          />
        </Box>

        <TextField
          fullWidth
          label="Assunto"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          InputLabelProps={{ style: { color: 'rgba(255,255,255,0.7)' } }}
          sx={{
            mb: 3,
            '& .MuiOutlinedInput-root': {
              color: '#fff',
              '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
            }
          }}
        />

        <TextField
          fullWidth
          label="Corpo do Ofício"
          multiline
          rows={10}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          InputLabelProps={{ style: { color: 'rgba(255,255,255,0.7)' } }}
          sx={{
            mb: 3,
            '& .MuiOutlinedInput-root': {
              color: '#fff',
              '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
            }
          }}
        />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => navigate(`${getBasePath()}/inbox`)}
            sx={{ borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
            onClick={handleSend}
            disabled={loading}
          >
            Enviar Ofício
          </Button>
        </Box>

      </Paper>
    </Box>
  );
};

export default NewMessage;
