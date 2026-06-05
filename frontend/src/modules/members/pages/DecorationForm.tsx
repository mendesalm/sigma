import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Container, TextField, Typography } from '@mui/material';

const DecorationForm: React.FC = () => {
  const [formState, setFormState] = useState({
    title: '',
    award_date: '',
    remarks: '',
  });
  const navigate = useNavigate();
  const { memberId, id } = useParams<{ memberId: string, id: string }>();

  useEffect(() => {
    if (id) {
      // In a real implementation, you would fetch this data from the API
      console.log(`Fetching decoration with id: ${id} for member: ${memberId}`);
    }
  }, [id, memberId]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormState((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // In a real implementation, you would call the API to save the decoration
    window.alert(`Simulating save for decoration:\n${JSON.stringify(formState, null, 2)}`);
    navigate(`/dashboard/management/members/edit/${memberId}`); // Go back to the member edit page
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        {id ? 'Edit Decoration' : 'New Decoration'}
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          name="title"
          label="Title"
          value={formState.title}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          name="award_date"
          label="Award Date"
          type="date"
          value={formState.award_date}
          onChange={handleChange}
          fullWidth
          margin="normal"
          InputLabelProps={{
            shrink: true,
          }}
        />
        <TextField
          name="remarks"
          label="Remarks"
          value={formState.remarks}
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

export default DecorationForm;