import React from 'react';
import { useAuth } from '@/modules/access_control/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, List, ListItem, ListItemButton, ListItemText } from '@mui/material';

const LodgeSelectionPage: React.FC = () => {
  const { user, associations, selectAssociation } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

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
        {associations && associations.length > 0 ? (
          associations.map((association) => (
            <ListItem key={`${association.type}-${association.id}`} disablePadding>
              <ListItemButton onClick={() => handleSelectAssociation(association)}>
                <ListItemText primary={association.name} secondary={association.type === 'lodge' ? 'Loja' : 'Obediência'} />
              </ListItemButton>
            </ListItem>
          ))
        ) : (
          <Typography color="textSecondary" sx={{ mt: 2 }}>
            Nenhuma associação disponível. Por favor, verifique sua conta.
          </Typography>
        )}
      </List>
    </Container>
  );
};

export default LodgeSelectionPage;
