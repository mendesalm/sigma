import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton } from '@mui/material';
import { Edit, Delete, VpnKey } from '@mui/icons-material';
import api from '../../services/api';

const SuperAdminsManagement: React.FC = () => {
  const [superAdmins, setSuperAdmins] = useState([]);

  useEffect(() => {
    fetchSuperAdmins();
  }, []);

  const fetchSuperAdmins = async () => {
    try {
      const response = await api.get('/super-admins');
      console.log(response.data);
      setSuperAdmins(response.data);
    } catch (error) {
      console.error('Falha ao buscar super admins', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja remover este super admin?')) {
      try {
        await api.delete(`/super-admins/${id}`);
        fetchSuperAdmins();
      } catch (error) {
        console.error('Falha ao remover super admin', error);
        alert('Falha ao remover super admin.');
      }
    }
  };

  const handleResetPassword = async (id: number) => {
    if (window.confirm('Tem certeza que deseja resetar a senha deste super admin? Uma nova senha será enviada para o email cadastrado.')) {
      try {
        await api.post(`/super-admins/${id}/reset-password`);
        alert('Senha resetada com sucesso! A nova senha foi enviada para o email do usuário.');
      } catch (error) {
        console.error('Falha ao resetar a senha do super admin', error);
        alert('Falha ao resetar a senha do super admin.');
      }
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Gerenciamento de Super Admins
      </Typography>
      <Button component={Link} to="/dashboard/management/super-admins/new" variant="contained" color="primary">
        Novo Super Admin
      </Button>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Usuário</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {superAdmins.map((admin: any) => (
              <TableRow key={admin.id}>
                <TableCell>{admin.username}</TableCell>
                <TableCell>{admin.email}</TableCell>
                <TableCell>{admin.is_active ? 'Ativo' : 'Inativo'}</TableCell>
                <TableCell>
                  <IconButton component={Link} to={`/dashboard/management/super-admins/edit/${admin.id}`} color="primary">
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleResetPassword(admin.id)} color="warning">
                    <VpnKey />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(admin.id)} color="secondary">
                    <Delete />
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

export default SuperAdminsManagement;