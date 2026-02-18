import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Button, Container, TextField, Typography, Select, MenuItem, FormControl, 
  InputLabel, Grid, SelectChangeEvent, Paper, Box, Snackbar, Alert, 
  Avatar, IconButton, CircularProgress,
  Tabs, Tab, Fade, Card, CardContent, useTheme, useMediaQuery, Chip
} from '@mui/material';
import { 
  PhotoCamera, 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  Search as SearchIcon,
  Person as PersonIcon,
  Home as HomeIcon,
  Groups as FamilyIcon,
  History as HistoryIcon,
  Star as StarIcon,
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Badge as BadgeIcon,
  Lock as LockIcon,
  Work as WorkIcon
} from '@mui/icons-material';

import api from '../../services/api';
import { MemberResponse, DegreeEnum, RegistrationStatusEnum, RelationshipTypeEnum, RoleHistoryResponse, MemberStatusEnum, MemberClassEnum } from '../../types';
import { formatCPF, formatPhone, formatCEP } from '../../utils/formatters';
import { validateCPF, validateEmail } from '../../utils/validators';
import { fetchAddressByCep } from '../../services/cepService';
import { useAuth } from '../../hooks/useAuth';

// --- Theme Constants (Matching MeuCadastro) ---
const COLORS = {
  background: '#0B0E14',
  cardBg: '#151B26', 
  cardBorder: 'rgba(255,255,255,0.05)',
  gold: '#D4AF37',
  goldLight: '#F3E5AB',
  goldDark: '#AA8C2C',
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  blue: '#0ea5e9',
};

