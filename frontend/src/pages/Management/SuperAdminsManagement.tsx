import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton } from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';

// Mock data for SuperAdmins
const mockSuperAdmins = [
  { id: 1, username: 'superadmin1', email: 'superadmin1@example.com', is_active: true },
  { id: 2, username: 'superadmin2', email: 'superadmin2@example.com', is_active: false },
];

const SuperAdminsManagement: React.FC = () => {
  // In a real implementation, you would fetch this data from the API
  const superAdmins = mockSuperAdmins;

  const handleDelete = (id: number) => {
    // In a real implementation, you would call the API to delete the super admin
    window.alert(`Simulating delete for super admin with id: ${id}`);
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Super Admins Management
      </Typography>
      <Button component={Link} to="/dashboard/management/super-admins/new" variant="contained" color="primary">
        New Super Admin
      </Button>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {superAdmins.map((admin) => (
              <TableRow key={admin.id}>
                <TableCell>{admin.username}</TableCell>
                <TableCell>{admin.email}</TableCell>
                <TableCell>{admin.is_active ? 'Active' : 'Inactive'}</TableCell>
                <TableCell>
                  <IconButton component={Link} to={`/dashboard/management/super-admins/edit/${admin.id}`} color="primary">
                    <Edit />
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