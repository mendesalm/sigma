import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Container, TextField, Typography } from '@mui/material';

const ClassForm: React.FC = () => {
  const [formState, setFormState] = useState({
    name: '',
    description: '',
  });
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    if (id) {
      // In a real implementation, you would fetch this data from the API
      console.log(`Fetching class with id: ${id}`);
    }
  }, [id]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormState((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // In a real implementation, you would call the API to save the class
    window.alert(`Simulating save for class:\n${JSON.stringify(formState, null, 2)}`);
    navigate('/dashboard/management/classes');
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        {id ? 'Edit Class' : 'New Class'}
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          name="name"
          label="Name"
          value={formState.name}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          name="description"
          label="Description"
          value={formState.description}
          onChange={handleChange}
          fullWidth
          margin="normal"
          multiline
          rows={4}
        />
        <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
          Save
        </Button>
      </form>
    </Container>
  );
};

export default ClassForm;