import React, { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Button, Grid, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip, Select, MenuItem, InputLabel, FormControl
} from '@mui/material';
import { libraryService, Book, LibraryItem } from '../../services/libraryService';
import { useSnackbar } from 'notistack';

export const LibraryManage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [isbnSearch, setIsbnSearch] = useState('');
  const [fetching, setFetching] = useState(false);
  const [bookForm, setBookForm] = useState<Partial<Book> | null>(null);
  const [itemDialog, setItemDialog] = useState(false);
  const [inventory, setInventory] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // New Item State
  const [itemCondition, setItemCondition] = useState('Bom');

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await libraryService.listItems();
      setInventory(res.data);
    } catch (err) {
      console.error(err);
      enqueueSnackbar('Erro ao carregar acervo', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return <Typography>Carregando acervo...</Typography>;
  }

  const handleSearchIsbn = async () => {
    if (!isbnSearch) return;
    setFetching(true);
    try {
      const res = await libraryService.searchBookByIsbn(isbnSearch);
      setBookForm(res.data);
      enqueueSnackbar('Livro encontrado!', { variant: 'success' });
    } catch {
      enqueueSnackbar('Livro não encontrado. Preencha manualmente.', { variant: 'warning' });
      setBookForm({ isbn: isbnSearch, title: '', author: '', required_degree: 1 });
    } finally {
      setFetching(false);
    }
  };

  const handleSaveBookAndItem = async () => {
    if (!bookForm || !bookForm.title || !bookForm.author) {
      enqueueSnackbar('Título e Autor são obrigatórios', { variant: 'error' });
      return;
    }

    try {
      // 1. Criar/Garantir Livro Global
      const bookRes = await libraryService.createBook(bookForm);
      const newBook = bookRes.data;

      // 2. Criar Exemplar Local
      await libraryService.createItem({
        book_id: newBook.id!,
        condition: itemCondition,
        inventory_code: `INV-${new Date().getTime().toString().slice(-6)}`
      });

      enqueueSnackbar('Exemplar cadastrado com sucesso!', { variant: 'success' });
      setBookForm(null);
      setItemDialog(false);
      fetchInventory();
      setIsbnSearch('');
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Erro ao cadastrar exemplar';
      enqueueSnackbar(errorMsg, { variant: 'error' });
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Acervo da Biblioteca</Typography>
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6">Novo Exemplar (Busca por ISBN)</Typography>
          <Box display="flex" gap={2} mt={2}>
            <TextField
              label="ISBN"
              variant="outlined"
              size="small"
              value={isbnSearch}
              onChange={e => setIsbnSearch(e.target.value)}
            />
            <Button variant="contained" onClick={handleSearchIsbn} disabled={fetching}>
              Buscar
            </Button>
            <Button variant="outlined" onClick={() => {
              setBookForm({ title: '', author: '', required_degree: 1 });
            }}>
              Cadastro Manual
            </Button>
          </Box>
        </CardContent>
      </Card>
      {bookForm && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Dados do Livro</Typography>
            <Grid container spacing={2}>
              <Grid
                size={{
                  xs: 12,
                  sm: 6
                }}>
                <TextField fullWidth label="Título" value={bookForm.title || ''} onChange={e => setBookForm({ ...bookForm, title: e.target.value })} />
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  sm: 6
                }}>
                <TextField fullWidth label="Autor" value={bookForm.author || ''} onChange={e => setBookForm({ ...bookForm, author: e.target.value })} />
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  sm: 4
                }}>
                <TextField fullWidth label="Editora" value={bookForm.publisher || ''} onChange={e => setBookForm({ ...bookForm, publisher: e.target.value })} />
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  sm: 4
                }}>
                <TextField fullWidth type="number" label="Ano" value={bookForm.publish_year || ''} onChange={e => setBookForm({ ...bookForm, publish_year: Number(e.target.value) })} />
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  sm: 4
                }}>
                <FormControl fullWidth>
                  <InputLabel>Grau Exigido</InputLabel>
                  <Select value={bookForm.required_degree || 1} onChange={e => setBookForm({ ...bookForm, required_degree: Number(e.target.value) })} label="Grau Exigido">
                    <MenuItem value={1}>1 - Aprendiz</MenuItem>
                    <MenuItem value={2}>2 - Companheiro</MenuItem>
                    <MenuItem value={3}>3 - Mestre</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <Box mt={3} display="flex" justifyContent="flex-end" gap={2}>
              <Button onClick={() => setBookForm(null)}>Cancelar</Button>
              <Button variant="contained" color="primary" onClick={() => setItemDialog(true)}>Confirmar e Adicionar Exemplar</Button>
            </Box>
          </CardContent>
        </Card>
      )}
      {/* Tabela de Acervo */}
      <Typography variant="h6" gutterBottom>Inventário</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tombo</TableCell>
              <TableCell>Título</TableCell>
              <TableCell>Autor</TableCell>
              <TableCell>Grau Exigido</TableCell>
              <TableCell>Condição</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {inventory.map(item => (
              <TableRow key={item.id}>
                <TableCell>{item.inventory_code}</TableCell>
                <TableCell>{item.book?.title}</TableCell>
                <TableCell>{item.book?.author}</TableCell>
                <TableCell>{item.book?.required_degree === 1 ? 'Aprendiz' : item.book?.required_degree === 2 ? 'Companheiro' : 'Mestre'}</TableCell>
                <TableCell>{item.condition}</TableCell>
                <TableCell>
                  <Chip
                    label={item.status}
                    color={item.status === 'Disponível' ? 'success' : item.status === 'Emprestado' ? 'warning' : 'default'}
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {/* Dialog para Exemplar */}
      <Dialog open={itemDialog} onClose={() => setItemDialog(false)}>
        <DialogTitle>Dados do Exemplar Local</DialogTitle>
        <DialogContent>
          <Box mt={2}>
            <FormControl fullWidth>
              <InputLabel>Condição Física</InputLabel>
              <Select value={itemCondition} onChange={e => setItemCondition(e.target.value)} label="Condição Física">
                <MenuItem value="Novo">Novo</MenuItem>
                <MenuItem value="Bom">Bom</MenuItem>
                <MenuItem value="Regular">Regular</MenuItem>
                <MenuItem value="Ruim">Ruim</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setItemDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveBookAndItem}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LibraryManage;
