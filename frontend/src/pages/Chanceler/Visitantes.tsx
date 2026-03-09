import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import { PersonAdd, Save, History as HistoryIcon } from '@mui/icons-material';
import { getSessions, registerVisitorAttendance, getSessionAttendance } from '../../services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Session {
  id: number;
  session_date: string;
  start_time: string;
  status: string;
  type: string;
}

const ChancelerVisitantes: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | ''>('');

  
  // Lista de presença atual (para ver quem já está lá)
  const [currentVisitors, setCurrentVisitors] = useState<any[]>([]);
  
  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    cim: '',
    degree: 'Mestre',
    manual_lodge_name: '',
    manual_lodge_number: '',
    manual_lodge_obedience: '',
    remarks: ''
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
     if(selectedSessionId) {
         fetchVisitors(selectedSessionId as number);
     }
  }, [selectedSessionId]);

  const fetchSessions = async () => {

    try {
      const response = await getSessions();
      const sorted = response.data.sort((a: Session, b: Session) => 
        new Date(b.session_date).getTime() - new Date(a.session_date).getTime()
      );
      setSessions(sorted);
      
      const active = sorted.find((s: Session) => s.status === 'EM_ANDAMENTO' || s.status === 'AGENDADA');
      if (active) setSelectedSessionId(active.id);
      else if (sorted.length > 0) setSelectedSessionId(sorted[0].id);

    } catch (err) {
      console.error('Erro ao buscar sessões', err);
    }
  };

  const fetchVisitors = async (sessionId: number) => {
      try {
          const response = await getSessionAttendance(sessionId);
          // O backend retorna lista mista. Precisamos filtrar visitantes??
          // O get_session_attendance retorna SessionAttendanceWithMemberResponse que tem 'member' ou 'visitor'.
          // Precisamos ver a estrutura do response do backend em attendance_service.py
          // O service retorna lista de SessionAttendance. O schema tem fields: member (MemberSchema) e visitor (VisitorSchema).
          
          if(response.data) {
              const visitors = response.data.filter((r: any) => r.visitor !== null);
              setCurrentVisitors(visitors);
          }
      } catch (err) {
          console.error("Erro ao buscar presença", err);
      }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionId) {
        setErrorMsg("Selecione uma sessão primeiro.");
        return;
    }
    
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await registerVisitorAttendance(selectedSessionId as number, formData);
      setSuccessMsg("Visitante registrado com sucesso!");
      setFormData({
        full_name: '',
        cim: '',
        degree: 'Mestre',
        manual_lodge_name: '',
        manual_lodge_number: '',
        manual_lodge_obedience: '',
        remarks: ''
      });
      fetchVisitors(selectedSessionId as number); // Refresh lista
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Erro ao registrar visitante. Verifique os dados ou se ele já foi registrado.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
      <Box sx={{ p: 3 }}>
          {/* Header */}
          <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
            <PersonAdd sx={{ fontSize: 40, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff' }}>
                Livro de Presença (Visitantes)
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                Registre a presença de Irmãos visitantes de outras Lojas
              </Typography>
            </Box>
          </Box>
          {/* Seletor de Sessão */}
          <Card sx={{ mb: 3, bgcolor: '#1e293b', border: '1px solid rgba(255,255,255,0.05)' }}>
            <CardContent>
                <FormControl fullWidth size="small">
                    <InputLabel sx={{ color: '#aaa' }}>Sessão de Referência</InputLabel>
                    <Select
                        value={selectedSessionId}
                        label="Sessão de Referência"
                        onChange={(e) => setSelectedSessionId(Number(e.target.value))}
                        sx={{ color: '#fff', '.MuiOutlinedInput-notchedOutline': { borderColor: '#444' } }}
                    >
                         {sessions.map((session) => (
                            <MenuItem key={session.id} value={session.id}>
                                {format(new Date(session.session_date), "dd/MM/yyyy", { locale: ptBR })} - {session.type} ({session.status})
                            </MenuItem>
                         ))}
                    </Select>
                </FormControl>
            </CardContent>
          </Card>
          <Grid container spacing={3}>
            {/* Formulário de Cadastro */}
            <Grid
                size={{
                    xs: 12,
                    md: 7
                }}>
                <Card sx={{ bgcolor: '#1e293b', borderRadius: 2 }}>
                    <CardContent>
                        <Typography variant="h6" sx={{ color: '#fff', mb: 3 }}>Novo Registro de Visita</Typography>
                        
                        {successMsg && <Alert severity="success" sx={{ mb: 2 }}>{successMsg}</Alert>}
                        {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}

                        <form onSubmit={handleSubmit}>
                            <Grid container spacing={2}>
                                <Grid
                                    size={{
                                        xs: 12
                                    }}>
                                    <TextField
                                        fullWidth
                                        label="Nome Completo do Irmão"
                                        name="full_name"
                                        value={formData.full_name}
                                        onChange={handleChange}
                                        required
                                        variant="outlined"
                                        size="small"
                                    />
                                </Grid>
                                <Grid
                                    size={{
                                        xs: 6
                                    }}>
                                    <TextField
                                        fullWidth
                                        label="CIM"
                                        name="cim"
                                        value={formData.cim}
                                        onChange={handleChange}
                                        required
                                        variant="outlined"
                                        size="small"
                                    />
                                </Grid>
                                <Grid
                                    size={{
                                        xs: 6
                                    }}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Grau</InputLabel>
                                        <Select
                                            name="degree"
                                            value={formData.degree}
                                            label="Grau"
                                            onChange={handleChange}
                                        >
                                            <MenuItem value="Aprendiz">Aprendiz</MenuItem>
                                            <MenuItem value="Companheiro">Companheiro</MenuItem>
                                            <MenuItem value="Mestre">Mestre</MenuItem>
                                            <MenuItem value="Mestre Instalado">Mestre Instalado</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                
                                <Grid
                                    size={{
                                        xs: 12
                                    }}>
                                    <Typography variant="caption" sx={{ color: '#aaa', mt: 2, display: 'block' }}>Dados da Loja de Origem</Typography>
                                </Grid>
                                
                                <Grid
                                    size={{
                                        xs: 8
                                    }}>
                                    <TextField
                                        fullWidth
                                        label="Nome da Loja"
                                        name="manual_lodge_name"
                                        value={formData.manual_lodge_name}
                                        onChange={handleChange}
                                        required
                                        variant="outlined"
                                        size="small"
                                        placeholder="Ex: Estrela do Norte"
                                    />
                                </Grid>
                                <Grid
                                    size={{
                                        xs: 4
                                    }}>
                                    <TextField
                                        fullWidth
                                        label="Número"
                                        name="manual_lodge_number"
                                        value={formData.manual_lodge_number}
                                        onChange={handleChange}
                                        required
                                        variant="outlined"
                                        size="small"
                                    />
                                </Grid>
                                <Grid
                                    size={{
                                        xs: 12
                                    }}>
                                    <TextField
                                        fullWidth
                                        label="Obediência/Potência"
                                        name="manual_lodge_obedience"
                                        value={formData.manual_lodge_obedience}
                                        onChange={handleChange}
                                        variant="outlined"
                                        size="small"
                                        placeholder="Ex: GOB, GL, GLEB"
                                    />
                                </Grid>
                                
                                <Grid
                                    size={{
                                        xs: 12
                                    }}>
                                    <Button 
                                        type="submit" 
                                        variant="contained" 
                                        fullWidth 
                                        size="large"
                                        disabled={submitting}
                                        startIcon={submitting ? <CircularProgress size={20} /> : <Save />}
                                    >
                                        Registrar Presença
                                    </Button>
                                </Grid>
                            </Grid>
                        </form>
                    </CardContent>
                </Card>
            </Grid>

            {/* Lista de Visitantes na Sessão */}
            <Grid
                size={{
                    xs: 12,
                    md: 5
                }}>
                <Card sx={{ bgcolor: '#1e293b', borderRadius: 2, height: '100%' }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <HistoryIcon sx={{ color: '#aaa' }} />
                            <Typography variant="h6" sx={{ color: '#fff' }}>Visitantes Habilitados</Typography>
                        </Box>
                        
                        {currentVisitors.length === 0 ? (
                            <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic' }}>
                                Nenhum visitante registrado nesta sessão.
                            </Typography>
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                {currentVisitors.map((att, idx) => (
                                    <Box key={idx} sx={{ p: 1.5, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <Typography variant="subtitle2" sx={{ color: '#fff' }}>
                                            {att.visitor.full_name}
                                        </Typography>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                                            <Typography variant="caption" sx={{ color: '#aaa' }}>
                                                {att.visitor.cim} - {att.visitor.degree}
                                            </Typography>
                                            <Chip label="Presente" color="success" size="small" sx={{ height: 20, fontSize: '0.65rem' }} />
                                        </Box>
                                        <Typography variant="caption" sx={{ color: '#888', display: 'block', mt: 0.5 }}>
                                            {att.visitor.manual_lodge_name} nº {att.visitor.manual_lodge_number} ({att.visitor.manual_lodge_obedience})
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </CardContent>
                </Card>
            </Grid>
          </Grid>
      </Box>
  );
};

export default ChancelerVisitantes;
