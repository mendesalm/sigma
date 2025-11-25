import React, { useEffect, useState } from 'react';
import { Button, Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton } from '@mui/material';
import { VpnKey } from '@mui/icons-material';
import api from '../../services/api';

const WebmastersManagement: React.FC = () => {
  const [webmasters, setWebmasters] = useState([]);

  useEffect(() => {
    fetchWebmasters();
  }, []);

  const fetchWebmasters = async () => {
    try {
      const response = await api.get('/webmasters');
      setWebmasters(response.data);
    } catch (error) {
      console.error('Falha ao buscar webmasters', error);
    }
  };

  const handleResetPassword = async (id: number) => {
    if (window.confirm('Tem certeza que deseja resetar a senha deste webmaster? Uma nova senha será enviada para o email cadastrado.')) {
      try {
        await api.post(`/webmasters/${id}/reset-password`);
        alert('Senha resetada com sucesso! A nova senha foi enviada para o email do usuário.');
      } catch (error) {
        console.error('Falha ao resetar a senha do webmaster', error);
        alert('Falha ao resetar a senha do webmaster.');
      }
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Gerenciamento de Webmasters
      </Typography>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Usuário</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Loja/Obediência</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {webmasters.map((webmaster: any) => (
              <TableRow key={webmaster.id}>
                <TableCell>{webmaster.username}</TableCell>
                <TableCell>{webmaster.email}</TableCell>
                <TableCell>{webmaster.is_active ? 'Ativo' : 'Inativo'}</TableCell>
                <TableCell>{webmaster.lodge?.lodge_name || webmaster.obedience?.name}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleResetPassword(webmaster.id)} color="warning">
                    <VpnKey />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default WebmastersManagement;
