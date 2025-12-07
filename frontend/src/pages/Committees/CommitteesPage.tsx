import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Button,
  Stack,
  useTheme,
  alpha,
  CircularProgress,
  Alert
} from '@mui/material';
import { Edit, Delete, Add, Event } from '@mui/icons-material';
import { getCommittees, deleteCommittee } from '../../services/api';
import CommitteeForm from './CommitteeForm';

interface Committee {
  id: number;
  name: string;
  description: string;
  committee_type: string;
  start_date: string;
  end_date: string;
  president_id: number;
  president?: { full_name: string }; // Assuming backend returns this or we fetch it
  members: { member: { full_name: string } }[];
}

const CommitteesPage: React.FC = () => {
  const theme = useTheme();
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCommittee, setEditingCommittee] = useState<Committee | undefined>(undefined);

  const fetchCommittees = async () => {
    try {
      setLoading(true);
      const response = await getCommittees();
      setCommittees(response.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Falha ao carregar comissões.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommittees();
  }, []);

  const handleCreate = () => {
    setEditingCommittee(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (committee: Committee) => {
    setEditingCommittee(committee);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir esta comissão?")) {
      try {
        await deleteCommittee(id);
        fetchCommittees();
      } catch (err) {
        console.error(err);
        alert("Erro ao excluir comissão.");
      }
    }
  };

  const handleSave = () => {
    fetchCommittees();
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: '800', color: 'primary.main', letterSpacing: '-0.5px' }}>
          Gestão de Comissões
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreate}
          sx={{ fontWeight: 'bold', borderRadius: '8px' }}
        >
          Nova Comissão
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {committees.map((committee) => (
          <Grid item xs={12} md={6} lg={4} key={committee.id}>
            <Card 
              elevation={3}
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                position: 'relative',
                borderRadius: '12px',
                overflow: 'hidden',
                backgroundColor: theme.palette.background.paper,
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[8]
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1, pb: 6 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
                    {committee.name}
                  </Typography>
                  <Box>
                    <IconButton size="small" onClick={() => handleEdit(committee)} color="primary">
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(committee.id)} color="error">
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>

                <Chip 
                  label={committee.committee_type} 
                  size="small" 
                  sx={{ 
                    mb: 2, 
                    backgroundColor: committee.committee_type === 'Permanente' ? alpha('#4caf50', 0.1) : alpha('#ffeb3b', 0.1),
                    color: committee.committee_type === 'Permanente' ? '#4caf50' : '#fbc02d',
                    fontWeight: 'bold',
                    border: `1px solid ${committee.committee_type === 'Permanente' ? '#4caf50' : '#fbc02d'}`
                  }} 
                />

                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2, color: 'text.secondary', fontSize: '0.875rem' }}>
                  <Event fontSize="small" />
                  <Typography variant="body2">
                    {new Date(committee.start_date).toLocaleDateString()} - {new Date(committee.end_date).toLocaleDateString()}
                  </Typography>
                </Stack>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, minHeight: '40px' }}>
                  {committee.description}
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    Presidente:
                  </Typography>
                  <Typography variant="body2">
                    {committee.president?.full_name || 'Não definido'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                    Membros:
                  </Typography>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.875rem', color: theme.palette.text.secondary }}>
                    {committee.members.map((m, index) => (
                      <li key={index}>{m.member.full_name}</li>
                    ))}
                  </ul>
                </Box>
              </CardContent>
              
              {/* Colored Strip at Bottom */}
              <Box 
                sx={{ 
                  height: '6px', 
                  width: '100%', 
                  backgroundColor: committee.committee_type === 'Permanente' ? '#4caf50' : '#ffeb3b',
                  position: 'absolute',
                  bottom: 0,
                  left: 0
                }} 
              />
            </Card>
          </Grid>
        ))}
      </Grid>

      <CommitteeForm 
        open={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        onSave={handleSave} 
        committeeToEdit={editingCommittee} 
      />
    </Container>
  );
};

export default CommitteesPage;
