import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Button, Container, TextField, Typography, Select, MenuItem, FormControl, 
  InputLabel, Grid, SelectChangeEvent, Paper, Box, Snackbar, Alert, 
  Avatar, Stack, Checkbox, FormControlLabel, IconButton, CircularProgress,
  Divider, useTheme
} from '@mui/material';
import { 
  PhotoCamera, 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  Search as SearchIcon,
  Person as PersonIcon,
  Home as HomeIcon,
  School as SchoolIcon,
  Groups as GroupsIcon,
  History as HistoryIcon,
  Star as StarIcon,
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Badge as BadgeIcon,
} from '@mui/icons-material';
import Chip from '@mui/material/Chip'; // Explicit import for Chip
import api from '../../services/api';
import { MemberResponse, DegreeEnum, RegistrationStatusEnum, RelationshipTypeEnum, RoleHistoryResponse, MemberStatusEnum, MemberClassEnum } from '../../types';
import { formatCPF, formatPhone, formatCEP } from '../../utils/formatters';
import { validateCPF, validateEmail } from '../../utils/validators';
import RoleAssignmentDialog from '../../components/RoleAssignmentDialog';
import { fetchAddressByCep } from '../../services/cepService';
import { useAuth } from '../../hooks/useAuth';

interface Role {
  id: number;
  name: string;
}

interface FamilyMemberLocal {
  id?: number;
  full_name: string;
  relationship_type: string;
  birth_date: string;
  phone: string;
  email: string;
  is_deceased: boolean;
}

// Reuse SectionHeader pattern
const SectionHeader = ({ title, icon, color = "primary" }: { title: string, icon?: React.ReactNode, color?: "primary" | "secondary" | "info" | "warning" | "success" }) => {
    const theme = useTheme();
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, mt: 1 }}>
            {icon && <Box sx={{ mr: 1.5, color: theme.palette[color].main, display: 'flex' }}>{icon}</Box>}
            <Typography variant="h6" color="text.primary" sx={{ fontWeight: 600, letterSpacing: 0.5 }}>
                {title}
            </Typography>
            <Divider sx={{ flexGrow: 1, ml: 2, borderColor: theme.palette.divider }} />
        </Box>
    );
};

