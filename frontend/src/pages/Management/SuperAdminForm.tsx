import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Container, TextField, Typography, Switch, FormControlLabel } from '@mui/material';

// Mock data for a single SuperAdmin
const mockSuperAdmin = {
  id: 1,
  username: 'superadmin1',
  email: 'superadmin1@example.com',
  is_active: true,
};

const SuperAdminForm: React.FC = () => {
  const [formState, setFormState] = useState({
    username: '',
    email: '',
    password: '',
    is_active: true,
  });
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    if (id) {
      // In a real implementation, you would fetch this data from the API
      setFormState({ ...mockSuperAdmin, password: '' });
    }
  }, [id]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = event.target;
    setFormState((prevState) => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // In a real implementation, you would call the API to save the super admin
    window.alert(`Simulating save for super admin:\n${JSON.stringify(formState, null, 2)}`);
    navigate('/dashboard/management/super-admins');
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        {id ? 'Edit Super Admin' : 'New Super Admin'}
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          name="username"
          label="Username"
          value={formState.username}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          name="email"
          label="Email"
          type="email"
          value={formState.email}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          name="password"
          label="Password"
          type="password"
          value={formState.password}
          onChange={handleChange}
          fullWidth
          margin="normal"
          helperText={id ? 'Leave blank to keep the same password' : ''}
        />
        <FormControlLabel
          control={<Switch name="is_active" checked={formState.is_active} onChange={handleChange} />} 
          label="Active"
        />
        <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
          Save
        </Button>
      </form>
    </Container>
  );
};

export default SuperAdminForm;