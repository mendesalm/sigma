import React from 'react';
import { Box, Typography, Grid, Paper, Card, CardContent } from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import WarningIcon from '@mui/icons-material/Warning';

const DashboardFinanceiro: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard Financeiro
      </Typography>

      <Grid container spacing={3}>
        {/* Resumo Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.main', color: 'success.contrastText' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUpIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Receitas (Mês)</Typography>
              </Box>
              <Typography variant="h4">R$ 5.430,00</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
           <Card sx={{ bgcolor: 'error.main', color: 'error.contrastText' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingDownIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Despesas (Mês)</Typography>
              </Box>
              <Typography variant="h4">R$ 2.100,00</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'info.main', color: 'info.contrastText' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AttachMoneyIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Saldo Atual</Typography>
              </Box>
              <Typography variant="h4">R$ 15.200,00</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'warning.main', color: 'warning.contrastText' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <WarningIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Inadimplência</Typography>
              </Box>
              <Typography variant="h4">12%</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Gráficos Mockados */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <Typography color="textSecondary">Gráfico de Receitas vs Despesas (A Implementar)</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <Typography color="textSecondary">Despesas por Categoria</Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardFinanceiro;
