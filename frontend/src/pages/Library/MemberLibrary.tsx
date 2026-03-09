import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, CardMedia, Button, Chip, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper
} from '@mui/material';
import { libraryService, LibraryItem, Waitlist, Loan } from '../../services/libraryService';
import { useSnackbar } from 'notistack';

export const MemberLibrary: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [myLoans, setMyLoans] = useState<Loan[]>([]);
  const [myWaitlists, setMyWaitlists] = useState<Waitlist[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLibraryData = async () => {
    setLoading(true);
    try {
      const [itemsRes, loansRes, waitlistsRes] = await Promise.all([
        libraryService.listItems(),
        libraryService.listMyLoans(),
        libraryService.listMyWaitlists()
      ]);
      setItems(itemsRes.data);
      setMyLoans(loansRes.data);
      setMyWaitlists(waitlistsRes.data);
    } catch (err) {
      console.error(err);
      enqueueSnackbar('Erro ao carregar dados da biblioteca', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibraryData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleWaitlist = async (bookId: number | undefined) => {
    if (!bookId) return;
    try {
      await libraryService.enterWaitlist({ book_id: bookId });
      enqueueSnackbar('Você entrou na Fila de Espera!', { variant: 'success' });
      fetchLibraryData();
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.detail || 'Erro ao entrar na fila', { variant: 'error' });
    }
  };

  if (loading) {
    return <Typography>Carregando biblioteca...</Typography>;
  }

  // Agrupar itens por livro para formar o catálogo
  const catalogMap = new Map<number, { book: any; items: LibraryItem[] }>();
  items.forEach(item => {
    if (item.book && item.book.id) {
      if (!catalogMap.has(item.book.id)) {
        catalogMap.set(item.book.id, { book: item.book, items: [] });
      }
      catalogMap.get(item.book.id)!.items.push(item);
    }
  });

  const catalog = Array.from(catalogMap.values());

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Biblioteca da Loja</Typography>
      {/* Meus Empréstimos */}
      {myLoans.length > 0 && (
        <Box mb={4}>
          <Typography variant="h6" gutterBottom>Meus Empréstimos Ativos</Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Livro</TableCell>
                  <TableCell>Tombo</TableCell>
                  <TableCell>Empréstimo</TableCell>
                  <TableCell>Vencimento</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {myLoans.map(loan => (
                  <TableRow key={loan.id}>
                    <TableCell>{loan.item?.book?.title}</TableCell>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
      {/* Minha Fila de Espera */}
      {myWaitlists.length > 0 && (
        <Box mb={4}>
          <Typography variant="h6" gutterBottom>Minha Fila de Espera</Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Livro</TableCell>
                  <TableCell>Data Solicitação</TableCell>
                  <TableCell>Aviso Recebido</TableCell>
                  <TableCell>Prazo Retirada</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {myWaitlists.map(w => (
                  <TableRow key={w.id}>
                    <TableCell>{w.book?.title}</TableCell>
                    <TableCell>{new Date(w.request_date).toLocaleDateString()}</TableCell>
                    <TableCell>{w.notification_date ? new Date(w.notification_date).toLocaleDateString() : 'Ainda não'}</TableCell>
                    <TableCell>{w.expiration_date ? new Date(w.expiration_date).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={w.status}
                        color={w.status === 'Avisado' ? 'warning' : 'default'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
      {/* Catálogo de Livros */}
      <Typography variant="h6" gutterBottom>Catálogo ({catalog.length} Obras)</Typography>
      <Grid container spacing={3}>
        {catalog.map((entry) => {
          const availableItems = entry.items.filter(i => i.status === 'Disponível');
          const hasAvailable = availableItems.length > 0;
          const grauLabel = entry.book.required_degree === 1 ? 'Aprendiz' : entry.book.required_degree === 2 ? 'Companheiro' : 'Mestre';

          return (
            <Grid
              key={entry.book.id}
              size={{
                xs: 12,
                sm: 6,
                md: 4,
                lg: 3
              }}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={entry.book.cover_url || 'https://via.placeholder.com/150'}
                  alt={entry.book.title}
                  sx={{ objectFit: 'contain', p: 1 }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold" noWrap title={entry.book.title}>
                    {entry.book.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {entry.book.author}
                  </Typography>

                  <Box mt={1} mb={2} display="flex" gap={1} flexWrap="wrap">
                    <Chip label={`Grau: ${grauLabel}`} size="small" color="primary" />
                    {hasAvailable ? (
                      <Chip label={`${availableItems.length} Disponível(is)`} size="small" color="success" />
                    ) : (
                      <Chip label={`Esgotado`} size="small" color="error" />
                    )}
                  </Box>

                  <Box mt="auto">
                    {!hasAvailable ? (
                      <Button variant="outlined" fullWidth onClick={() => handleWaitlist(entry.book.id)} color="warning">
                        Entrar na Fila
                      </Button>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Retire seu empréstimo pessoalmente com o Secretário ou Bibliotecário.
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
      {catalog.length === 0 && (
        <Typography variant="body1" color="text.secondary">A biblioteca desta loja ainda não possui livros catalogados.</Typography>
      )}
    </Box>
  );
};

export default MemberLibrary;
