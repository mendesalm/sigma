import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  Typography
} from '@mui/material';
import roleService, { Role } from '../services/roleService';
import memberRoleService from '../services/memberRoleService';
import { useAuth } from '../hooks/useAuth';

interface RoleAssignmentProps {
  memberId: number;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const RoleAssignmentDialog: React.FC<RoleAssignmentProps> = ({ memberId, open, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<number | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchRoles = React.useCallback(async () => {
    try {
      const allRoles = await roleService.getAll();
      // Filter roles based on current user context (Lodge vs Obedience)
      // If user is Webmaster of a Lodge, only show Lodge roles
      if (user?.lodge_id) {
        setRoles(allRoles.filter((r: Role) => r.role_type === 'Loja'));
      } else if (user?.obedience_id) {
        setRoles(allRoles.filter((r: Role) => r.role_type === 'Obediência'));
      } else {
        // SuperAdmin or generic context - show all? Or maybe filter by context if passed
        setRoles(allRoles);
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
      setError('Erro ao carregar lista de cargos.');
    }
  }, [user]);

  useEffect(() => {
    if (open) {
      fetchRoles();
    }
  }, [open, fetchRoles]);

  const handleSubmit = async () => {
    if (!selectedRole) {
      setError('Selecione um cargo.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await memberRoleService.assignRole(memberId, {
        role_id: Number(selectedRole),
        lodge_id: user?.lodge_id, // Assign to current context
        obedience_id: user?.obedience_id,
        start_date: startDate || undefined,
        end_date: endDate || undefined
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error assigning role:', err);
      setError(err.response?.data?.detail || 'Erro ao atribuir cargo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Atribuir Cargo</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}
          
          <Typography variant="body2" color="textSecondary">
            Atribuindo cargo para o membro no contexto atual ({user?.lodge_id ? 'Loja' : 'Obediência'}).
          </Typography>

          <FormControl fullWidth>
            <InputLabel>Cargo</InputLabel>
            <Select
              value={selectedRole}
              label="Cargo"
              onChange={(e) => setSelectedRole(Number(e.target.value))}
            >
              {roles.map((role) => (
                <MenuItem key={role.id} value={role.id}>
                  {role.name} (Nível {role.level})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Data de Início"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />

          <TextField
            label="Data de Término (Opcional)"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary" disabled={loading}>
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RoleAssignmentDialog;
