import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Stack,
  ListItemIcon,
  Checkbox,
  List,
  ListItem,
  ListItemButton,
  ListItemText
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import roleService, { Role, RoleCreate, Permission } from '../services/roleService';

const RolesPage: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openPermissionDialog, setOpenPermissionDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState<RoleCreate>({
    name: '',
    role_type: 'Loja',
    level: 1,
    base_credential: 10,
    applicable_rites: '',
    permission_ids: []
  });
  
  const { enqueueSnackbar } = useSnackbar();

  const [permissions, setPermissions] = useState<Permission[]>([]);

  const fetchRoles = React.useCallback(async () => {
    try {
      const data = await roleService.getAll();
      setRoles(data);
    } catch (error: any) {
      const msg = error.response?.data?.detail || 'Erro ao carregar cargos';
      enqueueSnackbar(msg, { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  const fetchPermissions = React.useCallback(async () => {
    try {
      const data = await roleService.getPermissions();
      setPermissions(data);
    } catch (error: any) {
      const msg = error.response?.data?.detail || 'Erro ao carregar permissões';
      enqueueSnackbar(msg, { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRoles();
    fetchPermissions();
  }, [fetchRoles, fetchPermissions]);

  const handleOpenDialog = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        name: role.name,
        role_type: role.role_type,
        level: role.level,
        base_credential: role.base_credential,
        applicable_rites: role.applicable_rites || '',
        permission_ids: role.permissions.map(p => p.id)
      });
    } else {
      setEditingRole(null);
      setFormData({
        name: '',
        role_type: 'Loja',
        level: 1,
        base_credential: 10,
        applicable_rites: '',
        permission_ids: []
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingRole(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingRole) {
        await roleService.update(editingRole.id, formData);
        enqueueSnackbar('Cargo atualizado com sucesso', { variant: 'success' });
      } else {
        await roleService.create(formData);
        enqueueSnackbar('Cargo criado com sucesso', { variant: 'success' });
      }
      handleCloseDialog();
      fetchRoles();
    } catch (error: any) {
      const msg = error.response?.data?.detail || 'Erro ao salvar cargo';
      enqueueSnackbar(msg, { variant: 'error' });
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este cargo?')) {
      try {
        await roleService.delete(id);
        enqueueSnackbar('Cargo excluído com sucesso', { variant: 'success' });
        fetchRoles();
      } catch (error: any) {
        const msg = error.response?.data?.detail || 'Erro ao excluir cargo';
        enqueueSnackbar(msg, { variant: 'error' });
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Gerenciamento de Cargos
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Novo Cargo
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Tipo (Escopo)</TableCell>
              <TableCell>Nível</TableCell>
              <TableCell>Credencial Base</TableCell>
              <TableCell>Ritos Aplicáveis</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell>{role.name}</TableCell>
                <TableCell>
                  <Chip
                    label={role.role_type}
                    color={role.role_type === 'Loja' ? 'primary' : role.role_type === 'Obediência' ? 'secondary' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{role.level}</TableCell>
                <TableCell>{role.base_credential}</TableCell>
                <TableCell>{role.applicable_rites || '-'}</TableCell>
                <TableCell align="right">
                  <IconButton color="primary" onClick={() => handleOpenDialog(role)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton color="error" onClick={() => handleDelete(role.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingRole ? 'Editar Cargo' : 'Novo Cargo'}</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Nome do Cargo"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />

            <FormControl fullWidth>
              <InputLabel>Tipo (Escopo)</InputLabel>
              <Select
                value={formData.role_type}
                label="Tipo (Escopo)"
                onChange={(e) => setFormData({ ...formData, role_type: e.target.value as any })}
              >
                <MenuItem value="Loja">Loja</MenuItem>
                <MenuItem value="Obediência">Obediência</MenuItem>
                <MenuItem value="Subobediência">Subobediência</MenuItem>
              </Select>
            </FormControl>

            <Stack direction="row" spacing={2}>
              <TextField
                label="Nível (1-9)"
                type="number"
                fullWidth
                inputProps={{ min: 1, max: 9 }}
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
              />
              <TextField
                label="Credencial Base"
                type="number"
                fullWidth
                value={formData.base_credential}
                onChange={(e) => setFormData({ ...formData, base_credential: parseInt(e.target.value) })}
              />
            </Stack>

            <TextField
              label="Ritos Aplicáveis (separados por vírgula)"
              fullWidth
              helperText="Ex: REAA,YORK (Deixe em branco para todos)"
              value={formData.applicable_rites}
              onChange={(e) => setFormData({ ...formData, applicable_rites: e.target.value })}
            />

            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle1">Permissões ({formData.permission_ids.length} selecionadas)</Typography>
                <Button variant="outlined" size="small" onClick={() => setOpenPermissionDialog(true)}>
                  Selecionar Permissões
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {formData.permission_ids.map((id) => {
                  const permission = permissions.find(p => p.id === id);
                  return (
                    <Chip
                      key={id}
                      label={permission ? permission.action : id}
                      size="small"
                      onDelete={() => {
                        setFormData({
                          ...formData,
                          permission_ids: formData.permission_ids.filter(pid => pid !== id)
                        });
                      }}
                    />
                  );
                })}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Permission Selection Dialog */}
      <Dialog open={openPermissionDialog} onClose={() => setOpenPermissionDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Selecionar Permissões
          <Box mt={1} display="flex" gap={1}>
            <Button
              size="small"
              onClick={() => setFormData({ ...formData, permission_ids: permissions.map(p => p.id) })}
            >
              Marcar Todas
            </Button>
            <Button
              size="small"
              onClick={() => setFormData({ ...formData, permission_ids: [] })}
            >
              Desmarcar Todas
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <List>
            {permissions.map((permission) => {
              const labelId = `checkbox-list-label-${permission.id}`;
              return (
                <ListItem
                  key={permission.id}
                  disablePadding
                >
                  <ListItemButton
                    onClick={() => {
                      const currentIndex = formData.permission_ids.indexOf(permission.id);
                      const newChecked = [...formData.permission_ids];

                      if (currentIndex === -1) {
                        newChecked.push(permission.id);
                      } else {
                        newChecked.splice(currentIndex, 1);
                      }

                      setFormData({ ...formData, permission_ids: newChecked });
                    }}
                  >
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={formData.permission_ids.indexOf(permission.id) !== -1}
                        tabIndex={-1}
                        disableRipple
                        inputProps={{ 'aria-labelledby': labelId }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      id={labelId}
                      primary={permission.action}
                      secondary={permission.description}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPermissionDialog(false)} color="primary">
            Concluir
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default RolesPage;
