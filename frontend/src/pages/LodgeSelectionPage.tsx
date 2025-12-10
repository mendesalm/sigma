import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, List, ListItem, ListItemText } from '@mui/material';

const LodgeSelectionPage: React.FC = () => {
  const { associations, selectAssociation } = useAuth();
  const navigate = useNavigate();

  const handleSelectAssociation = async (association: any) => {
    try {
      await selectAssociation(association);
      if (association.type === 'lodge') {
        navigate('/dashboard/lodge-dashboard');
      } else if (association.type === 'obedience') {
        navigate('/dashboard/obedience-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Falha ao selecionar associação', error);
    }
  };

  return (
    <Container sx={{ mt: { xs: 12, md: 14 } }}>
      <Typography variant="h4" gutterBottom>
        Selecione uma Loja ou Obediência
      </Typography>
      <List>
        {associations.map((association) => (
          <ListItem key={`${association.type}-${association.id}`} button onClick={() => handleSelectAssociation(association)}>
            <ListItemText primary={association.name} secondary={association.type === 'lodge' ? 'Loja' : 'Obediência'} />
          </ListItem>
        ))}
      </List>
    </Container>
  );
};

export default LodgeSelectionPage;
