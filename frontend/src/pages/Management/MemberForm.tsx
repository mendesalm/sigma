import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Container, TextField, Typography, Select, MenuItem, FormControl, InputLabel, Grid } from '@mui/material';
import api from '../../services/api';
import { MemberResponse, DegreeEnum, RegistrationStatusEnum } from '../../types';

interface Role {
  id: number;
  name: string;
}

const MemberForm: React.FC = () => {
  const [formState, setFormState] = useState<any>({
    full_name: '',
    email: '',
    cpf: '',
    identity_document: '',
    birth_date: '',
    marriage_date: '',
    street_address: '',
    street_number: '',
    neighborhood: '',
    city: '',
    zip_code: '',
    phone: '',
    place_of_birth: '',
    nationality: '',
    religion: '',
    fathers_name: '',
    mothers_name: '',
    education_level: '',
    occupation: '',
    workplace: '',
    profile_picture_path: '',
    cim: '',
    status: 'Active',
    degree: DegreeEnum.APPRENTICE,
    initiation_date: '',
    elevation_date: '',
    exaltation_date: '',
    affiliation_date: '',
    regularization_date: '',
    philosophical_degree: '',
    registration_status: RegistrationStatusEnum.PENDING,
    password: '',
    lodge_id: '', // Assuming you get this from context or a selector
    role_id: '',
  });
  const [roles, setRoles] = useState<Role[]>([]);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

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
      const fetchMember = async () => {
        try {
          const response = await api.get<MemberResponse>(`/members/${id}`);
          setFormState(response.data);
        } catch (error) {
          console.error('Failed to fetch member', error);
        }
      };
      fetchMember();
    }
  }, [id]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = event.target;
    setFormState((prevState: any) => ({
      ...prevState,
      [name as string]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const memberData = { ...formState };

    try {
      if (id) {
        await api.put(`/members/${id}`, memberData);
      } else {
        await api.post('/members', memberData);
      }
      navigate('/dashboard/management/members');
    } catch (error) {
      console.error('Failed to save member', error);
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        {id ? 'Edit Member' : 'New Member'}
      </Typography>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          {Object.keys(formState).map((key) => (
            <Grid item xs={12} sm={6} key={key}>
              <TextField
                name={key}
                label={key.replace(/_/g, ' ').toUpperCase()}
                value={formState[key]}
                onChange={handleChange}
                fullWidth
                margin="normal"
                type={key.includes('date') ? 'date' : 'text'}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
          ))}
          <Grid item xs={12} sm={6}>
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
          </Grid>
        </Grid>
        <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
          Save
        </Button>
      </form>
    </Container>
  );
};

export default MemberForm;