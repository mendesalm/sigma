import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  TextField,
  Grid,
  Avatar,
  Button,
  Alert,
  Snackbar,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Paper,
  Chip,
  Fade,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  Person, 
  PhotoCamera, 
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Lock as LockIcon,
  Work as WorkIcon,
  School as SchoolIcon,
  Groups as FamilyIcon,
  Badge as BadgeIcon,
  Home as HomeIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Star as StarIcon,
  CalendarMonth as CalendarIcon,
  Fingerprint as FingerprintIcon
} from '@mui/icons-material';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { MemberResponse, RelationshipTypeEnum } from '../../types';
import { formatCPF, formatPhone, formatCEP } from '../../utils/formatters';
import { validateCPF, validateEmail } from '../../utils/validators';
import { fetchAddressByCep } from '../../services/cepService';

// --- Theme Constants ---
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
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
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

const MeuCadastro: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [loading, setLoading] = useState(true);
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
    degree: '',
    initiation_date: '',
    elevation_date: '',
    exaltation_date: '',
    installation_date: '',
    affiliation_date: '',
    regularization_date: '',
    philosophical_degree: '',
  });
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberLocal[]>([]);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({ 
    open: false, 
    message: '', 
    severity: 'success' 
  });

  // --- Handlers ---
  useEffect(() => {
    const fetchMyData = async () => {
      try {
        if (!user || !user.user_id) {
            setLoading(false);
            return; 
        }

        if (user.user_type === 'webmaster') {
          setLoading(false);
          return;
        }

        const response = await api.get<MemberResponse>(`/members/${user.user_id}`);
        const memberData = response.data;
        
        setFormState({ ...memberData });

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
        setLoading(false);
      } catch (error: any) {
        console.error('Failed to fetch data', error);
        setSnackbar({ open: true, message: 'Erro ao carregar dados do perfil.', severity: 'error' });
        setLoading(false);
      }
    };

    fetchMyData();
  }, [user]);

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
        }));
      } else {
        setSnackbar({ open: true, message: 'CEP não encontrado.', severity: 'warning' });
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

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = event.target;
    let formattedValue = value;

    if (typeof value === 'string') {
      if (name === 'cpf') formattedValue = formatCPF(value);
      if (name === 'phone') formattedValue = formatPhone(value);
      if (name === 'zip_code') formattedValue = formatCEP(value);
      validateField(name as string, formattedValue as string);
    }
    setFormState((prev: any) => ({ ...prev, [name as string]: formattedValue }));
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

  const handleSaveChanges = async () => {
    const sanitizedFormState = Object.entries(formState).reduce((acc, [key, value]) => {
      if (value === '' || value === null) {
        acc[key] = undefined;
      } else {
        acc[key] = value;
      }
      return acc;
    }, {} as any);

    const memberData = { ...sanitizedFormState, family_members: familyMembers };

    try {
      await api.put(`/members/${user?.user_id}`, memberData);
      if (selectedFile && user?.user_id) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        await api.post(`/members/${user.user_id}/photo`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      setSnackbar({ open: true, message: 'Perfil atualizado com sucesso!', severity: 'success' });
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.detail || 'Erro ao salvar alterações.', severity: 'error' });
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.current_password || !passwordData.new_password) {
      setSnackbar({ open: true, message: 'Preencha todos os campos de senha.', severity: 'warning' });
      return;
    }
    if (passwordData.new_password !== passwordData.confirm_password) {
      setSnackbar({ open: true, message: 'As senhas não coincidem.', severity: 'error' });
      return;
    }
    try {
      await api.post(`/members/${user?.user_id}/change-password`, {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });
      setSnackbar({ open: true, message: 'Senha alterada com sucesso!', severity: 'success' });
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error: any) {
      const msg = error.response?.data?.detail || 'Erro ao alterar senha. Verifique sua senha atual.';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    }
  };

  // --- Render Helpers ---
  const SectionTitle = ({ title, icon: Icon }: { title: string, icon: any }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, borderBottom: `1px solid ${COLORS.cardBorder}`, pb: 1 }}>
      <Icon sx={{ color: COLORS.gold, mr: 1.5, fontSize: 24 }} />
      <Typography variant="h6" sx={{ fontFamily: '"Playfair Display", serif', color: COLORS.text, fontWeight: 600 }}>
        {title}
      </Typography>
    </Box>
  );

  if (loading) return <Box sx={{ p: 4, textAlign: 'center', color: COLORS.textSecondary }}>Carregando perfil...</Box>;

  if (user?.user_type === 'webmaster') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info" sx={{ bgcolor: COLORS.cardBg, color: COLORS.text, border: `1px solid ${COLORS.blue}` }}>
          <Typography variant="subtitle1" fontWeight="bold">Perfil Administrativo</Typography>
          <Typography variant="body2">Esta página é para membros. Webmasters devem usar o menu "Minha Loja".</Typography>
        </Alert>
      </Box>
    );
  }

  // Determine Initials for Avatar
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1600, margin: '0 auto' }}>
      
      {/* 1. Hero / Header Section */}
      <Paper elevation={0} sx={{ 
        p: 0, 
        mb: 3, 
        borderRadius: 2, 
        bgcolor: COLORS.cardBg, 
        border: `1px solid ${COLORS.cardBorder}`,
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Banner Background */}
        <Box sx={{ 
          height: 80, 
          background: `linear-gradient(135deg, #0f172a 0%, #1e293b 100%)`, 
          position: 'relative' 
        }}>
            <Box sx={{ 
                position: 'absolute', 
                top: 0, left: 0, right: 0, bottom: 0, 
                opacity: 0.1, 
                backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', 
                backgroundSize: '24px 24px' 
            }} />
        </Box>

        {/* Profile Info Row */}
        <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'center' : 'flex-end', px: 4, pb: 4, mt: -6 }}>
          {/* Avatar */}
          <Box sx={{ position: 'relative' }}>
            <Avatar
              variant="rounded"
              sx={{ 
                width: 100, 
                height: 120, 
                border: `4px solid ${COLORS.cardBg}`, 
                borderRadius: 4,
                bgcolor: COLORS.background,
                color: COLORS.gold,
                fontSize: '3rem',
                fontFamily: '"Playfair Display", serif',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
              }}
              src={formState.profile_picture_path ? (formState.profile_picture_path.startsWith('blob:') ? formState.profile_picture_path : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${formState.profile_picture_path}`) : undefined}
            >
              {getInitials(formState.full_name || user?.name || '')}
            </Avatar>
            <IconButton 
                component="label" 
                sx={{ 
                    position: 'absolute', 
                    bottom: 5, 
                    right: 5, 
                    bgcolor: COLORS.gold, 
                    color: '#000',
                    '&:hover': { bgcolor: COLORS.goldDark }
                }}
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
          
          {/* Text Info */}
          <Box sx={{ ml: isMobile ? 0 : 3, mt: isMobile ? 2 : 0, textAlign: isMobile ? 'center' : 'left', flexGrow: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap', justifyContent: isMobile ? 'center' : 'flex-start' }}>
                <Typography variant="h4" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, color: COLORS.text }}>
                {formState.full_name || 'Irmão Desconhecido'}
                </Typography>
                {formState.degree && (
                    <Chip 
                        label={formState.degree} 
                        size="small" 
                        sx={{ bgcolor: 'rgba(212, 175, 55, 0.15)', color: COLORS.gold, border: `1px solid ${COLORS.gold}`, fontWeight: 600 }} 
                    />
                )}
            </Box>
            <Typography variant="body1" sx={{ color: COLORS.textSecondary, display: 'flex', alignItems: 'center', gap: 2, justifyContent: isMobile ? 'center' : 'flex-start' }}>
               <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><BadgeIcon fontSize="small" sx={{ opacity: 0.7 }} /> CIM: {formState.cim || 'N/A'}</span>
               <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><EmailIcon fontSize="small" sx={{ opacity: 0.7 }} /> {formState.email}</span>
            </Typography>
          </Box>

          {/* Actions */}
          <Box sx={{ mt: isMobile ? 3 : 0 }}>
             <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveChanges}
                sx={{ 
                    bgcolor: COLORS.gold, 
                    color: '#000', 
                    fontWeight: 700,
                    px: 3,
                    '&:hover': { bgcolor: COLORS.goldDark }
                }}
             >
                Salvar Dados
             </Button>
          </Box>
        </Box>
      </Paper>

      {/* 2. Tabs Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'rgba(255,255,255,0.1)', mb: 2 }}>
        <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="profile tabs"
            variant={isMobile ? "scrollable" : "standard"}
            scrollButtons="auto"
            sx={{
                '& .MuiTab-root': {
                    color: 'rgba(255,255,255,0.5)',
                    fontFamily: '"Inter", sans-serif',
                    textTransform: 'none',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    minHeight: 48,
                    '&.Mui-selected': { color: COLORS.gold }
                },
                '& .MuiTabs-indicator': { backgroundColor: COLORS.gold }
            }}
        >
          <Tab icon={<Person fontSize="small" />} iconPosition="start" label="Dados Pessoais" />
          <Tab icon={<HomeIcon fontSize="small" />} iconPosition="start" label="Endereço" />
          <Tab icon={<StarIcon fontSize="small" />} iconPosition="start" label="Vida Maçônica" />
          <Tab icon={<FamilyIcon fontSize="small" />} iconPosition="start" label="Família" />
          <Tab icon={<WorkIcon fontSize="small" />} iconPosition="start" label="Profissional" />
          <Tab icon={<LockIcon fontSize="small" />} iconPosition="start" label="Segurança" />
        </Tabs>
      </Box>

      {/* 3. Tab Content Panels */}
      
      {/* Tab 0: Dados Pessoais */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
                <Card sx={{ bgcolor: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 2 }}>
                    <CardContent sx={{ p: 4 }}>
                        <SectionTitle title="Informações Pessoais" icon={Person} />
                        <Grid container spacing={2}>
                            <Grid item xs={12}><TextField label="Nome Completo" name="full_name" value={formState.full_name} onChange={handleChange} fullWidth sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} /></Grid>
                            <Grid item xs={12} md={6}><TextField label="CPF" name="cpf" value={formState.cpf} onChange={handleChange} fullWidth error={!!errors.cpf} helperText={errors.cpf} sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} /></Grid>
                            <Grid item xs={12} md={6}><TextField label="RG/Identidade" name="identity_document" value={formState.identity_document} onChange={handleChange} fullWidth sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} /></Grid>
                            <Grid item xs={12} md={6}><TextField label="Data de Nascimento" type="date" name="birth_date" value={formState.birth_date || ''} onChange={handleChange} fullWidth sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} /></Grid>
                            <Grid item xs={12} md={6}><TextField label="Data de Casamento" type="date" name="marriage_date" value={formState.marriage_date || ''} onChange={handleChange} fullWidth sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} /></Grid>
                            <Grid item xs={12} md={6}><TextField label="Nacionalidade" name="nationality" value={formState.nationality} onChange={handleChange} fullWidth sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} /></Grid>
                            <Grid item xs={12} md={6}><TextField label="Naturalidade" name="place_of_birth" value={formState.place_of_birth} onChange={handleChange} fullWidth sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} /></Grid>
                            <Grid item xs={12}><TextField label="Religião / Crença" name="religion" value={formState.religion} onChange={handleChange} fullWidth sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} /></Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} md={4}>
                <Card sx={{ bgcolor: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 2 }}>
                    <CardContent sx={{ p: 4 }}>
                        <SectionTitle title="Contato" icon={PhoneIcon} />
                        <TextField label="Email Pessoal" name="email" value={formState.email} onChange={handleChange} fullWidth error={!!errors.email} helperText={errors.email} sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} />
                        <TextField label="Telefone / Celular" name="phone" value={formState.phone} onChange={handleChange} fullWidth sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} />
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
      </TabPanel>

      {/* Tab 1: Endereço */}
      <TabPanel value={tabValue} index={1}>
        <Card sx={{ bgcolor: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 2, maxWidth: 800 }}>
            <CardContent sx={{ p: 4 }}>
                <SectionTitle title="Endereço Residencial" icon={HomeIcon} />
                <Grid container spacing={2}>
                    <Grid item xs={12} md={4}><TextField label="CEP" name="zip_code" value={formState.zip_code} onChange={handleChange} onBlur={handleCepBlur} fullWidth sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} /></Grid>
                    <Grid item xs={12} md={8}><TextField label="Logradouro" name="street_address" value={formState.street_address} onChange={handleChange} fullWidth sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} /></Grid>
                    <Grid item xs={12} md={4}><TextField label="Número" name="street_number" value={formState.street_number} onChange={handleChange} fullWidth sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} /></Grid>
                    <Grid item xs={12} md={8}><TextField label="Bairro" name="neighborhood" value={formState.neighborhood} onChange={handleChange} fullWidth sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} /></Grid>
                    <Grid item xs={12} md={12}><TextField label="Cidade / UF" name="city" value={formState.city} onChange={handleChange} fullWidth sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} /></Grid>
                </Grid>
            </CardContent>
        </Card>
      </TabPanel>

      {/* Tab 2: Vida Maçônica */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
            {/* Timeline / Dates */}
            <Grid item xs={12} md={8}>
                <Card sx={{ bgcolor: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 2 }}>
                    <CardContent sx={{ p: 4 }}>
                        <SectionTitle title="Datas Históricas" icon={CalendarIcon} />
                        <Alert severity="info" sx={{ mb: 3, bgcolor: 'rgba(14, 165, 233, 0.1)', color: '#fff', border: `1px solid ${COLORS.blue}` }}>
                            Estes dados são gerenciados pela Secretaria. Contate o secretário em caso de divergências.
                        </Alert>
                        <Grid container spacing={3}>
                            {[
                                { label: "Iniciação", date: formState.initiation_date, color: COLORS.gold },
                                { label: "Elevação", date: formState.elevation_date, color: COLORS.goldLight },
                                { label: "Exaltação", date: formState.exaltation_date, color: COLORS.text },
                                { label: "Instalação", date: formState.installation_date, color: COLORS.blue }
                            ].map((d, i) => {
                                let formattedDate = '-';
                                if (d.date) {
                                    const parts = d.date.toString().split('-');
                                    if (parts.length === 3) {
                                        formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
                                    }
                                }

                                return (
                                    <Grid item xs={12} sm={6} md={3} key={i}>
                                        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: COLORS.background, border: `1px solid ${d.color}`, borderRadius: 2 }}>
                                            <Typography variant="overline" sx={{ color: d.color, fontWeight: 700 }}>{d.label}</Typography>
                                            <Typography variant="h6" sx={{ color: '#fff', mt: 1 }}>
                                                {formattedDate}
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                )
                            })}
                        </Grid>
                    </CardContent>
                </Card>
            </Grid>
            {/* Details */}
            <Grid item xs={12} md={4}>
                <Card sx={{ bgcolor: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 2 }}>
                    <CardContent sx={{ p: 4 }}>
                         <SectionTitle title="Registro" icon={FingerprintIcon} />
                         <TextField label="CIM" value={formState.cim} fullWidth disabled sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} />
                         <TextField label="Grau Atual" value={formState.degree} fullWidth disabled sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} />
                         <TextField 
                            label="Filiação" 
                            value={(() => {
                                if (!formState.affiliation_date) return '';
                                const parts = formState.affiliation_date.toString().split('-');
                                return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : formState.affiliation_date;
                            })()} 
                            fullWidth 
                            disabled 
                            sx={customTextFieldStyle} 
                            InputLabelProps={{ shrink: true }} 
                         />
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
      </TabPanel>

      {/* Tab 3: Família */}
      <TabPanel value={tabValue} index={3}>
        <Card sx={{ bgcolor: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 2 }}>
            <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <SectionTitle title="Membros da Família" icon={FamilyIcon} />
                    <Button variant="outlined" startIcon={<AddIcon />} onClick={addFamilyMember} sx={{ color: COLORS.gold, borderColor: COLORS.gold }}>
                        Adicionar
                    </Button>
                </Box>
                
                {familyMembers.length === 0 && (
                    <Typography sx={{ color: COLORS.textSecondary, textAlign: 'center', py: 4 }}>Nenhum familiar cadastrado.</Typography>
                )}

                <Grid container spacing={2}>
                    {familyMembers.map((member, index) => (
                         <Grid item xs={12} xl={6} key={index}>
                             <Paper sx={{ p: 2, bgcolor: COLORS.background, border: '1px solid rgba(255,255,255,0.1)' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                    <Typography variant="subtitle2" sx={{ color: COLORS.gold, fontWeight: 700 }}>Familiar #{index + 1}</Typography>
                                    <IconButton size="small" color="error" onClick={() => removeFamilyMember(index)}><DeleteIcon fontSize="small" /></IconButton>
                                </Box>
                                <Grid container spacing={2}>
                                    <Grid item xs={8}><TextField label="Nome" value={member.full_name} onChange={(e) => handleFamilyMemberChange(index, 'full_name', e.target.value)} fullWidth size="small" sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} /></Grid>
                                    <Grid item xs={4}>
                                        <FormControl fullWidth size="small" sx={customTextFieldStyle}>
                                            <InputLabel shrink sx={{color: 'rgba(255,255,255,0.5)'}}>Parentesco</InputLabel>
                                            <Select value={member.relationship_type} label="Parentesco" onChange={(e) => handleFamilyMemberChange(index, 'relationship_type', e.target.value)} sx={{ color: '#fff', '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' } }}>
                                                <MenuItem value={RelationshipTypeEnum.SPOUSE}>Esposa</MenuItem>
                                                <MenuItem value={RelationshipTypeEnum.SON}>Filho</MenuItem>
                                                <MenuItem value={RelationshipTypeEnum.DAUGHTER}>Filha</MenuItem>
                                                <MenuItem value="Father">Pai</MenuItem>
                                                <MenuItem value="Mother">Mãe</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={4}><TextField label="Nascimento" type="date" value={member.birth_date} onChange={(e) => handleFamilyMemberChange(index, 'birth_date', e.target.value)} fullWidth size="small" sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} /></Grid>
                                    <Grid item xs={8}><TextField label="Telefone" value={member.phone} onChange={(e) => handleFamilyMemberChange(index, 'phone', e.target.value)} fullWidth size="small" sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} /></Grid>
                                </Grid>
                             </Paper>
                         </Grid>
                    ))}
                </Grid>
            </CardContent>
        </Card>
      </TabPanel>

      {/* Tab 4: Profissional */}
      <TabPanel value={tabValue} index={4}>
        <Card sx={{ bgcolor: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 2, maxWidth: 800 }}>
             <CardContent sx={{ p: 4 }}>
                <SectionTitle title="Dados Profissionais e Acadêmicos" icon={SchoolIcon} />
                <Grid container spacing={2}>
                     <Grid item xs={12} md={6}><TextField label="Formação Acadêmica" name="education_level" value={formState.education_level} onChange={handleChange} fullWidth sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} /></Grid>
                     <Grid item xs={12} md={6}><TextField label="Ocupação" name="occupation" value={formState.occupation} onChange={handleChange} fullWidth sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} /></Grid>
                     <Grid item xs={12}><TextField label="Local de Trabalho" name="workplace" value={formState.workplace} onChange={handleChange} fullWidth sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} /></Grid>
                </Grid>
             </CardContent>
        </Card>
      </TabPanel>

      {/* Tab 5: Segurança */}
      <TabPanel value={tabValue} index={5}>
         <Card sx={{ bgcolor: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 2, maxWidth: 600 }}>
             <CardContent sx={{ p: 4 }}>
                <SectionTitle title="Alteração de Senha" icon={LockIcon} />
                <TextField label="Senha Atual" type="password" value={passwordData.current_password} onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })} fullWidth sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} />
                <TextField label="Nova Senha" type="password" value={passwordData.new_password} onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })} fullWidth sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} />
                <TextField label="Confirmar Nova Senha" type="password" value={passwordData.confirm_password} onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })} fullWidth sx={customTextFieldStyle} InputLabelProps={{ shrink: true }} />
                <Button variant="contained" fullWidth onClick={handleChangePassword} sx={{ mt: 2, bgcolor: COLORS.gold, color: '#000', fontWeight: 'bold' }}>
                    Atualizar Senha
                </Button>
             </CardContent>
         </Card>
      </TabPanel>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity as any} onClose={() => setSnackbar({ ...snackbar, open: false })} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MeuCadastro;
