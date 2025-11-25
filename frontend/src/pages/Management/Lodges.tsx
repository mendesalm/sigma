import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import api from '../../services/api';

const Lodges = () => {
  const [lodges, setLodges] = useState([]);

  useEffect(() => {
    const fetchLodges = async () => {
      try {
        const response = await api.get('/lodges');
        setLodges(response.data);
      } catch (error) {
        console.error('Falha ao buscar lojas', error);
      }
    };

    fetchLodges();
  }, []);

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Lojas
      </Typography>
      <Button component={Link} to="/dashboard/management/lodges/new" variant="contained" color="primary">
        Nova Loja
      </Button>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome da Loja</TableCell>
              <TableCell>Número</TableCell>
              <TableCell>Rito</TableCell>
              <TableCell>Obediência</TableCell>
              <TableCell>Cidade</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {lodges.map((lodge: any) => (
              <TableRow key={lodge.id}>
                <TableCell>{lodge.lodge_name}</TableCell>
                <TableCell>{lodge.lodge_number}</TableCell>
                <TableCell>{lodge.rite}</TableCell>
                <TableCell>{lodge.obedience?.name}</TableCell>
                <TableCell>{lodge.city}</TableCell>
                <TableCell>{lodge.state}</TableCell>
                <TableCell>
                  <Button component={Link} to={`/dashboard/management/lodges/edit/${lodge.id}`} variant="contained" color="secondary">
                    Editar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default Lodges;
