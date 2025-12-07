import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  CircularProgress, 
  Alert,
  LinearProgress
} from '@mui/material';
import { getLodgeAttendanceStats } from '../../../services/api';
import { People, EventAvailable } from '@mui/icons-material';

interface MemberStat {
  member_id: number;
  member_name: string;
  total_sessions: number;
  present_sessions: number;
  attendance_rate: number;
}

interface StatsData {
  total_sessions: number;
  average_attendance: number;
  member_stats: MemberStat[];
}

const AttendanceStats: React.FC = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await getLodgeAttendanceStats(12); // Default 12 months
        setStats(response.data);
      } catch (err) {
        console.error("Failed to fetch attendance stats", err);
        setError("Falha ao carregar estatísticas de presença.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!stats) return <Typography>Sem dados disponíveis.</Typography>;

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h5" gutterBottom>
        Estatísticas de Presença (Últimos 12 Meses)
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <EventAvailable fontSize="large" color="primary" sx={{ mr: 2 }} />
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Total de Sessões Realizadas
                </Typography>
                <Typography variant="h4">
                  {stats.total_sessions}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <People fontSize="large" color="secondary" sx={{ mr: 2 }} />
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Média de Presença por Sessão
                </Typography>
                <Typography variant="h4">
                  {stats.average_attendance}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        Frequência por Membro
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Membro</TableCell>
              <TableCell align="center">Presenças</TableCell>
              <TableCell align="center">Total Sessões</TableCell>
              <TableCell align="center">Frequência (%)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stats.member_stats.map((member) => (
              <TableRow key={member.member_id}>
                <TableCell>{member.member_name}</TableCell>
                <TableCell align="center">{member.present_sessions}</TableCell>
                <TableCell align="center">{member.total_sessions}</TableCell>
                <TableCell align="center" sx={{ width: '30%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: '100%', mr: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={member.attendance_rate} 
                        color={member.attendance_rate >= 75 ? "success" : member.attendance_rate >= 50 ? "warning" : "error"}
                      />
                    </Box>
                    <Box sx={{ minWidth: 35 }}>
                      <Typography variant="body2" color="textSecondary">{`${Math.round(member.attendance_rate)}%`}</Typography>
                    </Box>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {stats.member_stats.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">Nenhum dado de membro encontrado.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AttendanceStats;
