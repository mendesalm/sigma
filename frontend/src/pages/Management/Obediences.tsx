import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import api from '../../services/api';

const Obediences = () => {
  const [obediences, setObediences] = useState([]);

  useEffect(() => {
    const fetchObediences = async () => {
      try {
        const response = await api.get('/obediences');
        setObediences(response.data);
      } catch (error) {
        console.error('Failed to fetch obediences', error);
      }
    };

    fetchObediences();
  }, []);

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Obediências
      </Typography>
      <Button component={Link} to="/dashboard/obediences/new" variant="contained" color="primary">
        Nova Obediência
      </Button>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Grande Oriente</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {obediences.map((obedience: any) => (
              <TableRow key={obedience.id}>
                <TableCell>{obedience.name}</TableCell>
                <TableCell>{obedience.grand_orient}</TableCell>
                <TableCell>
                  <Button component={Link} to={`/dashboard/obediences/edit/${obedience.id}`} variant="contained" color="secondary">
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

export default Obediences;