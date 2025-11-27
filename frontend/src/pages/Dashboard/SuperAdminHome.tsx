import React from 'react';
import { Box, Grid, Card, CardContent, Typography, Button, useTheme } from '@mui/material';
import {
  Business as BusinessIcon,
  Gavel as GavelIcon,
  People as PeopleIcon,
  ArrowForward as ArrowForwardIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const SuperAdminHome: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [statsData, setStatsData] = React.useState({
    total_obediences: 0,
    total_lodges: 0,
    active_members: 0
  });

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/super-admins/stats');
        setStatsData(response.data);
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
      }
    };
    fetchStats();
  }, []);

  const stats = [
    { title: 'Total de Obediências', value: statsData.total_obediences, icon: <BusinessIcon fontSize="large" />, color: theme.palette.primary.main },
    { title: 'Total de Lojas', value: statsData.total_lodges, icon: <GavelIcon fontSize="large" />, color: theme.palette.secondary.light },
    { title: 'Membros Ativos', value: statsData.active_members, icon: <PeopleIcon fontSize="large" />, color: '#4caf50' },
  ];

  const quickActions = [
    { title: 'Nova Obediência', path: '/dashboard/management/obediences/new', icon: <BusinessIcon /> },
    { title: 'Nova Loja', path: '/dashboard/management/lodges/new', icon: <GavelIcon /> },
    { title: 'Novo Super Admin', path: '/dashboard/management/super-admins/new', icon: <PeopleIcon /> },
  ];

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ color: theme.palette.primary.main }}>
          Bem-vindo, Super Admin
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Visão geral do sistema e ações rápidas.
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
              <Box
                sx={{
                  position: 'absolute',
                  top: -20,
                  right: -20,
                  opacity: 0.1,
                  transform: 'rotate(15deg)',
                  color: stat.color,
                }}
              >
                {stat.icon}
              </Box>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ 
                    p: 1.5, 
                    borderRadius: 2, 
                    bgcolor: `${stat.color}22`, 
                    color: stat.color,
                    mr: 2
                  }}>
                    {stat.icon}
                  </Box>
                  <Typography variant="h6" color="text.secondary">
                    {stat.title}
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                  {stat.value}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <TrendingUpIcon sx={{ color: '#4caf50', mr: 0.5, fontSize: 16 }} />
                  <Typography variant="caption" sx={{ color: '#4caf50' }}>
                    +5% este mês
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick Actions */}
      <Typography variant="h5" gutterBottom sx={{ mb: 3, color: theme.palette.text.primary }}>
        Ações Rápidas
      </Typography>
      <Grid container spacing={3}>
        {quickActions.map((action, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => navigate(action.path)}
              sx={{
                p: 3,
                justifyContent: 'flex-start',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                bgcolor: 'rgba(255, 255, 255, 0.02)',
                '&:hover': {
                  bgcolor: 'rgba(212, 175, 55, 0.08)',
                  borderColor: theme.palette.primary.main,
                }
              }}
            >
              <Box sx={{ 
                p: 1, 
                borderRadius: '50%', 
                bgcolor: 'rgba(255, 255, 255, 0.05)', 
                mr: 2,
                display: 'flex'
              }}>
                {action.icon}
              </Box>
              <Box sx={{ textAlign: 'left', flexGrow: 1 }}>
                <Typography variant="subtitle1" color="text.primary">
                  {action.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Adicionar novo registro
                </Typography>
              </Box>
              <ArrowForwardIcon color="action" />
            </Button>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default SuperAdminHome;
