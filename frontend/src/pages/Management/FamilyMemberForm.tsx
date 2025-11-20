import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Container, TextField, Typography, Switch, FormControlLabel, Select, MenuItem, InputLabel, FormControl } from '@mui/material';
import { RelationshipTypeEnum } from '../../types';

const FamilyMemberForm: React.FC = () => {
  const [formState, setFormState] = useState({
    full_name: '',
    relationship_type: RelationshipTypeEnum.SPOUSE,
    birth_date: '',
    email: '',
    phone: '',
    is_deceased: false,
  });
  const navigate = useNavigate();
  const { memberId, id } = useParams<{ memberId: string, id: string }>();

  useEffect(() => {
    if (id) {
      // In a real implementation, you would fetch this data from the API
      // For now, we'll just log it
      console.log(`Fetching family member with id: ${id} for member: ${memberId}`);
    }
  }, [id, memberId]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>)=> {
    const { name, value, type, checked } = event.target as HTMLInputElement;
    setFormState((prevState) => ({
      ...prevState,
      [name as string]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // In a real implementation, you would call the API to save the family member
    window.alert(`Simulating save for family member:\n${JSON.stringify(formState, null, 2)}`);
    navigate(`/dashboard/management/members/edit/${memberId}`); // Go back to the member edit page
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        {id ? 'Edit Family Member' : 'New Family Member'}
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          name="full_name"
          label="Full Name"
          value={formState.full_name}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>Relationship</InputLabel>
          <Select
            name="relationship_type"
            value={formState.relationship_type}
            onChange={handleChange}
          >
            {Object.values(RelationshipTypeEnum).map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          name="birth_date"
          label="Birth Date"
          type="date"
          value={formState.birth_date}
          onChange={handleChange}
          fullWidth
          margin="normal"
          InputLabelProps={{
            shrink: true,
          }}
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
          name="phone"
          label="Phone"
          value={formState.phone}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <FormControlLabel
          control={<Switch name="is_deceased" checked={formState.is_deceased} onChange={handleChange} />}
          label="Deceased"
        />
        <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
          Save
        </Button>
      </form>
    </Container>
  );
};

export default FamilyMemberForm;