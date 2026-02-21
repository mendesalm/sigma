import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Card, CardContent
} from '@mui/material';
import { libraryService, Loan } from '../../services/libraryService';
import { useSnackbar } from 'notistack';

export const LibraryLoans: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [activeLoans, setActiveLoans] = useState<Loan[]>([]);

  const fetchLoans = async () => {
    try {
      const res = await libraryService.listActiveLoans();
      setActiveLoans(res.data);
    } catch (err) {
      console.error(err);
      enqueueSnackbar('Erro ao carregar empréstimos', { variant: 'error' });
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const handleReturn = async (loanId: number) => {
    try {
      await libraryService.returnLoan(loanId);
      enqueueSnackbar('Devolução registrada com sucesso!', { variant: 'success' });
      fetchLoans();
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.detail || 'Erro na devolução', { variant: 'error' });
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Gestão de Empréstimos</Typography>
      
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6">Registrar Empréstimo Manual</Typography>
          <Typography variant="body2" color="textSecondary">
            *Emissão rápida de empréstimo. Na visão do leitor há uma galeria completa solicitá-lo.
          </Typography>
        </CardContent>
      </Card>

      <Typography variant="h6" gutterBottom>Empréstimos Ativos</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Livro</TableCell>
              <TableCell>Membro</TableCell>
              <TableCell>Tombo</TableCell>
              <TableCell>Data Empréstimo</TableCell>
              <TableCell>Prazo (Vencimento)</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {activeLoans.map(loan => (
              <TableRow key={loan.id}>
                <TableCell>{loan.item?.book?.title}</TableCell>
                <TableCell>{loan.member?.full_name}</TableCell>
                <TableCell>{loan.item?.inventory_code}</TableCell>
                <TableCell>{new Date(loan.loan_date).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(loan.due_date).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Chip 
                    label={loan.status} 
                    color={loan.status === 'Atrasado' ? 'error' : 'primary'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Button variant="outlined" size="small" onClick={() => handleReturn(loan.id)}>
                    Devolver
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {activeLoans.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">Nenhum empréstimo ativo.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default LibraryLoans;
