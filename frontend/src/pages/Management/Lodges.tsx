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
        console.error('Failed to fetch lodges', error);
      }
    };

    fetchLodges();
  }, []);

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Lojas
      </Typography>
      <Button component={Link} to="/dashboard/lodges/new" variant="contained" color="primary">
        Nova Loja
      </Button>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Número</TableCell>
              <TableCell>Obediência</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {lodges.map((lodge: any) => (
              <TableRow key={lodge.id}>
                <TableCell>{lodge.name}</TableCell>
                <TableCell>{lodge.number}</TableCell>
                <TableCell>{lodge.obedience?.name}</TableCell>
                <TableCell>
                  <Button component={Link} to={`/dashboard/lodges/edit/${lodge.id}`} variant="contained" color="secondary">
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
