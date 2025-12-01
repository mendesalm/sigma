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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip
} from '@mui/material';
import { 
  Person, 
  PhotoCamera, 
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { MemberResponse, RelationshipTypeEnum } from '../../types';
import { formatCPF, formatPhone, formatCEP } from '../../utils/formatters';
import { validateCPF, validateEmail } from '../../utils/validators';
import { fetchAddressByCep } from '../../services/cepService';

interface FamilyMemberLocal {
  id?: number;
  full_name: string;
  relationship_type: string;
  birth_date: string;
  phone: string;
  email: string;
  is_deceased: boolean;
}

const textFieldStyle = {
  '& .MuiInputLabel-root': {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: 'primary.main',
  },
  '& .MuiInputBase-input': {
    color: '#fff',
  },
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.23)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    '&.Mui-focused fieldset': {
      borderColor: 'primary.main',
    },
  },
  mb: 2 // Add some bottom margin for spacing
};

const MeuCadastro: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
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
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ 
    open: false, 
    message: '', 
    severity: 'success' 
  });

  useEffect(() => {
    const fetchMyData = async () => {
      try {
        console.log('User context:', user);
        
        // Get my member ID from user context
        if (!user || !user.user_id) {
          setSnackbar({ open: true, message: 'Usuário não identificado.', severity: 'error' });
          setLoading(false);
          return;
        }

        // Try to fetch member data
        console.log('Fetching member data for ID:', user.user_id);
        const response = await api.get<MemberResponse>(`/members/${user.user_id}`);
        const memberData = response.data;
        
        console.log('Member data received:', memberData);
        
        setFormState({
          ...memberData,
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

        setLoading(false);
      } catch (error: any) {
        console.error('Failed to fetch member data', error);
        console.error('Error response:', error.response?.data);
        
        let errorMessage = 'Erro ao carregar dados.';
        
        if (error.response?.status === 404) {
          errorMessage = 'Membro não encontrado. Você pode não ter um cadastro como membro.';
        } else if (error.response?.status === 403) {
          errorMessage = 'Você não tem permissão para acessar estes dados.';
       } else if (error.response?.data?.detail) {
          errorMessage = error.response.data.detail;
        }
        
        setSnackbar({ open: true, message: errorMessage, severity: 'error' });
        setLoading(false);
      }
    };

    if (user) {
      fetchMyData();
    } else {
      setLoading(false);
    }
  }, [user]);

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
        setSnackbar({ open: true, message: 'CEP não encontrado.', severity: 'error' });
      }
    }
  };

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

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
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
    // Sanitize form data
    const sanitizedFormState = Object.entries(formState).reduce((acc, [key, value]) => {
      if (value === '' || value === null) {
        acc[key] = undefined;
      } else {
        acc[key] = value;
      }
      return acc;
    }, {} as any);

    const memberData = { 
      ...sanitizedFormState,
      family_members: familyMembers 
    };

    try {
      await api.put(`/members/${user?.user_id}`, memberData);

      // Upload profile picture if selected
      if (selectedFile && user?.user_id) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        await api.post(`/members/${user.user_id}/photo`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      setSnackbar({ open: true, message: 'Alterações salvas com sucesso!', severity: 'success' });
    } catch (error: any) {
      console.error('Failed to save changes', error);
      const errorMessage = error.response?.data?.detail || 'Erro ao salvar alterações.';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.current_password || !passwordData.new_password) {
      setSnackbar({ open: true, message: 'Preencha a senha atual e a nova senha.', severity: 'error' });
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
      console.error('Failed to change password', error);
      const errorMessage = error.response?.data?.detail || 'Erro ao alterar senha.';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <Typography>Carregando dados...</Typography>
        <Typography variant="caption" color="text.secondary">
          Aguarde enquanto buscamos suas informações
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Person sx={{ fontSize: 40, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff' }}>
            Meu Perfil
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            Visualize e edite seus dados pessoais e familiares
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} md={9}>
          {/* Dados Pessoais */}
          <Accordion defaultExpanded sx={{ bgcolor: '#1e293b', mb: 2, borderRadius: 1, border: '1px solid rgba(255,255,255,0.05)' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'primary.main' }} />}>
              <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>
                Dados Pessoais
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Avatar
                    variant="rounded"
                    sx={{ width: 120, height: 160, mb: 2, borderRadius: 2 }}
                    src={
                      formState.profile_picture_path
                        ? formState.profile_picture_path.startsWith('blob:')
                          ? formState.profile_picture_path
                          : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${formState.profile_picture_path}`
                        : undefined
                    }
                    alt={formState.full_name}
                  />
                  <Button
                    variant="outlined"
                    startIcon={<PhotoCamera />}
                    component="label"
                    size="small"
                  >
                    Alterar Foto
                    <input 
                      hidden 
                      accept="image/*" 
                      type="file" 
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          setSelectedFile(file);
                          const previewUrl = URL.createObjectURL(file);
                          setFormState({ ...formState, profile_picture_path: previewUrl });
                        }
                      }}
                    />
                  </Button>
                </Grid>
                <Grid item xs={12} md={9}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        label="Nome Completo"
                        value={formState.full_name}
                        onChange={handleChange}
                        name="full_name"
                        fullWidth
                        size="small"
                        sx={textFieldStyle}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="CPF"
                        value={formState.cpf}
                        onChange={handleChange}
                        name="cpf"
                        fullWidth
                        size="small"
                        error={!!errors.cpf}
                        helperText={errors.cpf}
                        sx={textFieldStyle}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Email"
                        value={formState.email}
                        onChange={handleChange}
                        name="email"
                        fullWidth
                        size="small"
                        error={!!errors.email}
                        helperText={errors.email}
                        sx={textFieldStyle}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Identidade (RG)"
                        value={formState.identity_document}
                        onChange={handleChange}
                        name="identity_document"
                        fullWidth
                        size="small"
                        sx={textFieldStyle}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Data de Nascimento"
                        type="date"
                        value={formState.birth_date || ''}
                        onChange={handleChange}
                        name="birth_date"
                        fullWidth
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        sx={textFieldStyle}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Data de Casamento"
                        type="date"
                        value={formState.marriage_date || ''}
                        onChange={handleChange}
                        name="marriage_date"
                        fullWidth
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        sx={textFieldStyle}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Telefone"
                        value={formState.phone}
                        onChange={handleChange}
                        name="phone"
                        fullWidth
                        size="small"
                        sx={textFieldStyle}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Familiares */}
          <Accordion sx={{ bgcolor: '#1e293b', mb: 2, borderRadius: 1, border: '1px solid rgba(255,255,255,0.05)' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'primary.main' }} />}>
              <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>
                Familiares
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {familyMembers.map((member, index) => (
                <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 1 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="Nome do Familiar"
                        value={member.full_name}
                        onChange={(e) => handleFamilyMemberChange(index, 'full_name', e.target.value)}
                        fullWidth
                        size="small"
                        sx={textFieldStyle}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <FormControl fullWidth size="small" sx={textFieldStyle}>
                        <InputLabel shrink>Parentesco</InputLabel>
                        <Select
                          value={member.relationship_type}
                          label="Parentesco"
                          onChange={(e) => handleFamilyMemberChange(index, 'relationship_type', e.target.value)}
                          notched
                        >
                          <MenuItem value={RelationshipTypeEnum.SPOUSE}>Esposa</MenuItem>
                          <MenuItem value={RelationshipTypeEnum.SON}>Filho</MenuItem>
                          <MenuItem value={RelationshipTypeEnum.DAUGHTER}>Filha</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <TextField
                        label="Data de Nasc."
                        type="date"
                        value={member.birth_date}
                        onChange={(e) => handleFamilyMemberChange(index, 'birth_date', e.target.value)}
                        fullWidth
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        sx={textFieldStyle}
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <TextField
                        label="Telefone"
                        value={member.phone}
                        onChange={(e) => handleFamilyMemberChange(index, 'phone', e.target.value)}
                        fullWidth
                        size="small"
                        sx={textFieldStyle}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <TextField
                        label="Email"
                        value={member.email}
                        onChange={(e) => handleFamilyMemberChange(index, 'email', e.target.value)}
                        fullWidth
                        size="small"
                        sx={textFieldStyle}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} md={1} sx={{ display: 'flex', justifyContent: 'center' }}>
                      <Tooltip title="Remover Familiar">
                        <IconButton onClick={() => removeFamilyMember(index)} color="error" size="small">
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Grid>
                  </Grid>
                </Box>
              ))}
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={addFamilyMember}
                  size="small"
                >
                  Adicionar Familiar
                </Button>
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Endereço */}
          <Accordion sx={{ bgcolor: '#1e293b', mb: 2, borderRadius: 1, border: '1px solid rgba(255,255,255,0.05)' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'primary.main' }} />}>
              <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>
                Endereço
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <TextField
                    label="CEP"
                    value={formState.zip_code}
                    onChange={handleChange}
                    onBlur={handleCepBlur}
                    name="zip_code"
                    fullWidth
                    size="small"
                    sx={textFieldStyle}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Logradouro"
                    value={formState.street_address}
                    onChange={handleChange}
                    name="street_address"
                    fullWidth
                    size="small"
                    sx={textFieldStyle}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    label="Número"
                    value={formState.street_number}
                    onChange={handleChange}
                    name="street_number"
                    fullWidth
                    size="small"
                    sx={textFieldStyle}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Bairro"
                    value={formState.neighborhood}
                    onChange={handleChange}
                    name="neighborhood"
                    fullWidth
                    size="small"
                    sx={textFieldStyle}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Cidade"
                    value={formState.city}
                    onChange={handleChange}
                    name="city"
                    fullWidth
                    size="small"
                    sx={textFieldStyle}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Dados Maçônicos (Read-only) */}
          <Accordion sx={{ bgcolor: '#1e293b', mb: 2, borderRadius: 1, border: '1px solid rgba(255,255,255,0.05)' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'primary.main' }} />}>
              <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>
                Dados Maçônicos
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Alert severity="info" sx={{ mb: 2 }}>
                Estes dados são gerenciados pela Secretaria e não podem ser editados diretamente.
              </Alert>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <TextField
                    label="CIM"
                    value={formState.cim}
                    fullWidth
                    size="small"
                    disabled
                    sx={textFieldStyle}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    label="Grau"
                    value={formState.degree}
                    fullWidth
                    size="small"
                    disabled
                    sx={textFieldStyle}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    label="Data de Iniciação"
                    type="date"
                    value={formState.initiation_date || ''}
                    fullWidth
                    size="small"
                    disabled
                    InputLabelProps={{ shrink: true }}
                    sx={textFieldStyle}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    label="Data de Elevação"
                    type="date"
                    value={formState.elevation_date || ''}
                    fullWidth
                    size="small"
                    disabled
                    InputLabelProps={{ shrink: true }}
                    sx={textFieldStyle}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    label="Data de Exaltação"
                    type="date"
                    value={formState.exaltation_date || ''}
                    fullWidth
                    size="small"
                    disabled
                    InputLabelProps={{ shrink: true }}
                    sx={textFieldStyle}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Dados Profissionais */}
          <Accordion sx={{ bgcolor: '#1e293b', mb: 2, borderRadius: 1, border: '1px solid rgba(255,255,255,0.05)' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'primary.main' }} />}>
              <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>
                Dados Profissionais
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Formação Acadêmica"
                    value={formState.education_level}
                    onChange={handleChange}
                    name="education_level"
                    fullWidth
                    size="small"
                    sx={textFieldStyle}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Ocupação Profissional"
                    value={formState.occupation}
                    onChange={handleChange}
                    name="occupation"
                    fullWidth
                    size="small"
                    sx={textFieldStyle}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Local de Trabalho"
                    value={formState.workplace}
                    onChange={handleChange}
                    name="workplace"
                    fullWidth
                    size="small"
                    sx={textFieldStyle}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Alterar Senha */}
          <Accordion sx={{ bgcolor: '#1e293b', mb: 2, borderRadius: 1, border: '1px solid rgba(255,255,255,0.05)' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'primary.main' }} />}>
              <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>
                Alterar Senha
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Senha Atual"
                    type="password"
                    value={passwordData.current_password}
                    onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                    fullWidth
                    size="small"
                    sx={textFieldStyle}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Nova Senha"
                    type="password"
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                    fullWidth
                    size="small"
                    sx={textFieldStyle}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Confirmar Nova Senha"
                    type="password"
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                    fullWidth
                    size="small"
                    sx={textFieldStyle}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    onClick={handleChangePassword}
                    fullWidth
                  >
                    Alterar Senha
                  </Button>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Save Button */}
          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveChanges}
              size="large"
            >
              Salvar Alterações
            </Button>
          </Box>
        </Grid>

        {/* Right Sidebar - Actions */}
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: '#1e293b', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)', mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#fff' }}>
                Ações
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleSaveChanges}
                  sx={{ bgcolor: 'primary.main' }}
                >
                  Salvar Alterações
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => window.location.reload()}
                  sx={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.3)' }}
                >
                  Voltar ao Dashboard
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ bgcolor: '#1e293b', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#fff' }}>
                Modificações no Meu Painel de Usuario
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                Você pode editar seus dados pessoais, informações de contato e familiares. Os dados maçônicos são gerenciados pela Secretaria.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MeuCadastro;
