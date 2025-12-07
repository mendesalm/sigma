import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Autocomplete,
  Chip,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import api from '../../services/api';

interface Member {
  id: number;
  full_name: string;
  active_role?: string;
}

interface CommitteeFormProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  committeeToEdit?: any;
}

const CommitteeForm: React.FC<CommitteeFormProps> = ({ open, onClose, onSave, committeeToEdit }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    committee_type: 'Permanente',
    start_date: '',
    end_date: '',
    president_id: '',
    member_ids: [] as number[],
  });
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchMembers();
      if (committeeToEdit) {
        setFormData({
          name: committeeToEdit.name,
          description: committeeToEdit.description || '',
          committee_type: committeeToEdit.committee_type,
          start_date: committeeToEdit.start_date,
          end_date: committeeToEdit.end_date,
          president_id: committeeToEdit.president_id.toString(),
          member_ids: committeeToEdit.members.map((m: any) => m.member_id),
        });
      } else {
        setFormData({
          name: '',
          description: '',
          committee_type: 'Permanente',
          start_date: '',
          end_date: '',
          president_id: '',
          member_ids: [],
        });
      }
      setError(null);
    }
  }, [open, committeeToEdit]);

  const fetchMembers = async () => {
    try {
      const response = await api.get('/members/');
      setMembers(response.data);
    } catch (err) {
      console.error("Erro ao buscar membros", err);
    }
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...formData,
        president_id: parseInt(formData.president_id),
      };

      if (committeeToEdit) {
        await api.put(`/committees/${committeeToEdit.id}`, payload);
      } else {
        await api.post('/committees/', payload);
      }
      onSave();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Erro ao salvar comissão.");
    } finally {
      setLoading(false);
    }
  };

  // Filter out 'Orador' for President and Members
  const eligibleMembers = members.filter(m => m.active_role !== 'Orador');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{committeeToEdit ? 'Editar Comissão' : 'Nova Comissão'}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box component="form" sx={{ mt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                name="name"
                label="Nome da Comissão"
                fullWidth
                required
                value={formData.name}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Descrição"
                fullWidth
                multiline
                rows={3}
                value={formData.description}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select
                  name="committee_type"
                  value={formData.committee_type}
                  label="Tipo"
                  onChange={handleChange}
                >
                  <MenuItem value="Permanente">Permanente</MenuItem>
                  <MenuItem value="Temporária">Temporária</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                name="start_date"
                label="Data Início"
                type="date"
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
                value={formData.start_date}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                name="end_date"
                label="Data Fim"
                type="date"
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
                value={formData.end_date}
                onChange={handleChange}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Autocomplete
                options={eligibleMembers}
                getOptionLabel={(option) => option.full_name}
                value={eligibleMembers.find(m => m.id.toString() === formData.president_id) || null}
                onChange={(_, newValue) => {
                  setFormData(prev => ({ ...prev, president_id: newValue ? newValue.id.toString() : '' }));
                }}
                renderInput={(params) => <TextField {...params} label="Presidente" required />}
              />
            </Grid>

            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={eligibleMembers.filter(m => m.id.toString() !== formData.president_id)}
                getOptionLabel={(option) => option.full_name}
                value={eligibleMembers.filter(m => formData.member_ids.includes(m.id))}
                onChange={(_, newValue) => {
                  setFormData(prev => ({ ...prev, member_ids: newValue.map(v => v.id) }));
                }}
                renderInput={(params) => <TextField {...params} label="Membros" />}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip label={option.full_name} {...getTagProps({ index })} />
                  ))
                }
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Salvar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CommitteeForm;
