import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton } from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import api from '../../services/api';
import { MemberResponse } from '../../types';

const Members = () => {
  const [members, setMembers] = useState<MemberResponse[]>([]);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await api.get('/members');
        setMembers(response.data);
      } catch (error) {
        console.error('Failed to fetch members', error);
      }
    };

    fetchMembers();
  }, []);

  const handleDelete = async (memberId: number) => {
    if (window.confirm('Are you sure you want to delete this member association?')) {
      try {
        await api.delete(`/members/${memberId}`);
        setMembers(members.filter((member) => member.id !== memberId));
      } catch (error) {
        console.error('Failed to delete member association', error);
      }
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Members
      </Typography>
      <Button component={Link} to="/dashboard/management/members/new" variant="contained" color="primary">
        New Member
      </Button>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Degree</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell>{member.full_name}</TableCell>
                <TableCell>{member.email}</TableCell>
                <TableCell>{member.degree}</TableCell>
                <TableCell>{member.status}</TableCell>
                <TableCell>
                  <IconButton component={Link} to={`/dashboard/management/members/edit/${member.id}`} color="primary">
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(member.id)} color="secondary">
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

export default Members;