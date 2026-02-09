import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';
import {
  HowToReg,
  CheckCircle,
  Cancel,
  AccessTime,
  QrCode,
  Edit as EditIcon,
  Person
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getSessions, getSessionAttendance, updateManualAttendance } from '../../services/api';

// Interfaces baseadas na resposta da API (session_attendance_schema.py)
interface MemberInfo {
  id: number;
  full_name: string;
  cim?: string;
}

interface VisitorInfo {
  id: number;
  full_name: string;
  cim?: string;
  manual_lodge_name?: string;
}

interface AttendanceRecord {
  id: number;
  session_id: number;
  member_id: number | null;
  visitor_id: number | null;
  attendance_status: string; // 'Presente', 'Ausente', 'Justificado'
  check_in_method: string | null;
  check_in_datetime: string | null;
  member: MemberInfo | null;
  visitor: VisitorInfo | null;
}

interface Session {
  id: number;
  session_date: string;
  start_time: string;
  status: string;
  type: string;
}

const ChancelerPresencas: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | ''>('');
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar sessões recentes ao montar
  useEffect(() => {
    fetchSessions();
  }, []);

  // Carregar lista de presença quando uma sessão é selecionada
  useEffect(() => {
    if (selectedSessionId) {
      fetchAttendance(selectedSessionId as number);
    } else {
      setAttendanceList([]);
    }
  }, [selectedSessionId]);

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const response = await getSessions();
      // Ordenar por data decrescente
      const sorted = response.data.sort((a: Session, b: Session) => 
        new Date(b.session_date).getTime() - new Date(a.session_date).getTime()
      );
      setSessions(sorted);
      
      const active = sorted.find((s: Session) => s.status === 'EM_ANDAMENTO' || s.status === 'AGENDADA');
      if (active) {
        setSelectedSessionId(active.id);
      } else if (sorted.length > 0) {
        setSelectedSessionId(sorted[0].id);
      }
    } catch (err) {
      console.error('Erro ao buscar sessões:', err);
      setError('Falha ao carregar lista de sessões.');
    } finally {
      setLoadingSessions(false);
    }
  };

  const fetchAttendance = async (sessionId: number) => {
    setLoadingAttendance(true);
    try {
      const response = await getSessionAttendance(sessionId);
      // Backend retorna SessionAttendanceWithMemberResponse[]
      const data = response.data;
      
      // Separar: Membros do Quadro primeiro, depois Visitantes
      const members = data.filter((r: AttendanceRecord) => r.member !== null);
      const visitors = data.filter((r: AttendanceRecord) => r.visitor !== null);
      
      // Ordenar alfabeticamente
      members.sort((a: any, b: any) => (a.member?.full_name || '').localeCompare(b.member?.full_name || ''));
      visitors.sort((a: any, b: any) => (a.visitor?.full_name || '').localeCompare(b.visitor?.full_name || ''));

      setAttendanceList([...members, ...visitors]);
    } catch (err) {
      console.error('Erro ao buscar presenças:', err);
      setError('Falha ao carregar lista de presença.');
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleStatusChange = async (record: AttendanceRecord, newStatus: string) => {
    if (!selectedSessionId) return;

    // Só permite atualizar PRESENÇA de Membro via endpoint manual
    if (!record.member_id) {
        // TODO: Endpoint para atualizar status de VISITANTE (se necessário)
        // Por hora, só membros.
        return; 
    }

    // Atualização otimista
    const originalList = [...attendanceList];
    setAttendanceList(prev => prev.map(r => 
      r.id === record.id ? { ...r, attendance_status: newStatus } : r
    ));

    try {
        await updateManualAttendance(selectedSessionId as number, record.member_id, newStatus);
    } catch (err) {
        console.error('Erro ao atualizar presença:', err);
        setError('Erro ao salvar presença. Revertendo...');
        setAttendanceList(originalList);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Presente': return 'success';
      case 'Ausente': return 'error';
      case 'Justificado': return 'warning';
      default: return 'default';
    }
  };

  const getCheckInIcon = (method: string) => {
     if (method === 'QR_CODE') return <QrCode fontSize="small" />;
     if (method === 'MANUAL') return <EditIcon fontSize="small" />;
     return null;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Cabeçalho */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <HowToReg sx={{ fontSize: 40, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff' }}>
            Controle de Presença
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            Gerencie a frequência dos Irmãos nas sessões da Loja
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Seletor de Sessão */}
      <Card sx={{ mb: 3, bgcolor: '#1e293b', border: '1px solid rgba(255,255,255,0.05)' }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel id="session-select-label" sx={{ color: 'rgba(255,255,255,0.7)' }}>Selecione a Sessão</InputLabel>
                <Select
                  labelId="session-select-label"
                  label="Selecione a Sessão"
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(Number(e.target.value))}
                  sx={{ 
                    color: '#fff',
                    '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.4)' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' }
                  }}
                  disabled={loadingSessions}
                >
                  {sessions.map((session) => (
                    <MenuItem key={session.id} value={session.id}>
                      {format(new Date(session.session_date), "dd/MM/yyyy", { locale: ptBR })} - {session.type} ({session.status})
                    </MenuItem>
                  ))}
                  {sessions.length === 0 && !loadingSessions && (
                      <MenuItem value="" disabled>Nenhuma sessão encontrada</MenuItem>
                  )}
                </Select>
              </FormControl>
            </Grid>
             <Grid item xs={12} md={6}>
                {selectedSessionId && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                         <Chip 
                            label={sessions.find(s => s.id === selectedSessionId)?.status} 
                            color={sessions.find(s => s.id === selectedSessionId)?.status === 'EM_ANDAMENTO' ? 'success' : 'default'}
                            variant="outlined"
                         />
                         <Typography variant="body2" sx={{ color: '#aaa', alignSelf: 'center' }}>
                            Início: {sessions.find(s => s.id === selectedSessionId)?.start_time}
                         </Typography>
                    </Box>
                )}
             </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Lista de Presença */}
      <Card sx={{ bgcolor: '#1e293b', borderRadius: 2 }}>
        <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#fff' }}>Lista de Presença</Typography>
                <Box>
                     <Typography variant="caption" sx={{ color: '#aaa', mr: 2 }}>
                        Total: {attendanceList.length}
                     </Typography>
                     <Typography variant="caption" sx={{ color: '#aaa' }}>
                        Presentes: {attendanceList.filter(a => a.attendance_status === 'Presente').length}
                     </Typography>
                </Box>
            </Box>

            {loadingAttendance ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            ) : attendanceList.length > 0 ? (
                <TableContainer component={Paper} sx={{ bgcolor: 'transparent', backgroundImage: 'none', boxShadow: 'none' }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ color: 'rgba(255,255,255,0.6)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Nome</TableCell>
                                <TableCell sx={{ color: 'rgba(255,255,255,0.6)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>CIM / Info</TableCell>
                                <TableCell sx={{ color: 'rgba(255,255,255,0.6)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Check-in</TableCell>
                                <TableCell sx={{ color: 'rgba(255,255,255,0.6)', borderBottom: '1px solid rgba(255,255,255,0.1)' }} align="center">Ações</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {attendanceList.map((record) => {
                                // Determinar nome e identificador
                                const isVisitor = !!record.visitor_id;
                                const name = isVisitor ? record.visitor?.full_name : record.member?.full_name;
                                const info = isVisitor ? 
                                    (record.visitor?.manual_lodge_name || 'Visitante') : 
                                    (record.member?.cim || '-');
                                
                                return (
                                <TableRow key={record.id} hover sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}>
                                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {isVisitor && <Person fontSize="small" sx={{ color: '#aaa' }} titleAccess="Visitante" />}
                                            {name}
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ color: '#ccc', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        {info}
                                    </TableCell>
                                    <TableCell sx={{ color: '#ccc', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Chip 
                                                label={record.attendance_status} 
                                                color={getStatusColor(record.attendance_status) as any}
                                                size="small"
                                                variant={record.attendance_status === 'Ausente' ? 'outlined' : 'filled'}
                                            />
                                            {record.attendance_status === 'Presente' && record.check_in_method && (
                                                <Tooltip title={`Via ${record.check_in_method}`}>
                                                    <Box component="span" sx={{ color: '#aaa', display: 'flex' }}>
                                                        {getCheckInIcon(record.check_in_method)}
                                                    </Box>
                                                </Tooltip>
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }} align="center">
                                        {!isVisitor && (
                                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                                                <Tooltip title="Marcar Presente">
                                                    <IconButton 
                                                        size="small" 
                                                        color="success" 
                                                        onClick={() => handleStatusChange(record, 'Presente')}
                                                        disabled={record.attendance_status === 'Presente'}
                                                    >
                                                        <CheckCircle />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Marcar Justificado">
                                                    <IconButton 
                                                        size="small" 
                                                        color="warning" 
                                                        onClick={() => handleStatusChange(record, 'Justificado')}
                                                        disabled={record.attendance_status === 'Justificado'}
                                                    >
                                                        <AccessTime />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Marcar Ausente">
                                                    <IconButton 
                                                        size="small" 
                                                        color="error"
                                                        onClick={() => handleStatusChange(record, 'Ausente')}
                                                        disabled={record.attendance_status === 'Ausente'}
                                                    >
                                                        <Cancel />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        )}
                                        {isVisitor && (
                                            <Typography variant="caption" sx={{ color: '#666' }}>
                                                (Gestão em Visitantes)
                                            </Typography>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : (
                <Typography sx={{ color: '#aaa', fontStyle: 'italic', textAlign: 'center', py: 4 }}>
                   {selectedSessionId ? "Nenhum registro encontrado." : "Selecione uma sessão acima."}
                </Typography>
            )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ChancelerPresencas;