// --- Custom Styles ---
const customTextFieldStyle = {
  '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.5)' },
  '& .MuiInputLabel-root.Mui-focused': { color: COLORS.gold },
  '& .MuiInputBase-input': { color: '#fff' },
  '& .MuiOutlinedInput-root': {
    bgcolor: 'rgba(0,0,0,0.2)',
    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
    '&.Mui-focused fieldset': { borderColor: COLORS.gold },
  },
  mb: 2
};

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

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`member-tabpanel-${index}`}
      aria-labelledby={`member-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Fade in={value === index}>
          <Box sx={{ py: 3 }}>
            {children}
          </Box>
        </Fade>
      )}
    </div>
  );
};

const SectionTitle = ({ title, icon: Icon }: { title: string, icon: any }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, borderBottom: `1px solid ${COLORS.cardBorder}`, pb: 1 }}>
      <Icon sx={{ color: COLORS.gold, mr: 1.5, fontSize: 24 }} />
      <Typography variant="h6" sx={{ fontFamily: '"Playfair Display", serif', color: COLORS.text, fontWeight: 600 }}>
        {title}
      </Typography>
    </Box>
);

const MemberForm: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // State
  const [tabValue, setTabValue] = useState(0);
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
    installation_date: '',
    affiliation_date: '',
    regularization_date: '',
    philosophical_degree: '',
    registration_status: RegistrationStatusEnum.PENDING,
    password: '',
    confirmPassword: '',
    lodge_id: '',
    role_id: '',
    state: ''
  });
  
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberLocal[]>([]);
  const [roleHistory, setRoleHistory] = useState<RoleHistoryResponse[]>([]);
  const [newRole, setNewRole] = useState({ role_id: '', start_date: '', end_date: '' });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' | 'info' }>({ open: false, message: '', severity: 'success' });
  
  const [isCimVerified, setIsCimVerified] = useState(false);
  const [cimCheckLoading, setCimCheckLoading] = useState(false);
  const [existingMemberId, setExistingMemberId] = useState<number | null>(null);

  // --- Effects ---
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
      setIsCimVerified(true);
      const fetchMember = async () => {
        try {
          const response = await api.get<MemberResponse>(`/members/${id}`);
          const memberData = response.data;
          
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
            member_class: association?.member_class || MemberClassEnum.REGULAR,
            password: '', 
            confirmPassword: ''
          });

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

  // --- Handlers ---
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

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

  const validateField = (name: string, value: string) => {
    let error = '';
    if (name === 'cpf' && value && !validateCPF(value)) error = 'CPF inválido';
    if (name === 'email' && value && !validateEmail(value)) error = 'Email inválido';
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
      setExistingMemberId(memberData.id);
      setFormState((prev: any) => ({
        ...prev,
        ...memberData,
        lodge_id: prev.lodge_id, 
        role_id: '',
        status: MemberStatusEnum.ACTIVE,
        member_class: MemberClassEnum.REGULAR,
        password: ''
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
      setSnackbar({ open: true, message: 'Membro encontrado!', severity: 'success' });
      setIsCimVerified(true);
    } catch (error: any) {
      if (error.response?.status === 404) {
        setSnackbar({ open: true, message: 'CIM não encontrado. Iniciando novo cadastro.', severity: 'info' });
        setIsCimVerified(true);
        setExistingMemberId(null);
      } else {
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
        setSnackbar({ open: true, message: 'Cargo adicionado!', severity: 'success' });
      } catch (error) {
        setSnackbar({ open: true, message: 'Erro ao adicionar cargo.', severity: 'error' });
      }
    } else {
      const newHistoryItem: RoleHistoryResponse = {
        id: Date.now() * -1,
        role_id: Number(newRole.role_id),
        start_date: newRole.start_date,
        end_date: newRole.end_date || undefined,
        member_id: 0,
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
        setSnackbar({ open: true, message: 'Cargo removido!', severity: 'success' });
      } catch (error) {
        setSnackbar({ open: true, message: 'Erro ao remover cargo.', severity: 'error' });
      }
    } else {
      setRoleHistory(roleHistory.filter(h => h.id !== roleHistoryId));
    }
  };

  const handleSubmit = async (event?: React.FormEvent) => {
    if (event) event.preventDefault();
    
    // Validations
    const newErrors: { [key: string]: string } = {};
    if (formState.cpf && !validateCPF(formState.cpf)) newErrors.cpf = 'CPF inválido';
    if (formState.email && !validateEmail(formState.email)) newErrors.email = 'Email inválido';
    if (formState.password && formState.password !== formState.confirmPassword) {
      newErrors.password = 'As senhas não conferem';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSnackbar({ open: true, message: 'Corrija os erros do formulário.', severity: 'error' });
      return;
    }

    const sanitizedFormState = Object.entries(formState).reduce((acc, [key, value]) => {
      if (key === 'confirmPassword') return acc;
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
        await api.post(`/members/${existingMemberId}/associate`, {
          lodge_id: Number(sanitizedFormState.lodge_id),
          role_id: sanitizedFormState.role_id ? Number(sanitizedFormState.role_id) : undefined,
          status: sanitizedFormState.status,
          member_class: sanitizedFormState.member_class,
          member_update: memberData
        });
        setSnackbar({ open: true, message: 'Membro associado!', severity: 'success' });
      } else if (id) {
        await api.put(`/members/${id}`, memberData);
        setSnackbar({ open: true, message: 'Membro atualizado!', severity: 'success' });
      } else {
        const response = await api.post('/members', memberData);
        targetId = response.data.id;
        if (roleHistory.length > 0) {
          for (const role of roleHistory) {
            await api.post(`/members/${targetId}/roles`, {
              role_id: role.role_id,
              start_date: role.start_date,
              end_date: role.end_date || null
            });
          }
        }
        setSnackbar({ open: true, message: 'Membro criado!', severity: 'success' });
      }

      if (selectedFile && targetId) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        await api.post(`/members/${targetId}/photo`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      }

      setTimeout(() => navigate('/dashboard/management/members'), 1500);
    } catch (error: any) {
      console.error('Failed to save', error);
      const msg = error.response?.data?.detail || 'Erro ao salvar. Verifique dados.';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    }
  };

  // --- CIM SEARCH STEP ---
  if (!isCimVerified && !id) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper elevation={0} sx={{ 
            p: 4, textAlign: 'center', borderRadius: 2, 
            bgcolor: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}` 
        }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                <SearchIcon sx={{ fontSize: 60, color: COLORS.gold }} />
            </Box>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, color: COLORS.text, fontFamily: '"Playfair Display", serif' }}>
            Cadastro de Novo Membro
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, color: COLORS.textSecondary }}>
            Informe o CIM para iniciarmos. O sistema verificará se o irmão já possui cadastro.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Número do CIM"
              value={formState.cim}
              onChange={(e) => setFormState({ ...formState, cim: e.target.value })}
              fullWidth
              sx={customTextFieldStyle}
              placeholder="Ex: 12345"
              InputLabelProps={{ shrink: true }}
            />
            <Button 
              variant="contained" 
              onClick={handleCheckCim}
              disabled={cimCheckLoading}
              sx={{ px: 4, bgcolor: COLORS.gold, color: '#000', fontWeight: 'bold' }}
              startIcon={cimCheckLoading ? <CircularProgress size={20} /> : <SearchIcon />}
            >
              {cimCheckLoading ? '...' : 'Verificar'}
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  // --- MAIN FORM ---
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1600, margin: '0 auto' }}>
      
      {/* 1. HERO HEADER */}
      <Paper elevation={0} sx={{ 
        p: 0, mb: 3, borderRadius: 2, bgcolor: COLORS.cardBg, 
        border: `1px solid ${COLORS.cardBorder}`, overflow: 'hidden', position: 'relative'
      }}>
        <Box sx={{ height: 80, background: `linear-gradient(135deg, #0f172a 0%, #1e293b 100%)`, position: 'relative' }}>
            <Box sx={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        </Box>

        <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'center' : 'flex-end', px: 4, pb: 4, mt: -6 }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar
              variant="rounded"
              sx={{ 
                width: 150, height: 160, 
                border: `4px solid ${COLORS.cardBg}`, borderRadius: 4, 
                bgcolor: COLORS.background, color: COLORS.gold, fontSize: '3rem', 
                fontFamily: '"Playfair Display", serif', boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
              }}
              src={formState.profile_picture_path ? (formState.profile_picture_path.startsWith('blob:') ? formState.profile_picture_path : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${formState.profile_picture_path}`) : undefined}
            >
              {getInitials(formState.full_name || 'Novo Membro')}
            </Avatar>
            <IconButton 
                component="label" 
                sx={{ position: 'absolute', bottom: 5, right: 5, bgcolor: COLORS.gold, color: '#000', '&:hover': { bgcolor: COLORS.goldDark } }}
            >
                <PhotoCamera fontSize="small" />
                <input hidden accept="image/*" type="file" onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        setSelectedFile(file);
                        setFormState({ ...formState, profile_picture_path: URL.createObjectURL(file) });
                    }
                }} />
            </IconButton>
          </Box>
          
          <Box sx={{ ml: isMobile ? 0 : 3, mt: isMobile ? 2 : 0, textAlign: isMobile ? 'center' : 'left', flexGrow: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap', justifyContent: isMobile ? 'center' : 'flex-start' }}>
                <Typography variant="h4" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, color: COLORS.text }}>
                {formState.full_name || 'Novo Membro'}
                </Typography>
                <Chip label={formState.degree || 'Desconhecido'} size="small" sx={{ bgcolor: 'rgba(212, 175, 55, 0.15)', color: COLORS.gold, border: `1px solid ${COLORS.gold}`, fontWeight: 600 }} />
            </Box>
            <Typography variant="body1" sx={{ color: COLORS.textSecondary }}>
               CIM: {formState.cim} • {formState.email || 'Sem email'}
            </Typography>
          </Box>

          <Box sx={{ mt: isMobile ? 3 : 0, display: 'flex', gap: 2 }}>
             <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/dashboard/management/members')}
                sx={{ color: COLORS.textSecondary, borderColor: 'rgba(255,255,255,0.2)' }}
             >
                Voltar
             </Button>
             <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={() => handleSubmit()}
                sx={{ bgcolor: COLORS.gold, color: '#000', fontWeight: 700, px: 3, '&:hover': { bgcolor: COLORS.goldDark } }}
             >
                Salvar
             </Button>
          </Box>
        </Box>
      </Paper>

      {/* 2. TABS */}
      <Box sx={{ borderBottom: 1, borderColor: 'rgba(255,255,255,0.1)', mb: 2 }}>
        <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            variant={isMobile ? "scrollable" : "standard"}
            sx={{ '& .MuiTab-root': { color: 'rgba(255,255,255,0.5)', '&.Mui-selected': { color: COLORS.gold } }, '& .MuiTabs-indicator': { backgroundColor: COLORS.gold } }}
        >
          <Tab icon={<PersonIcon fontSize="small" />} iconPosition="start" label="Dados Pessoais" />
          <Tab icon={<HomeIcon fontSize="small" />} iconPosition="start" label="Endereço" />
          <Tab icon={<StarIcon fontSize="small" />} iconPosition="start" label="Vida Maçônica" />
          <Tab icon={<FamilyIcon fontSize="small" />} iconPosition="start" label="Família" />
          <Tab icon={<WorkIcon fontSize="small" />} iconPosition="start" label="Profissional" />
          <Tab icon={<LockIcon fontSize="small" />} iconPosition="start" label="Sistema" />
        </Tabs>
      </Box>

      {/* 3. PANELS */}
      
      {/* PERSONAL */}
      <TabPanel value={tabValue} index={0}>
        <Card sx={{ bgcolor: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 2 }}>
            <CardContent sx={{ p: 4 }}>
                <SectionTitle title="Informações Pessoais" icon={PersonIcon} />
                <Grid container spacing={2}>
                    <Grid item xs={12}><TextField label="Nome Completo" name="full_name" value={formState.full_name} onChange={handleChange} fullWidth sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} /></Grid>
                    <Grid item xs={12} md={6}><TextField label="CPF" name="cpf" value={formState.cpf} onChange={handleChange} fullWidth error={!!errors.cpf} helperText={errors.cpf} sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} /></Grid>
                    <Grid item xs={12} md={6}><TextField label="Email" name="email" value={formState.email} onChange={handleChange} fullWidth error={!!errors.email} helperText={errors.email} sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} /></Grid>
                    <Grid item xs={12} md={6}><TextField label="RG" name="identity_document" value={formState.identity_document} onChange={handleChange} fullWidth sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} /></Grid>
                    <Grid item xs={12} md={6}><TextField label="Data de Nascimento" type="date" name="birth_date" value={formState.birth_date || ''} onChange={handleChange} fullWidth sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} /></Grid>
                    <Grid item xs={12} md={6}><TextField label="Data de Casamento" type="date" name="marriage_date" value={formState.marriage_date || ''} onChange={handleChange} fullWidth sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} /></Grid>
                    <Grid item xs={12} md={6}><TextField label="Celular" name="phone" value={formState.phone} onChange={handleChange} fullWidth sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} /></Grid>
                    <Grid item xs={12} md={6}><TextField label="Naturalidade" name="place_of_birth" value={formState.place_of_birth} onChange={handleChange} fullWidth sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} /></Grid>
                    <Grid item xs={12} md={6}><TextField label="Religião" name="religion" value={formState.religion} onChange={handleChange} fullWidth sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} /></Grid>
                </Grid>
            </CardContent>
        </Card>
      </TabPanel>

      {/* ADDRESS */}
      <TabPanel value={tabValue} index={1}>
        <Card sx={{ bgcolor: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 2 }}>
            <CardContent sx={{ p: 4 }}>
                <SectionTitle title="Endereço Residencial" icon={HomeIcon} />
                <Grid container spacing={2}>
                    <Grid item xs={12} md={3}><TextField label="CEP" name="zip_code" value={formState.zip_code} onChange={handleChange} onBlur={handleCepBlur} fullWidth sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} /></Grid>
                    <Grid item xs={12} md={7}><TextField label="Logradouro" name="street_address" value={formState.street_address} onChange={handleChange} fullWidth sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} /></Grid>
                    <Grid item xs={12} md={2}><TextField label="Número" name="street_number" value={formState.street_number} onChange={handleChange} fullWidth sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} /></Grid>
                    <Grid item xs={12} md={6}><TextField label="Bairro" name="neighborhood" value={formState.neighborhood} onChange={handleChange} fullWidth sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} /></Grid>
                    <Grid item xs={12} md={4}><TextField label="Cidade" name="city" value={formState.city} onChange={handleChange} fullWidth sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} /></Grid>
                    <Grid item xs={12} md={2}><TextField label="UF" name="state" value={formState.state} onChange={handleChange} fullWidth sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} /></Grid>
                </Grid>
            </CardContent>
        </Card>
      </TabPanel>

      {/* MASONIC */}
      <TabPanel value={tabValue} index={2}>
        <Card sx={{ bgcolor: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 2, mb: 3 }}>
            <CardContent sx={{ p: 4 }}>
                <SectionTitle title="Dados do Maçom" icon={BadgeIcon} />
                <Grid container spacing={2}>
                     <Grid item xs={12} md={3}><TextField label="CIM" name="cim" value={formState.cim} onChange={handleChange} fullWidth sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} disabled={!!existingMemberId} /></Grid>
                     <Grid item xs={12} md={3}>
                        <FormControl fullWidth sx={customTextFieldStyle}>
                            <InputLabel shrink>Grau</InputLabel>
                            <Select name="degree" value={formState.degree} onChange={handleChange} sx={{color:'#fff','.MuiOutlinedInput-notchedOutline':{borderColor:'rgba(255,255,255,0.1)'}}}>
                                <MenuItem value={DegreeEnum.APPRENTICE}>Aprendiz</MenuItem>
                                <MenuItem value={DegreeEnum.FELLOW}>Companheiro</MenuItem>
                                <MenuItem value={DegreeEnum.MASTER}>Mestre</MenuItem>
                                <MenuItem value={DegreeEnum.INSTALLED_MASTER}>Mestre Instalado</MenuItem>
                            </Select>
                        </FormControl>
                     </Grid>
                     <Grid item xs={12} md={3}>
                        <FormControl fullWidth sx={customTextFieldStyle}>
                            <InputLabel shrink>Status</InputLabel>
                            <Select name="status" value={formState.status} onChange={handleChange} sx={{color:'#fff','.MuiOutlinedInput-notchedOutline':{borderColor:'rgba(255,255,255,0.1)'}}}>
                                <MenuItem value={MemberStatusEnum.ACTIVE}>Ativo</MenuItem>
                                <MenuItem value={MemberStatusEnum.INACTIVE}>Inativo</MenuItem>
                                <MenuItem value={MemberStatusEnum.DEMITTED}>Emérito</MenuItem>
                            </Select>
                        </FormControl>
                     </Grid>
                     <Grid item xs={12} md={3}>
                         <TextField label="Data Filiação" type="date" name="affiliation_date" value={formState.affiliation_date || ''} onChange={handleChange} fullWidth sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} />
                     </Grid>
                </Grid>
                
                <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" sx={{ color: COLORS.gold, mb: 2 }}>Datas Históricas</Typography>
                    <Grid container spacing={2}>
                         <Grid item xs={12} md={3}><TextField label="Iniciação" type="date" name="initiation_date" value={formState.initiation_date || ''} onChange={handleChange} fullWidth sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} /></Grid>
                         <Grid item xs={12} md={3}><TextField label="Elevação" type="date" name="elevation_date" value={formState.elevation_date || ''} onChange={handleChange} fullWidth sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} /></Grid>
                         <Grid item xs={12} md={3}><TextField label="Exaltação" type="date" name="exaltation_date" value={formState.exaltation_date || ''} onChange={handleChange} fullWidth sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} /></Grid>
                         <Grid item xs={12} md={3}><TextField label="Instalação" type="date" name="installation_date" value={formState.installation_date || ''} onChange={handleChange} fullWidth sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} /></Grid>
                    </Grid>
                </Box>
            </CardContent>
        </Card>

        {/* Roles History */}
        <Card sx={{ bgcolor: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 2 }}>
            <CardContent sx={{ p: 4 }}>
                <SectionTitle title="Histórico de Cargos" icon={HistoryIcon} />
                
                {/* Add Role Form */}
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 3, p: 2, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 1 }}>
                    <FormControl fullWidth size="small" sx={customTextFieldStyle}>
                        <InputLabel shrink>Cargo</InputLabel>
                        <Select value={newRole.role_id} onChange={(e) => setNewRole({...newRole, role_id: e.target.value})} sx={{color:'#fff','.MuiOutlinedInput-notchedOutline':{borderColor:'rgba(255,255,255,0.1)'}}}>
                            {roles.map(r => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <TextField label="Início" type="date" size="small" value={newRole.start_date} onChange={(e) => setNewRole({...newRole, start_date: e.target.value})} sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} />
                    <TextField label="Fim" type="date" size="small" value={newRole.end_date} onChange={(e) => setNewRole({...newRole, end_date: e.target.value})} sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} />
                    <Button variant="contained" onClick={handleAddRole} sx={{ height: 40, bgcolor: COLORS.gold, color: '#000', mt: '2px' }}>Adicionar</Button>
                </Box>

                <Box>
                    {roleHistory.map((role, i) => (
                        <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                             <Box>
                                 <Typography sx={{ color: '#fff', fontWeight: 600 }}>{roles.find(r => r.id === role.role_id)?.name || 'Cargo'}</Typography>
                                 <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
                                     {role.start_date ? new Date(role.start_date).toLocaleDateString() : ''} até {role.end_date ? new Date(role.end_date).toLocaleDateString() : 'Atual'}
                                 </Typography>
                             </Box>
                             <IconButton size="small" color="error" onClick={() => handleDeleteRole(role.id)}><DeleteIcon /></IconButton>
                        </Box>
                    ))}
                </Box>
            </CardContent>
        </Card>
      </TabPanel>

      {/* FAMILY */}
      <TabPanel value={tabValue} index={3}>
        <Card sx={{ bgcolor: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 2 }}>
            <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <SectionTitle title="Familiares" icon={FamilyIcon} />
                    <Button variant="outlined" startIcon={<AddIcon />} onClick={addFamilyMember} sx={{ color: COLORS.gold, borderColor: COLORS.gold }}>Adicionar</Button>
                </Box>
                <Grid container spacing={2}>
                    {familyMembers.map((member, index) => (
                         <Grid item xs={12} xl={6} key={index}>
                             <Paper sx={{ p: 2, bgcolor: COLORS.background, border: '1px solid rgba(255,255,255,0.1)' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="subtitle2" sx={{ color: COLORS.gold }}>Familiar #{index+1}</Typography>
                                    <IconButton size="small" color="error" onClick={() => removeFamilyMember(index)}><DeleteIcon fontSize="small" /></IconButton>
                                </Box>
                                <Grid container spacing={1}>
                                    <Grid item xs={8}><TextField label="Nome" size="small" value={member.full_name} onChange={(e) => handleFamilyMemberChange(index, 'full_name', e.target.value)} fullWidth sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} /></Grid>
                                    <Grid item xs={4}>
                                        <FormControl fullWidth size="small" sx={customTextFieldStyle}>
                                            <InputLabel shrink>Tipo</InputLabel>
                                            <Select value={member.relationship_type} onChange={(e) => handleFamilyMemberChange(index, 'relationship_type', e.target.value)} sx={{color:'#fff','.MuiOutlinedInput-notchedOutline':{borderColor:'rgba(255,255,255,0.1)'}}}>
                                                <MenuItem value={RelationshipTypeEnum.SPOUSE}>Esposa</MenuItem>
                                                <MenuItem value={RelationshipTypeEnum.SON}>Filho</MenuItem>
                                                <MenuItem value={RelationshipTypeEnum.DAUGHTER}>Filha</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={6}><TextField label="Nascimento" type="date" size="small" value={member.birth_date} onChange={(e) => handleFamilyMemberChange(index, 'birth_date', e.target.value)} fullWidth sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} /></Grid>
                                    <Grid item xs={6}><TextField label="Telefone" size="small" value={member.phone} onChange={(e) => handleFamilyMemberChange(index, 'phone', e.target.value)} fullWidth sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} /></Grid>
                                </Grid>
                             </Paper>
                         </Grid>
                    ))}
                </Grid>
            </CardContent>
        </Card>
      </TabPanel>
      
      {/* PROFESSIONAL */}
      <TabPanel value={tabValue} index={4}>
        <Card sx={{ bgcolor: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 2 }}>
            <CardContent sx={{ p: 4 }}>
                <SectionTitle title="Dados Profissionais" icon={WorkIcon} />
                <Grid container spacing={2}>
                     <Grid item xs={12} md={6}><TextField label="Formação" name="education_level" value={formState.education_level} onChange={handleChange} fullWidth sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} /></Grid>
                     <Grid item xs={12} md={6}><TextField label="Ocupação" name="occupation" value={formState.occupation} onChange={handleChange} fullWidth sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} /></Grid>
                     <Grid item xs={12}><TextField label="Empresa / Local" name="workplace" value={formState.workplace} onChange={handleChange} fullWidth sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} /></Grid>
                </Grid>
            </CardContent>
        </Card>
      </TabPanel>

      {/* SYSTEM / SECURITY */}
      <TabPanel value={tabValue} index={5}>
         <Card sx={{ bgcolor: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 2 }}>
            <CardContent sx={{ p: 4 }}>
                <SectionTitle title="Credenciais de Acesso" icon={LockIcon} />
                <Typography variant="body2" sx={{ color: COLORS.textSecondary, mb: 3 }}>
                    Defina uma senha caso o membro ainda não possua acesso ou precise de redefinição.
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}><TextField label="Nova Senha" type="password" name="password" value={formState.password} onChange={handleChange} fullWidth sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} /></Grid>
                    <Grid item xs={12} md={6}><TextField label="Confirmar Senha" type="password" name="confirmPassword" value={formState.confirmPassword} onChange={handleChange} fullWidth sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} /></Grid>
                </Grid>
            </CardContent>
         </Card>
      </TabPanel>

      {/* SNACKBAR */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity as any} onClose={() => setSnackbar({ ...snackbar, open: false })} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>

    </Box>
  );
};

export default MemberForm;