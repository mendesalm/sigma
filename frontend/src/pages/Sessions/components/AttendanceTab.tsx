import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, 
  Select, MenuItem, FormControl, SelectChangeEvent, CircularProgress, Alert, Snackbar, 
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, Divider,
  IconButton, Tooltip
} from '@mui/material';
import { Add, Refresh, CardMembership } from '@mui/icons-material';
import { getSessionAttendance, updateManualAttendance, registerVisitorAttendance, generateCertificate } from '../../../services/api';
import { formatCPF } from '../../../utils/formatters';
import { validateCPF, validateEmail } from '../../../utils/validators';
import { useAuth } from '../../../hooks/useAuth';

interface AttendanceRecord {
  id: number;
  member_id: number | null;
  visitor_id: number | null;
  member?: {
    id: number;
    full_name: string;
  };
  visitor?: {
    id: number;
    full_name: string;
    manual_lodge_name?: string;
    manual_lodge_number?: string;
    manual_lodge_obedience?: string;
    origin_lodge_id?: number;
  };
  attendance_status: string;
}

interface AttendanceTabProps {
  sessionId: number;
}

const AttendanceTab: React.FC<AttendanceTabProps> = ({ sessionId }) => {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  
  // Visitor Dialog State
  const [openVisitorDialog, setOpenVisitorDialog] = useState(false);
  const [visitorData, setVisitorData] = useState({
    full_name: '',
    email: '',
    manual_lodge_name: '',
    manual_lodge_number: '',
    manual_lodge_obedience: '',
    cpf: ''
  });
  const [visitorLoading, setVisitorLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [autoRefresh] = useState(true);

  // Permission Logic
  const canEdit = React.useMemo(() => {
    if (!user) return false;
    if (user.user_type === 'webmaster' || user.user_type === 'super_admin') return true;
    // Check for specific roles
    // Note: active_role_name comes from the token payload
    const role = user.active_role_name;
    return role === 'Chanceler';
  }, [user]);

  const validateField = (name: string, value: string) => {
    let error = '';
    if (name === 'cpf' && value && !validateCPF(value)) {
      error = 'CPF inválido';
    }
    if (name === 'email' && value && !validateEmail(value)) {
      error = 'Email inválido';
    }
    
    setErrors((prev) => ({ ...prev, [name]: error }));
    return error === '';
  };

  const fetchAttendance = async () => {
    try {
      // setLoading(true); // Don't show loading spinner on refresh to avoid flickering
      const response = await getSessionAttendance(sessionId);
      setAttendance(response.data);
      setError(null);
    } catch (err) {
      console.error('Falha ao atualizar a lista de presença.', err);
      // Don't set global error to avoid blocking the UI on background refresh failure
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionId) {
      setLoading(true); // Initial load only
      fetchAttendance();
    }
  }, [sessionId]);

  // Auto-refresh logic
  useEffect(() => {
    let interval: any;
    if (autoRefresh && sessionId) {
      interval = setInterval(() => {
        fetchAttendance();
      }, 30000); // 30 seconds
    }
    return () => clearInterval(interval);
  }, [autoRefresh, sessionId]);

  const handleStatusChange = async (memberId: number, newStatus: string) => {
    if (!canEdit) return;
    try {
      await updateManualAttendance(sessionId, memberId, newStatus);
      setSnackbar({ open: true, message: 'Presença atualizada com sucesso!', severity: 'success' });
      // Refresh local data to show the change
      setAttendance(prevAttendance =>
        prevAttendance.map(record =>
          record.member_id === memberId ? { ...record, attendance_status: newStatus } : record
        )
      );
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: 'Falha ao atualizar a presença.', severity: 'error' });
    }
  };

  const handleGenerateCertificate = async (memberId: number) => {
    // Certificate generation might be allowed for Secretary too? 
    // The prompt says "Secretary read-only" for "participants tab".
    // Usually Secretary generates documents.
    // However, strictly following "read-only for Secretary" regarding "adding members/visitors".
    // Let's assume Secretary can still generate certificates as it's an output, not a modification of the session data itself?
    // But the prompt says "read-only". I will disable it for consistency with "read-only".
    if (!canEdit) return; 

    try {
      await generateCertificate(sessionId, memberId);
      setSnackbar({ open: true, message: 'Geração de certificado iniciada! Verifique a aba Documentos em breve.', severity: 'success' });
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: 'Erro ao solicitar certificado.', severity: 'error' });
    }
  };

  const handleVisitorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'cpf') {
      formattedValue = formatCPF(value);
    }

    validateField(name, formattedValue);
    setVisitorData({ ...visitorData, [name]: formattedValue });
  };

  const handleRegisterVisitor = async () => {
    if (!canEdit) return;
    // Validate all fields before submit
    const newErrors: { [key: string]: string } = {};
    if (visitorData.cpf && !validateCPF(visitorData.cpf)) newErrors.cpf = 'CPF inválido';
    if (visitorData.email && !validateEmail(visitorData.email)) newErrors.email = 'Email inválido';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSnackbar({ open: true, message: 'Por favor, corrija os erros no formulário.', severity: 'error' });
      return;
    }

    try {
      setVisitorLoading(true);
      await registerVisitorAttendance(sessionId, visitorData);
      setSnackbar({ open: true, message: 'Visitante registrado com sucesso!', severity: 'success' });
      setOpenVisitorDialog(false);
      setVisitorData({ full_name: '', email: '', manual_lodge_name: '', manual_lodge_number: '', manual_lodge_obedience: '', cpf: '' });
      setErrors({}); // Clear errors
      fetchAttendance(); // Refresh list
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: 'Falha ao registrar visitante.', severity: 'error' });
    } finally {
      setVisitorLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  const members = attendance.filter(r => r.member_id !== null);
  const visitors = attendance.filter(r => r.visitor_id !== null);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Membros da Loja
        </Typography>
        <Button 
            startIcon={<Refresh />} 
            onClick={fetchAttendance}
            variant="outlined"
            size="small"
            sx={{ ml: 2 }}
        >
            Atualizar Lista
        </Button>
      </Box>
      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome do Membro</TableCell>
              <TableCell sx={{ width: '200px' }}>Status da Presença</TableCell>
              <TableCell align="center" sx={{ width: '100px' }}>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {members.map((record) => (
              <TableRow key={record.id}>
                <TableCell>{record.member?.full_name}</TableCell>
                <TableCell>
                  <FormControl size="small" fullWidth disabled={!canEdit}>
                    <Select
                      value={record.attendance_status}
                      onChange={(e: SelectChangeEvent) => record.member_id && handleStatusChange(record.member_id, e.target.value)}
                    >
                      <MenuItem value="Presente">Presente</MenuItem>
                      <MenuItem value="Ausente">Ausente</MenuItem>
                      <MenuItem value="Justificado">Justificado</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell align="center">
                  <Tooltip title={canEdit ? "Gerar Certificado de Presença" : "Apenas leitura"}>
                    <span>
                      <IconButton 
                        onClick={() => record.member_id && handleGenerateCertificate(record.member_id)}
                        disabled={!canEdit || record.attendance_status !== 'Presente'}
                        color="primary"
                      >
                        <CardMembership />
                      </IconButton>
                    </span>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {members.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} align="center">Nenhum membro listado.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Divider sx={{ my: 4 }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Visitantes
        </Typography>
        {canEdit && (
          <Button 
            variant="contained" 
            startIcon={<Add />} 
            onClick={() => setOpenVisitorDialog(true)}
          >
            Registrar Visitante
          </Button>
        )}
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome do Visitante</TableCell>
              <TableCell>Loja de Origem</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visitors.map((record) => (
              <TableRow key={record.id}>
                <TableCell>{record.visitor?.full_name}</TableCell>
                <TableCell>
                  {record.visitor?.manual_lodge_name 
                    ? `${record.visitor.manual_lodge_name} N. ${record.visitor.manual_lodge_number} (${record.visitor.manual_lodge_obedience})`
                    : record.visitor?.origin_lodge_id ? 'Loja do Sistema' : '-'}
                </TableCell>
                <TableCell>{record.attendance_status}</TableCell>
              </TableRow>
            ))}
            {visitors.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} align="center">Nenhum visitante registrado.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Visitor Dialog */}
      <Dialog open={openVisitorDialog} onClose={() => setOpenVisitorDialog(false)}>
        <DialogTitle>Registrar Visitante</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="full_name"
                label="Nome Completo"
                fullWidth
                required
                value={visitorData.full_name}
                onChange={handleVisitorChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="manual_lodge_name"
                label="Nome da Loja"
                fullWidth
                value={visitorData.manual_lodge_name}
                onChange={handleVisitorChange}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                name="manual_lodge_number"
                label="Número"
                fullWidth
                value={visitorData.manual_lodge_number}
                onChange={handleVisitorChange}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                name="manual_lodge_obedience"
                label="Potência"
                fullWidth
                value={visitorData.manual_lodge_obedience}
                onChange={handleVisitorChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="email"
                label="Email (Opcional)"
                fullWidth
                type="email"
                value={visitorData.email}
                onChange={handleVisitorChange}
                error={!!errors.email}
                helperText={errors.email}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="cpf"
                label="CPF (Opcional)"
                fullWidth
                value={visitorData.cpf}
                onChange={handleVisitorChange}
                error={!!errors.cpf}
                helperText={errors.cpf}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenVisitorDialog(false)}>Cancelar</Button>
          <Button 
            onClick={handleRegisterVisitor} 
            variant="contained" 
            disabled={visitorLoading || !visitorData.full_name}
          >
            {visitorLoading ? <CircularProgress size={24} /> : 'Registrar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AttendanceTab;
