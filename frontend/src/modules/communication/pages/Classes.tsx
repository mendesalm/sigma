import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton } from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';

// Mock data for Classes
const mockClasses = [
  { id: 1, name: 'Class A', description: 'Description for Class A' },
  { id: 2, name: 'Class B', description: 'Description for Class B' },
];

const Classes: React.FC = () => {
  // In a real implementation, you would fetch this data from the API
  const classes = mockClasses;

  const handleDelete = (id: number) => {
    // In a real implementation, you would call the API to delete the class
    window.alert(`Simulating delete for class with id: ${id}`);
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Classes Management
      </Typography>
      <Button component={Link} to="/dashboard/management/classes/new" variant="contained" color="primary">
        New Class
      </Button>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {classes.map((cls) => (
              <TableRow key={cls.id}>
                <TableCell>{cls.name}</TableCell>
                <TableCell>{cls.description}</TableCell>
                <TableCell>
                  <IconButton component={Link} to={`/dashboard/management/classes/edit/${cls.id}`} color="primary">
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(cls.id)} color="secondary">
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

export default Classes;