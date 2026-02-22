import React, { useState } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Button, Chip, TextField, MenuItem 
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

const mockTransactions = [
  { id: 1, description: 'Mensalidade - João Silva', date: '2026-02-10', amount: 150.00, type: 'RECEITA', status: 'PAGO' },
  { id: 2, count: 'Conta de Energia', date: '2026-02-15', amount: 350.50, type: 'DESPESA', status: 'PENDENTE' },
  { id: 3, description: 'Mensalidade - Pedro Alves', date: '2026-01-10', amount: 150.00, type: 'RECEITA', status: 'ATRASADO' },
];

const LancamentosList: React.FC = () => {
  const [filterType, setFilterType] = useState('ALL');

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Lançamentos Financeiros
        </Typography>
        <Button variant="contained" color="primary" startIcon={<AddIcon />}>
          Novo Lançamento
        </Button>
      </Box>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2 }}>
        <TextField 
          select 
          label="Tipo de Transação" 
          value={filterType} 
          onChange={(e) => setFilterType(e.target.value)}
          size="small"
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="ALL">Todos</MenuItem>
          <MenuItem value="RECEITA">Receitas</MenuItem>
          <MenuItem value="DESPESA">Despesas</MenuItem>
        </TextField>
        <TextField 
          type="date" 
          label="Data Inicial" 
          InputLabelProps={{ shrink: true }}
          size="small"
        />
        <TextField 
          type="date" 
          label="Data Final" 
          InputLabelProps={{ shrink: true }}
          size="small"
        />
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Data Vencimento</TableCell>
              <TableCell>Descrição</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell align="right">Valor</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mockTransactions.map((txn) => (
              <TableRow key={txn.id}>
                <TableCell>{txn.date}</TableCell>
                <TableCell>{txn.description || txn.count}</TableCell>
                <TableCell>
                  <Chip 
                    label={txn.type} 
                    size="small"
                    color={txn.type === 'RECEITA' ? 'success' : 'error'} 
                    variant="outlined" 
                  />
                </TableCell>
                <TableCell align="right">
                  R$ {txn.amount.toFixed(2)}
                </TableCell>
                <TableCell align="center">
                  <Chip 
                    label={txn.status} 
                    size="small"
                    color={
                      txn.status === 'PAGO' ? 'success' : 
                      txn.status === 'ATRASADO' ? 'error' : 'warning'
                    } 
                  />
                </TableCell>
                <TableCell align="center">
                  <Button size="small">Detalhes</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default LancamentosList;
