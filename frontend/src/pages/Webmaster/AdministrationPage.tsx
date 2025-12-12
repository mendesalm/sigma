import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Card,
  CardContent,
  Divider,
  Alert,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  DateRange as DateRangeIcon,
  Person as PersonIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import api from '../../services/api';

// --- Types ---
interface Member {
  id: number;
  full_name: string;
  cim: string;
}

interface Role {
  id: number;
  name: string;
  level: number;
}

interface Officer {
  role_id: number;
  member_id: number;
  role_name?: string;
  member_name?: string;
}

interface Administration {
  id: number;
  identifier: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  role_histories: AppRoleHistory[];
}

interface AppRoleHistory {
    id: number;
    member_id: number;
    role_id: number;
    start_date: string;
    end_date: string;
    member?: Member; // Depends on backend join, or we map it
    role?: Role;
}

interface AdministrationFormInputs {
    identifier: string;
    start_date: string;
    end_date: string;
    is_current: boolean;
}

const AdministrationPage: React.FC = () => {
  const [administrations, setAdministrations] = useState<Administration[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modal State
  const [openModal, setOpenModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Administration | null>(null);
  
  // Officers Management State (Inside Modal)
  const [selectedOfficers, setSelectedOfficers] = useState<Officer[]>([]);

  const { control, handleSubmit, reset, setValue } = useForm<AdministrationFormInputs>();

  // --- Initial Data Fetching ---
  useEffect(() => {
    fetchAdministrations();
    fetchMembers();
    fetchRoles();
  }, []);

  const fetchAdministrations = async () => {
    setLoading(true);
    try {
      const response = await api.get('/administrations');
      setAdministrations(response.data);
    } catch (error) {
      console.error('Error fetching administrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await api.get('/members?limit=1000');
      // Ensure we have an array
      if (Array.isArray(response.data)) {
          setMembers(response.data);
      } else if (response.data && Array.isArray(response.data.data)) {
          // Sometimes it might come wrapped
          setMembers(response.data.data);
      } else {
          console.error("Unexpected members response structure:", response.data);
          setMembers([]);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      // Optional: set a UI error state here
      setMembers([]); 
    }
  };

  const fetchRoles = async () => {
    try {
        // We usually want Lodge roles
      const response = await api.get('/roles?type=Loja'); 
      if (Array.isArray(response.data)) {
        setRoles(response.data);
      } else {
          console.error("Unexpected roles response structure:", response.data);
          setRoles([]);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  // --- Handlers ---

  const handleCreate = () => {
    setEditingAdmin(null);
    reset({
        identifier: '',
        start_date: '',
        end_date: '',
        is_current: false
    });
    setSelectedOfficers([]);
    setOpenModal(true);
  };

  const handleEdit = (admin: Administration) => {
    setEditingAdmin(admin);
    setValue('identifier', admin.identifier);
    setValue('start_date', admin.start_date);
    setValue('end_date', admin.end_date);
    setValue('is_current', admin.is_current);
    
    // Map existing officers
    const existingOfficers = admin.role_histories.map(rh => ({
        role_id: rh.role_id,
        member_id: rh.member_id,
    }));
    setSelectedOfficers(existingOfficers);
    
    setOpenModal(true);
  };

  const onSubmit = async (data: AdministrationFormInputs) => {
    try {
        const payload = {
            ...data,
            officers: selectedOfficers
        };

        if (editingAdmin) {
            await api.put(`/administrations/${editingAdmin.id}`, payload);
        } else {
            await api.post('/administrations', payload);
        }
        
        setOpenModal(false);
        fetchAdministrations();
    } catch (error) {
        console.error("Error saving administration:", error);
        alert("Erro ao salvar administração.");
    }
  };

  const handleOfficerChange = (roleId: number, memberId: number | null) => {
    if (!memberId) {
        // Remove
        setSelectedOfficers(prev => prev.filter(o => o.role_id !== roleId));
    } else {
        // Add or Update
        setSelectedOfficers(prev => {
            const exists = prev.find(o => o.role_id === roleId);
            if (exists) {
                return prev.map(o => o.role_id === roleId ? { ...o, member_id: memberId } : o);
            }
            return [...prev, { role_id: roleId, member_id: memberId }];
        });
    }
  };

  // --- Render Helpers ---

  // Render Helpers ---

  const normalizeRole = (name: string) => {
      let n = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      // Handle aliases for Common Masonic Roles if needed
      n = n.replace(/^1º/, 'primeiro').replace(/^2º/, 'segundo');
      return n;
  };

  const ORDERED_ROLES = [
      "Venerável Mestre",
      "Primeiro Vigilante",
      "Segundo Vigilante",
      "Orador",
      "Orador Adjunto",
      "Secretário",
      "Secretário Adjunto",
      "Chanceler",
      "Chanceler Adjunto",
      "Tesoureiro",
      "Tesoureiro Adjunto",
      "Deputado Federal",
      "Deputado Estadual",
      "Mestre de Cerimônias",
      "Mestre de Harmonia",
      "Mestre de Harmonia Adjunto",
      "Arquiteto",
      "Arquiteto Adjunto",
      "Bibliotecário",
      "Bibliotecário Adjunto",
      "Primeiro Diácono",
      "Segundo Diácono",
      "Primeiro Experto",
      "Segundo Experto",
      "Cobridor Interno",
      "Cobridor Externo",
      "Hospitaleiro",
      "Porta Bandeira",
      "Porta Estandarte"
  ];
  
  // Create a map for normalized lookup
  const ORDERED_MAP = ORDERED_ROLES.reduce((acc, role, index) => {
      acc[normalizeRole(role)] = index;
      return acc;
  }, {} as Record<string, number>);

  const sortedRoles = [...roles].sort((a,b) => {
      const nA = normalizeRole(a.name);
      const nB = normalizeRole(b.name);
      
      const indexA = ORDERED_MAP[nA];
      const indexB = ORDERED_MAP[nB];
      
      const hasA = indexA !== undefined;
      const hasB = indexB !== undefined;
      
      if (hasA && hasB) return indexA - indexB;
      if (hasA) return -1;
      if (hasB) return 1;
      
      return (a.level || 99) - (b.level || 99);
  });

  return (
    <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff' }}>
            Gestão de Exercícios Maçônicos
        </Typography>
        <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreate}
        >
            Novo Exercício
        </Button>
      </Box>

      {/* List of Administrations */}
      <Grid container spacing={3}>
        {administrations.map((admin) => (
            <Grid item xs={12} key={admin.id}>
                <Paper 
                    sx={{ 
                        p: 3, 
                        borderLeft: admin.is_current ? '5px solid #0ea5e9' : '5px solid transparent',
                        bgcolor: '#1e293b',
                        color: '#fff'
                    }}
                >
                    <Grid container alignItems="center" spacing={2}>
                        <Grid item xs={12} md={4}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="h6">{admin.identifier}</Typography>
                                {admin.is_current && <Chip label="Atual" color="primary" size="small" />}
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, color: 'text.secondary' }}>
                                <DateRangeIcon fontSize="small" />
                                <Typography variant="body2">
                                    {new Date(admin.start_date).toLocaleDateString()} - {new Date(admin.end_date).toLocaleDateString()}
                                </Typography>
                            </Box>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            {/* Mini Preview of key officers */}
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                {admin.role_histories.slice(0, 3).map(rh => (
                                    <Box key={rh.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Avatar sx={{ width: 24, height: 24 }} />
                                        <Typography variant="caption">{rh.role?.name || 'Cargo'}: {rh.member?.full_name || 'Membro'}</Typography>
                                    </Box>
                                ))}
                                {admin.role_histories.length > 3 && (
                                    <Typography variant="caption" sx={{ alignSelf: 'center' }}>+ {admin.role_histories.length - 3} oficiais</Typography>
                                )}
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={2} sx={{ textAlign: 'right' }}>
                            <Button 
                                variant="outlined" 
                                startIcon={<EditIcon />} 
                                onClick={() => handleEdit(admin)}
                                size="small"
                            >
                                Editar / Diretoria
                            </Button>
                        </Grid>
                    </Grid>
                </Paper>
            </Grid>
        ))}
        {!loading && administrations.length === 0 && (
            <Grid item xs={12}>
                <Alert severity="info">Nenhum exercício cadastrado.</Alert>
            </Grid>
        )}
      </Grid>

      {/* Dialog for Create/Edit */}
      <Dialog 
        open={openModal} 
        onClose={(event, reason) => {
            if (reason !== 'backdropClick') {
                setOpenModal(false);
            }
        }}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { bgcolor: '#0f172a', color: '#fff' } }} // Dark theme dialog
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            {editingAdmin ? 'Editar Exercício / Diretoria' : 'Novo Exercício Maçônico'}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
            <form id="admin-form" onSubmit={handleSubmit(onSubmit)}>
                <Grid container spacing={3}>
                    {/* Basic Info */}
                    <Grid item xs={12} md={6}>
                        <Controller
                            name="identifier"
                            control={control}
                            defaultValue=""
                            rules={{ required: true }}
                            render={({ field }) => (
                                <TextField 
                                    {...field} 
                                    label="Identificação (Ex: Biênio 2025-2027)" 
                                    fullWidth 
                                    variant="outlined" 
                                    sx={{ mb: 2 }}
                                />
                            )}
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Controller
                            name="start_date"
                            control={control}
                            defaultValue=""
                            rules={{ required: true }}
                            render={({ field }) => (
                                <TextField 
                                    {...field} 
                                    label="Data Início" 
                                    type="date" 
                                    fullWidth 
                                    InputLabelProps={{ shrink: true }} 
                                />
                            )}
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Controller
                            name="end_date"
                            control={control}
                            defaultValue=""
                            rules={{ required: true }}
                            render={({ field }) => (
                                <TextField 
                                    {...field} 
                                    label="Data Fim" 
                                    type="date" 
                                    fullWidth 
                                    InputLabelProps={{ shrink: true }} 
                                />
                            )}
                        />
                    </Grid>
                    <Grid item xs={12}>
                         <Controller
                            name="is_current"
                            control={control}
                            defaultValue={false}
                            render={({ field }) => (
                                <FormControlLabel
                                    control={<Switch checked={field.value} onChange={field.onChange} />}
                                    label="Definir como Exercício Atual (Vigente)"
                                />
                            )}
                        />
                    </Grid>
                </Grid>

                <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.1)' }} />
                
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon color="primary" /> Composição da Diretoria
                </Typography>

                <Grid container spacing={2}>
                    {sortedRoles.map(role => {
                        const currentOfficer = selectedOfficers.find(o => o.role_id === role.id);
                        const currentMember = currentOfficer ? members.find(m => m.id === currentOfficer.member_id) : null;

                        return (
                            <Grid item xs={12} md={6} lg={4} key={role.id}>
                                <Card variant="outlined" sx={{ bgcolor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.1)' }}>
                                    <CardContent sx={{ pb: '16px !important' }}>
                                        <Typography variant="subtitle2" color="primary" gutterBottom>
                                            {role.name}
                                        </Typography>
                                        <Autocomplete
                                            options={members}
                                            getOptionLabel={(option) => `${option.full_name} (CIM: ${option.cim})`}
                                            value={currentMember}
                                            isOptionEqualToValue={(option, value) => option.id === value.id}
                                            onChange={(_, newValue) => handleOfficerChange(role.id, newValue ? newValue.id : null)}
                                            renderInput={(params) => <TextField {...params} variant="standard" placeholder="Pesquisar membro..." />}
                                            noOptionsText={members.length === 0 ? "A lista de membros está vazia" : "Nenhum membro encontrado"}
                                            PaperComponent={({ children }) => (
                                                <Paper sx={{ bgcolor: '#1e293b', color: '#fff' }}>{children}</Paper>
                                            )}
                                            sx={{
                                                '& .MuiInputBase-root': { color: '#fff' },
                                                '& .MuiSvgIcon-root': { color: '#fff' }
                                            }}
                                        />
                                    </CardContent>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            </form>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <Button onClick={() => setOpenModal(false)} color="inherit">Cancelar</Button>
            <Button onClick={handleSubmit(onSubmit)} variant="contained" startIcon={<SaveIcon />}>
                Salvar Exercício
            </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdministrationPage;
