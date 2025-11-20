import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Container, TextField, Typography, Select, MenuItem, InputLabel, FormControl } from '@mui/material';
import api from '../../services/api';

interface Role {
  id: number;
  name: string;
}

const RoleHistoryForm: React.FC = () => {
  const [formState, setFormState] = useState({
    role_id: '',
    start_date: '',
    end_date: '',
  });
  const [roles, setRoles] = useState<Role[]>([]);
  const navigate = useNavigate();
  const { memberId, id } = useParams<{ memberId: string, id: string }>();

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await api.get('/roles');
        setRoles(response.data);
      } catch (error) {
        console.error('Failed to fetch roles', error);
      }
    };
    fetchRoles();

    if (id) {
      // In a real implementation, you would fetch this data from the API
      console.log(`Fetching role history with id: ${id} for member: ${memberId}`);
    }
  }, [id, memberId]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>)=> {
    const { name, value } = event.target as HTMLInputElement;
    setFormState((prevState) => ({
      ...prevState,
      [name as string]: value,
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // In a real implementation, you would call the API to save the role history
    window.alert(`Simulating save for role history:\n${JSON.stringify(formState, null, 2)}`);
    navigate(`/dashboard/management/members/edit/${memberId}`); // Go back to the member edit page
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        {id ? 'Edit Role History' : 'New Role History'}
      </Typography>
      <form onSubmit={handleSubmit}>
        <FormControl fullWidth margin="normal">
          <InputLabel>Role</InputLabel>
          <Select
            name="role_id"
            value={formState.role_id}
            onChange={handleChange}
          >
            {roles.map((role) => (
              <MenuItem key={role.id} value={role.id}>
                {role.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          name="start_date"
          label="Start Date"
          type="date"
          value={formState.start_date}
          onChange={handleChange}
          fullWidth
          margin="normal"
          InputLabelProps={{
            shrink: true,
          }}
        />
        <TextField
          name="end_date"
          label="End Date"
          type="date"
          value={formState.end_date}
          onChange={handleChange}
          fullWidth
          margin="normal"
          InputLabelProps={{
            shrink: true,
          }}
        />
        <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
          Save
        </Button>
      </form>
    </Container>
  );
};

export default RoleHistoryForm;