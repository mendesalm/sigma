import React, { useState, useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Select, MenuItem, FormControl, SelectChangeEvent, CircularProgress, Alert, Snackbar } from '@mui/material';
import { getSessionAttendance, updateManualAttendance } from '../../../services/api';

interface AttendanceRecord {
  id: number;
  member_id: number;
  member: {
    id: number;
    full_name: string;
  };
  attendance_status: string;
}

interface AttendanceTabProps {
  sessionId: number;
}

const AttendanceTab: React.FC<AttendanceTabProps> = ({ sessionId }) => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await getSessionAttendance(sessionId);
      // Assuming the API returns an array of objects with member details nested
      // The backend should be adjusted to return member info along with attendance
      setAttendance(response.data);
      setError(null);
    } catch (err) {
      setError('Falha ao carregar a lista de presença.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionId) {
      fetchAttendance();
    }
  }, [sessionId]);

  const handleStatusChange = async (memberId: number, newStatus: string) => {
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

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Controle de Presença
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome do Membro</TableCell>
              <TableCell sx={{ width: '200px' }}>Status da Presença</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {attendance.map((record) => (
              <TableRow key={record.id}>
                <TableCell>{record.member.full_name}</TableCell>
                <TableCell>
                  <FormControl size="small" fullWidth>
                    <Select
                      value={record.attendance_status}
                      onChange={(e: SelectChangeEvent) => handleStatusChange(record.member_id, e.target.value)}
                    >
                      <MenuItem value="Presente">Presente</MenuItem>
                      <MenuItem value="Ausente">Ausente</MenuItem>
                      <MenuItem value="Justificado">Justificado</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
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
