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
        console.error('Falha ao buscar obediências', error);
      }
    };

    fetchObediences();
  }, []);

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Obediências
      </Typography>
      <Button component={Link} to="/dashboard/management/obediences/new" variant="contained" color="primary">
        Nova Obediência
      </Button>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Sigla</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Telefone</TableCell>
              <TableCell>Website</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {obediences.map((obedience: any) => (
              <TableRow key={obedience.id}>
                <TableCell>{obedience.name}</TableCell>
                <TableCell>{obedience.acronym}</TableCell>
                <TableCell>{obedience.type}</TableCell>
                <TableCell>{obedience.email}</TableCell>
                <TableCell>{obedience.phone}</TableCell>
                <TableCell>{obedience.website}</TableCell>
                <TableCell>
                  <Button component={Link} to={`/dashboard/management/obediences/edit/${obedience.id}`} variant="contained" color="secondary">
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