import React from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Chip } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ReceiptIcon from '@mui/icons-material/Receipt';

const mockExtrato = [
  { id: 1, description: 'Mensalidade Fev/2026', due_date: '2026-02-10', amount: 150.00, status: 'PENDENTE' },
  { id: 2, description: 'Mensalidade Jan/2026', due_date: '2026-01-10', amount: 150.00, status: 'PAGO' },
];

const MeuExtrato: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Meu Extrato Financeiro
      </Typography>
      
      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        Acompanhe seus débitos e contribuições.
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Vencimento</TableCell>
              <TableCell>Descrição</TableCell>
              <TableCell align="right">Valor (R$)</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mockExtrato.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.due_date}</TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell align="right">{item.amount.toFixed(2)}</TableCell>
                <TableCell align="center">
                  <Chip 
                    label={item.status} 
                    size="small"
                    color={item.status === 'PAGO' ? 'success' : 'warning'} 
                  />
                </TableCell>
                <TableCell align="center">
                  {item.status === 'PENDENTE' ? (
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Button size="small" variant="outlined" startIcon={<ContentCopyIcon />}>
                        PIX
                      </Button>
                      <Button size="small" variant="contained" startIcon={<ReceiptIcon />}>
                        Boleto
                      </Button>
                    </Box>
                  ) : (
                    <Button size="small">Recibo</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default MeuExtrato;