const MemberForm: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [formState, setFormState] = useState<any>({
    full_name: '',
    email: '',
    cpf: '',
    identity_document: '',
    birth_date: '',
    marriage_date: '',
    street_address: '',
    street_number: '',
    neighborhood: '',
    city: '',
    zip_code: '',
    phone: '',
    place_of_birth: '',
    nationality: '',
    religion: '',

    education_level: '',
    occupation: '',
    workplace: '',
    profile_picture_path: '',
    cim: '',
    status: MemberStatusEnum.ACTIVE,
    member_class: MemberClassEnum.REGULAR,
    degree: DegreeEnum.APPRENTICE,
    initiation_date: '',
    elevation_date: '',
    exaltation_date: '',
    affiliation_date: '',
    regularization_date: '',
    philosophical_degree: '',
    registration_status: RegistrationStatusEnum.PENDING,
    password: '',
    confirmPassword: '',
    lodge_id: '',
    role_id: '',
  });
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberLocal[]>([]);
  const [roleHistory, setRoleHistory] = useState<RoleHistoryResponse[]>([]);
  const [newRole, setNewRole] = useState({
    role_id: '',
    start_date: '',
    end_date: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [roles, setRoles] = useState<Role[]>([]);
  const [openRoleDialog, setOpenRoleDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' | 'info' }>({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // New State for CIM Flow
  const [isCimVerified, setIsCimVerified] = useState(false);
  const [cimCheckLoading, setCimCheckLoading] = useState(false);
  const [existingMemberId, setExistingMemberId] = useState<number | null>(null);

  const handleCepBlur = async () => {
    if (formState.zip_code) {
      const address = await fetchAddressByCep(formState.zip_code);
      if (address) {
        setFormState((prev: any) => ({
          ...prev,
          street_address: address.logradouro,
          neighborhood: address.bairro,
          city: address.localidade,
          state: address.uf,
        }));
      } else {
        setSnackbar({ open: true, message: 'CEP não encontrado.', severity: 'error' });
      }
    }
  };

  useEffect(() => {
    if (user?.user_type === 'webmaster' && user?.lodge_id) {
      setFormState((prev: any) => ({ ...prev, lodge_id: user.lodge_id }));
    }
  }, [user]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await api.get('/roles');
        setRoles(response.data);
      } catch (error) {
        console.error('Failed to fetch roles', error);
      }
    };
    fetchRoles();

    if (id) {
      // If editing, skip CIM check
      setIsCimVerified(true);
      const fetchMember = async () => {
        try {
          const response = await api.get<MemberResponse>(`/members/${id}`);
          const memberData = response.data;
          
          // Determine target lodge ID (Webmaster's lodge or first association)
          let targetLodgeId = memberData.lodge_associations?.[0]?.lodge_id;
          if (user?.user_type === 'webmaster' && user?.lodge_id) {
             targetLodgeId = user.lodge_id;
          }

          const association = memberData.lodge_associations?.find(a => a.lodge_id === targetLodgeId);
          const activeRole = memberData.role_history?.find(h => !h.end_date && h.lodge_id === targetLodgeId);
          
          setFormState({
            ...memberData,
            lodge_id: targetLodgeId || '',
            role_id: activeRole?.role_id || '',
            status: association?.status || MemberStatusEnum.ACTIVE,
            member_class: association?.member_class || MemberClassEnum.REGULAR
          });

          // Populate family members
          if (memberData.family_members) {
             setFamilyMembers(memberData.family_members.map(fm => ({
               id: fm.id,
               full_name: fm.full_name,
               relationship_type: fm.relationship_type,
               birth_date: fm.birth_date || '',
               phone: fm.phone || '',
               email: fm.email || '',
               is_deceased: fm.is_deceased
             })));
          }

          // Populate role history
          if (memberData.role_history) {
            setRoleHistory(memberData.role_history);
          }

        } catch (error) {
          console.error('Failed to fetch member', error);
        }
      };
      fetchMember();
    }
  }, [id, user]);

  const validateField = (name: string, value: string) => {
    let error = '';
    if (name === 'cpf' && value && !validateCPF(value)) {
      error = 'CPF inválido';
    }
    if (name === 'email' && value && !validateEmail(value)) {
      error = 'Email inválido';
    }
    
    setErrors((prev) => ({ ...prev, [name]: error }));
    return error === '';
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> | SelectChangeEvent) => {
    const { name, value } = event.target;
    let formattedValue = value;

    if (typeof value === 'string') {
      if (name === 'cpf') formattedValue = formatCPF(value);
      if (name === 'phone') formattedValue = formatPhone(value);
      if (name === 'zip_code') formattedValue = formatCEP(value);
      
      validateField(name as string, formattedValue as string);
    }

    setFormState((prevState: any) => ({
      ...prevState,
      [name as string]: formattedValue,
    }));
  };

  const handleCheckCim = async () => {
    if (!formState.cim) {
      setSnackbar({ open: true, message: 'Por favor, informe o CIM.', severity: 'warning' });
      return;
    }

    setCimCheckLoading(true);
    try {
      const response = await api.get<MemberResponse>(`/members/check-cim/${formState.cim}`);
      const memberData = response.data;
      
      // Member found! Import data
      setExistingMemberId(memberData.id);
      setFormState((prev: any) => ({
        ...prev,
        ...memberData,
        // Keep lodge_id from current context, DO NOT overwrite with member's other lodge
        lodge_id: prev.lodge_id, 
        // Reset role_id because role is per-lodge
        role_id: '',
        // Reset status/class to defaults for new association
        status: MemberStatusEnum.ACTIVE,
        member_class: MemberClassEnum.REGULAR,
        password: '' // Don't need password for existing member
      }));

      if (memberData.family_members) {
        setFamilyMembers(memberData.family_members.map(fm => ({
          id: fm.id,
          full_name: fm.full_name,
          relationship_type: fm.relationship_type,
          birth_date: fm.birth_date || '',
          phone: fm.phone || '',
          email: fm.email || '',
          is_deceased: fm.is_deceased
        })));
     }

      setSnackbar({ open: true, message: 'Membro encontrado! Dados importados.', severity: 'success' });
      setIsCimVerified(true);

    } catch (error: any) {
      if (error.response?.status === 404) {
        // Member not found, proceed to registration
        setSnackbar({ open: true, message: 'CIM não encontrado. Iniciando novo cadastro.', severity: 'info' });
        setIsCimVerified(true);
        setExistingMemberId(null);
      } else {
        console.error('Error checking CIM', error);
        setSnackbar({ open: true, message: 'Erro ao verificar CIM.', severity: 'error' });
      }
    } finally {
      setCimCheckLoading(false);
    }
  };

  const handleFamilyMemberChange = (index: number, field: keyof FamilyMemberLocal, value: any) => {
    const updatedMembers = [...familyMembers];
    updatedMembers[index] = { ...updatedMembers[index], [field]: value };
    setFamilyMembers(updatedMembers);
  };

  const addFamilyMember = () => {
    setFamilyMembers([...familyMembers, {
      full_name: '',
      relationship_type: RelationshipTypeEnum.SPOUSE,
      birth_date: '',
      phone: '',
      email: '',
      is_deceased: false
    }]);
  };

  const removeFamilyMember = (index: number) => {
    const updatedMembers = [...familyMembers];
    updatedMembers.splice(index, 1);
    setFamilyMembers(updatedMembers);
  };

  const handleAddRole = async () => {
    if (!newRole.role_id || !newRole.start_date) {
      setSnackbar({ open: true, message: 'Preencha o cargo e a data de início.', severity: 'error' });
      return;
    }

    if (id) {
      try {
        const response = await api.post(`/members/${id}/roles`, {
          role_id: Number(newRole.role_id),
          start_date: newRole.start_date,
          end_date: newRole.end_date || null
        });

        setRoleHistory([...roleHistory, response.data]);
        setNewRole({ role_id: '', start_date: '', end_date: '' });
        setSnackbar({ open: true, message: 'Cargo adicionado com sucesso!', severity: 'success' });
      } catch (error) {
        console.error('Failed to add role', error);
        setSnackbar({ open: true, message: 'Erro ao adicionar cargo.', severity: 'error' });
      }
    } else {
      // Local state for new member
      const newHistoryItem: RoleHistoryResponse = {
        id: Date.now() * -1, // Temporary negative ID
        role_id: Number(newRole.role_id),
        start_date: newRole.start_date,
        end_date: newRole.end_date || undefined,
        member_id: 0, // Placeholder
        lodge_id: Number(formState.lodge_id)
      };
      setRoleHistory([...roleHistory, newHistoryItem]);
      setNewRole({ role_id: '', start_date: '', end_date: '' });
    }
  };

  const handleDeleteRole = async (roleHistoryId: number) => {
    if (id && roleHistoryId > 0) {
      try {
        await api.delete(`/members/${id}/roles/${roleHistoryId}`);
        setRoleHistory(roleHistory.filter(h => h.id !== roleHistoryId));
        setSnackbar({ open: true, message: 'Cargo removido com sucesso!', severity: 'success' });
      } catch (error) {
        console.error('Failed to delete role', error);
        setSnackbar({ open: true, message: 'Erro ao remover cargo.', severity: 'error' });
      }
    } else {
      // Local state removal
      setRoleHistory(roleHistory.filter(h => h.id !== roleHistoryId));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    const newErrors: { [key: string]: string } = {};
    if (formState.cpf && !validateCPF(formState.cpf)) newErrors.cpf = 'CPF inválido';
    if (formState.email && !validateEmail(formState.email)) newErrors.email = 'Email inválido';
    if (formState.password && formState.password !== formState.confirmPassword) {
      newErrors.password = 'As senhas não conferem';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSnackbar({ open: true, message: 'Por favor, corrija os erros no formulário.', severity: 'error' });
      return;
    }

    // Sanitize form data
    const sanitizedFormState = Object.entries(formState).reduce((acc, [key, value]) => {
      if (key === 'confirmPassword') return acc; // Exclude confirmPassword
      if (value === '' || value === null) {
        acc[key] = undefined;
      } else {
        acc[key] = value;
      }
      return acc;
    }, {} as any);

    const memberData = { 
      ...sanitizedFormState,
      role_id: sanitizedFormState.role_id ? Number(sanitizedFormState.role_id) : undefined,
      lodge_id: Number(sanitizedFormState.lodge_id),
      family_members: familyMembers 
    };

    try {
      let targetId = id || existingMemberId;

      if (existingMemberId && !id) {
        // Case: Associating existing member found via CIM
        await api.post(`/members/${existingMemberId}/associate`, {
          lodge_id: Number(sanitizedFormState.lodge_id),
          role_id: sanitizedFormState.role_id ? Number(sanitizedFormState.role_id) : undefined,
          status: sanitizedFormState.status,
          member_class: sanitizedFormState.member_class,
          member_update: memberData // Pass updated data to update the member record
        });
        setSnackbar({ open: true, message: 'Membro associado com sucesso!', severity: 'success' });
      } else if (id) {
        // Case: Updating existing member (Edit Mode)
        await api.put(`/members/${id}`, memberData);
        setSnackbar({ open: true, message: 'Membro atualizado com sucesso!', severity: 'success' });
      } else {
        // Case: Creating new member
        const response = await api.post('/members', memberData);
        targetId = response.data.id;

        // Persist roles for new member
        if (roleHistory.length > 0) {
          for (const role of roleHistory) {
            await api.post(`/members/${targetId}/roles`, {
              role_id: role.role_id,
              start_date: role.start_date,
              end_date: role.end_date || null
            });
          }
        }

        setSnackbar({ open: true, message: 'Membro criado com sucesso!', severity: 'success' });
      }

      // Upload profile picture if selected
      if (selectedFile && targetId) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        await api.post(`/members/${targetId}/photo`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      setTimeout(() => navigate('/dashboard/management/members'), 1500);
    } catch (error: any) {
      console.error('Failed to save member', error);
      const errorMessage = error.response?.data?.detail 
        ? (typeof error.response.data.detail === 'object' 
            ? JSON.stringify(error.response.data.detail) 
            : error.response.data.detail)
        : 'Erro ao salvar membro. Verifique os dados.';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    }
  };

  // --- RENDER CIM CHECK STEP ---
  if (!isCimVerified && !id) {
    return (
      <Container maxWidth="sm">
        <Paper elevation={0} sx={{ p: 4, mt: 8, textAlign: 'center', borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                <SearchIcon sx={{ fontSize: 60, color: 'text.secondary' }} />
            </Box>
          <Typography variant="h5" gutterBottom color="primary" sx={{ fontWeight: 700 }}>
            Cadastro de Novo Membro
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
            Informe o CIM para iniciarmos. O sistema verificará se o irmão já possui cadastro na base unificada.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'stretch' }}>
            <TextField
              label="Número do CIM"
              value={formState.cim}
              onChange={(e) => setFormState({ ...formState, cim: e.target.value })}
              fullWidth
              variant="outlined"
              placeholder="Ex: 12345"
            />
            <Button 
              variant="contained" 
              onClick={handleCheckCim}
              disabled={cimCheckLoading}
              size="large"
              sx={{ px: 4, minWidth: '140px' }}
              startIcon={cimCheckLoading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
            >
              {cimCheckLoading ? 'Buscando' : 'Verificar'}
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ pb: 5 }}>
       {/* Page Header */}
       <Box sx={{ mb: 4, mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'text.primary' }}>
            {id ? 'Editar Membro' : (existingMemberId ? 'Associar Membro' : 'Novo Membro')}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
            {id ? 'Atualize as informações do cadastro.' : 'Preencha os dados abaixo para cadastrar um novo irmão.'}
            </Typography>
        </Box>
        <Button 
            variant="outlined" 
            startIcon={<ArrowBackIcon />} 
            onClick={() => navigate('/dashboard/management/members')}
            sx={{ borderRadius: 2 }}
        >
            Voltar
        </Button>
      </Box>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Main Content Column */}
          <Grid item xs={12} md={9}>
            
            {/* 1. DADOS PESSOAIS */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
              <SectionHeader title="Dados Pessoais" icon={<PersonIcon />} />
              <Grid container spacing={3}>
              <Grid item xs={12} md={3} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                   <Box sx={{ position: 'relative' }}>
                        <Avatar
                            variant="rounded"
                            sx={{ width: 150, height: 200, mb: 2, boxShadow: theme.shadows[3], objectFit: 'cover' }}
                            src={formState.profile_picture_path ? (formState.profile_picture_path.startsWith('blob:') ? formState.profile_picture_path : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${formState.profile_picture_path}`) : undefined}
                            alt={formState.full_name}
                        />
                        <IconButton 
                            color="primary" 
                            aria-label="upload picture" 
                            component="label"
                            sx={{ position: 'absolute', bottom: 16, right: 0, bgcolor: 'background.paper', boxShadow: 1, '&:hover': { bgcolor: 'action.hover' } }}
                        >
                            <PhotoCamera />
                            <input 
                            hidden 
                            accept="image/*" 
                            type="file" 
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0];
                                setSelectedFile(file);
                                // Create a preview URL
                                const previewUrl = URL.createObjectURL(file);
                                setFormState({ ...formState, profile_picture_path: previewUrl });
                                }
                            }}
                            />
                        </IconButton>
                   </Box>
                   <Typography variant="caption" color="text.secondary">Foto de Perfil</Typography>
                </Grid>
                <Grid item xs={12} md={9}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        name="full_name"
                        label="Nome Completo"
                        value={formState.full_name}
                        onChange={handleChange}
                        fullWidth
                        required
                        variant="outlined"
                        placeholder="Nome civil completo"
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        name="cpf"
                        label="CPF"
                        value={formState.cpf}
                        onChange={handleChange}
                        fullWidth
                        error={!!errors.cpf}
                        helperText={errors.cpf}
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        name="email"
                        label="Email Principal"
                        value={formState.email}
                        onChange={handleChange}
                        fullWidth
                        required
                        error={!!errors.email}
                        helperText={errors.email}
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        name="identity_document"
                        label="RG / Documento de Identidade"
                        value={formState.identity_document}
                        onChange={handleChange}
                        fullWidth
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        name="birth_date"
                        label="Data de Nascimento"
                        type="date"
                        value={formState.birth_date || ''}
                        onChange={handleChange}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        name="marriage_date"
                        label="Data de Casamento"
                        type="date"
                        value={formState.marriage_date || ''}
                        onChange={handleChange}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        name="phone"
                        label="Celular / WhatsApp"
                        value={formState.phone}
                        onChange={handleChange}
                        fullWidth
                        variant="outlined"
                      />
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Paper>

             {/* 2. ENDEREÇO */}
             <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
              <SectionHeader title="Endereço Residencial" icon={<HomeIcon />} color="info" />
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <TextField
                    name="zip_code"
                    label="CEP"
                    value={formState.zip_code}
                    onChange={handleChange}
                    onBlur={handleCepBlur}
                    fullWidth
                    variant="outlined"
                    placeholder="00000-000"
                    InputProps={{ endAdornment: <SearchIcon color="action" /> }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="street_address"
                    label="Logradouro"
                    value={formState.street_address}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    name="street_number"
                    label="Número"
                    value={formState.street_number}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} md={5}>
                  <TextField
                    name="neighborhood"
                    label="Bairro"
                    value={formState.neighborhood}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} md={5}>
                  <TextField
                    name="city"
                    label="Cidade"
                    value={formState.city}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                     <TextField
                        name="state"
                        label="UF"
                        value={formState.state || ''}
                        onChange={handleChange}
                        fullWidth
                        variant="outlined"
                     />
                </Grid>
              </Grid>
            </Paper>

            {/* 3. DADOS PROFISSIONAIS */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
              <SectionHeader title="Dados Profissionais e Formação" icon={<SchoolIcon />} color="secondary" />
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    name="education_level"
                    label="Formação Acadêmica"
                    value={formState.education_level}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
                    placeholder="Ex: Superior Completo"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    name="occupation"
                    label="Ocupação / Profissão"
                    value={formState.occupation}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
                    placeholder="Ex: Engenheiro Civil"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    name="workplace"
                    label="Local de Trabalho / Empresa"
                    value={formState.workplace}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* 4. DADOS MAÇÔNICOS */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
              <SectionHeader title="Dados Maçônicos" icon={<BadgeIcon />} color="warning" />
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <TextField
                    name="cim"
                    label="CIM"
                    value={formState.cim}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
                    disabled={!!existingMemberId} // Disable CIM editing if imported
                    InputProps={{ sx: { bgcolor: existingMemberId ? 'action.hover' : 'inherit' } }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Grau</InputLabel>
                    <Select
                      name="degree"
                      value={formState.degree}
                      label="Grau"
                      onChange={handleChange}
                    >
                      <MenuItem value={DegreeEnum.APPRENTICE}>Aprendiz</MenuItem>
                      <MenuItem value={DegreeEnum.FELLOW}>Companheiro</MenuItem>
                      <MenuItem value={DegreeEnum.MASTER}>Mestre</MenuItem>
                      <MenuItem value={DegreeEnum.INSTALLED_MASTER}>Mestre Instalado</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    label="Cargo Atual"
                    value={roles.find(r => r.id === roleHistory.find(h => !h.end_date)?.role_id)?.name || 'Nenhum'}
                    fullWidth
                    variant="filled"
                    InputProps={{ 
                      readOnly: true,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    name="initiation_date"
                    label="Data de Iniciação"
                    type="date"
                    value={formState.initiation_date || ''}
                    onChange={handleChange}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    name="elevation_date"
                    label="Data de Elevação"
                    type="date"
                    value={formState.elevation_date || ''}
                    onChange={handleChange}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    name="exaltation_date"
                    label="Data de Exaltação"
                    type="date"
                    value={formState.exaltation_date || ''}
                    onChange={handleChange}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    variant="outlined"
                  />
                </Grid>
              </Grid>
            </Paper>

             {/* 5. HISTÓRICO DE CARGOS */}
             <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
               <SectionHeader title="Histórico de Cargos" icon={<HistoryIcon />} color="success" />
               
               {/* Add Form */}
               <Box sx={{ p: 2, bgcolor: theme.palette.action.hover, borderRadius: 2, mb: 3 }}>
                   <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>Adicionar Novo Registro</Typography>
                   <Grid container spacing={2} alignItems="center">
                     <Grid item xs={12} md={4}>
                       <FormControl fullWidth size="small">
                         <InputLabel>Cargo</InputLabel>
                         <Select
                           label="Cargo"
                           value={newRole.role_id}
                           onChange={(e) => setNewRole({ ...newRole, role_id: e.target.value })}
                         >
                            <MenuItem value="">-- Selecione --</MenuItem>
                            {roles.map((role) => (
                             <MenuItem key={role.id} value={role.id}>
                               {role.name}
                             </MenuItem>
                           ))}
                         </Select>
                       </FormControl>
                     </Grid>
                     <Grid item xs={6} md={3}>
                       <TextField
                         label="Data de Início"
                         type="date"
                         fullWidth
                         size="small"
                         InputLabelProps={{ shrink: true }}
                         value={newRole.start_date}
                         onChange={(e) => setNewRole({ ...newRole, start_date: e.target.value })}
                       />
                     </Grid>
                     <Grid item xs={6} md={3}>
                       <TextField
                         label="Data de Término"
                         type="date"
                         fullWidth
                         size="small"
                         InputLabelProps={{ shrink: true }}
                         value={newRole.end_date}
                         onChange={(e) => setNewRole({ ...newRole, end_date: e.target.value })}
                       />
                     </Grid>
                     <Grid item xs={12} md={2}>
                        <Button 
                            fullWidth 
                            variant="contained" 
                            size="small" 
                            startIcon={<AddIcon />}
                            onClick={handleAddRole}
                        >
                            Adicionar
                        </Button>
                     </Grid>
                   </Grid>
               </Box>

                {/* List Table */}
                <Box sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, overflow: 'hidden' }}>
                    {/* Table Header */}
                   <Box sx={{ display: 'flex', bgcolor: theme.palette.action.selected, p: 1.5 }}>
                     <Box sx={{ flex: 4, fontWeight: 'bold', fontSize: '0.85rem' }}>CARGO</Box>
                     <Box sx={{ flex: 3, fontWeight: 'bold', fontSize: '0.85rem' }}>INÍCIO</Box>
                     <Box sx={{ flex: 3, fontWeight: 'bold', fontSize: '0.85rem' }}>TÉRMINO</Box>
                     <Box sx={{ flex: 2, fontWeight: 'bold', fontSize: '0.85rem', textAlign: 'center' }}>AÇÕES</Box>
                   </Box>
                   {roleHistory.length > 0 ? (
                     roleHistory.map((history, index) => {
                       const roleName = roles.find(r => r.id === history.role_id)?.name || 'Cargo Desconhecido';
                       return (
                         <Box key={index} sx={{ display: 'flex', p: 1.5, borderTop: `1px solid ${theme.palette.divider}`, alignItems: 'center' }}>
                           <Box sx={{ flex: 4, fontSize: '0.9rem' }}>{roleName}</Box>
                           <Box sx={{ flex: 3, fontSize: '0.9rem', color: 'text.secondary' }}>{history.start_date ? new Date(history.start_date).toLocaleDateString('pt-BR') : '-'}</Box>
                           <Box sx={{ flex: 3, fontSize: '0.9rem', color: 'text.secondary' }}>{history.end_date ? new Date(history.end_date).toLocaleDateString('pt-BR') : <Chip label="Atual" size="small" color="success" variant="outlined" />}</Box>
                           <Box sx={{ flex: 2, textAlign: 'center' }}>
                              <IconButton size="small" color="error" onClick={() => handleDeleteRole(history.id)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                           </Box>
                         </Box>
                       );
                     })
                   ) : (
                     <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                       Nenhum histórico de cargo registrado.
                     </Box>
                   )}
                </Box>
             </Paper>

            {/* 6. FAMILIARES */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
              <SectionHeader title="Familiares" icon={<GroupsIcon />} />
              
              {familyMembers.map((member, index) => (
                <Paper key={index} variant="outlined" sx={{ mb: 2, p: 2, borderRadius: 2, position: 'relative' }}>
                   <Box sx={{ position: 'absolute', right: 8, top: 8 }}>
                       <IconButton onClick={() => removeFamilyMember(index)} color="error" size="small">
                          <DeleteIcon />
                       </IconButton>
                   </Box>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Nome do Familiar"
                        value={member.full_name}
                        onChange={(e) => handleFamilyMemberChange(index, 'full_name', e.target.value)}
                        fullWidth
                        size="small"
                        variant="standard"
                      />
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <FormControl fullWidth size="small" variant="standard">
                        <InputLabel>Parentesco</InputLabel>
                        <Select
                          value={member.relationship_type}
                          label="Parentesco"
                          onChange={(e) => handleFamilyMemberChange(index, 'relationship_type', e.target.value)}
                        >
                          <MenuItem value={RelationshipTypeEnum.SPOUSE}>Cônjuge</MenuItem>
                          <MenuItem value={RelationshipTypeEnum.SON}>Filho</MenuItem>
                          <MenuItem value={RelationshipTypeEnum.DAUGHTER}>Filha</MenuItem>
                          <MenuItem value={RelationshipTypeEnum.FATHER}>Pai</MenuItem>
                          <MenuItem value={RelationshipTypeEnum.MOTHER}>Mãe</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <TextField
                        label="Data de Nasc."
                        type="date"
                        value={member.birth_date}
                        onChange={(e) => handleFamilyMemberChange(index, 'birth_date', e.target.value)}
                        fullWidth
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        variant="standard"
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={member.is_deceased}
                            onChange={(e) => handleFamilyMemberChange(index, 'is_deceased', e.target.checked)}
                            size="small"
                          />
                        }
                        label={<Typography variant="body2">Falecido?</Typography>}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              ))}
              <Button 
                startIcon={<AddIcon />} 
                onClick={addFamilyMember} 
                variant="outlined" 
                fullWidth 
                sx={{ borderStyle: 'dashed' }}
              >
                Adicionar Familiar
              </Button>
            </Paper>

             {/* 7. CONDECORAÇÕES (Placeholder for improvements) */}
             <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
              <SectionHeader title="Condecorações" icon={<StarIcon />} color="warning" />
              <Box sx={{ p: 4, border: '1px dashed grey', borderRadius: 2, textAlign: 'center', bgcolor: theme.palette.action.hover }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    Esta seção está em desenvolvimento.
                </Typography>
                <Button onClick={() => console.log('Add Decoration')} color="primary" startIcon={<AddIcon />}>
                    Adicionar Condecoração
                </Button>
              </Box>
            </Paper>

          </Grid>

          {/* Sidebar Actions Column */}
          <Grid item xs={12} md={3}>
            {/* INFORMAÇÕES DE ACESSO */}
            <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
               <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Configurações
               </Typography>
               <Divider sx={{ mb: 2 }} />
               
               <Stack spacing={2}>
                    <FormControl fullWidth variant="outlined" size="small">
                    <InputLabel>Credencial</InputLabel>
                    <Select
                        value="Webmaster" // Placeholder
                        label="Credencial"
                        disabled
                    >
                        <MenuItem value="Webmaster">Webmaster</MenuItem>
                        <MenuItem value="Admin">Admin</MenuItem>
                    </Select>
                    </FormControl>

                    <FormControl fullWidth variant="outlined" size="small">
                    <InputLabel>Status na Loja</InputLabel>
                    <Select
                        name="status"
                        value={formState.status}
                        label="Status na Loja"
                        onChange={handleChange}
                    >
                        <MenuItem value={MemberStatusEnum.ACTIVE}>Ativo</MenuItem>
                        <MenuItem value={MemberStatusEnum.INACTIVE}>Inativo</MenuItem>
                        <MenuItem value={MemberStatusEnum.DISABLED}>Desativado (Falecido)</MenuItem>
                    </Select>
                    </FormControl>

                    <FormControl fullWidth variant="outlined" size="small">
                    <InputLabel>Classe</InputLabel>
                    <Select
                        name="member_class"
                        value={formState.member_class}
                        label="Classe"
                        onChange={handleChange}
                    >
                        <MenuItem value={MemberClassEnum.REGULAR}>Regular</MenuItem>
                        <MenuItem value={MemberClassEnum.IRREGULAR}>Irregular</MenuItem>
                        <MenuItem value={MemberClassEnum.EMERITUS}>Emérito</MenuItem>
                        <MenuItem value={MemberClassEnum.REMITTED}>Remido</MenuItem>
                        <MenuItem value={MemberClassEnum.HONORARY}>Honorário</MenuItem>
                    </Select>
                    </FormControl>
               </Stack>

               <Divider sx={{ my: 3 }} />
               
               {/* Password Section */}
               {!id && !existingMemberId ? (
                   <Box>
                       <Typography variant="subtitle2" sx={{ mb: 1 }}>Definir Senha de Acesso</Typography>
                        <TextField
                        name="password"
                        label="Senha Inicial *"
                        type="password"
                        value={formState.password}
                        onChange={handleChange}
                        fullWidth
                        required
                        variant="outlined"
                        size="small"
                        sx={{ mb: 2 }}
                        />
                         <TextField
                          name="confirmPassword"
                          label="Confirmar Senha"
                          type="password"
                          value={formState.confirmPassword || ''}
                          onChange={handleChange}
                          fullWidth
                          required
                          variant="outlined"
                          size="small"
                          error={formState.password && formState.password !== formState.confirmPassword}
                        />
                   </Box>
                ) : (
                    <Box>
                         <Typography variant="subtitle2" sx={{ mb: 1 }}>Alterar Senha</Typography>
                        <TextField
                           name="password"
                           label="Nova Senha"
                           type="password"
                           value={formState.password || ''}
                           onChange={handleChange}
                           fullWidth
                           variant="outlined"
                           size="small"
                           placeholder="Opcional"
                           sx={{ mb: 2 }}
                        />
                         <TextField
                           name="confirmPassword"
                           label="Confirmar Nova Senha"
                           type="password"
                           value={formState.confirmPassword || ''}
                           onChange={handleChange}
                           fullWidth
                           variant="outlined"
                           size="small"
                           error={formState.password && formState.password !== formState.confirmPassword}
                         />
                    </Box>
                )}
            </Paper>

            <Paper elevation={3} sx={{ p: 3, position: 'sticky', top: 20, borderRadius: 3 }}>
              <Typography variant="subtitle1" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
                Ações de Registro
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" align="center" paragraph>
                Verifique os dados antes de salvar.
              </Typography>
              <Stack spacing={2}>
                <Button 
                    type="submit" 
                    variant="contained" 
                    color="primary" 
                    fullWidth 
                    size="large"
                    startIcon={<SaveIcon />}
                >
                  {id ? 'Salvar Alterações' : 'Finalizar Cadastro'}
                </Button>
                {/* {id && (
                  <Button variant="outlined" color="secondary" fullWidth>
                    Redefinir Senha
                  </Button>
                )} */}
                <Button variant="text" color="inherit" fullWidth onClick={() => navigate('/dashboard/management/members')}>
                  Cancelar
                </Button>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </form>

      {id && (
        <RoleAssignmentDialog
          memberId={Number(id)}
          open={openRoleDialog}
          onClose={() => setOpenRoleDialog(false)}
          onSuccess={() => {
            setSnackbar({ open: true, message: 'Cargo atribuído com sucesso!', severity: 'success' });
          }}
        />
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%', borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default MemberForm;