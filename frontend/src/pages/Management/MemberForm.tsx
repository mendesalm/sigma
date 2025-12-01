
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Button, Container, TextField, Typography, Select, MenuItem, FormControl, 
  InputLabel, Grid, SelectChangeEvent, Paper, Box, Snackbar, Alert, 
  Avatar, Stack, Checkbox, FormControlLabel, Tooltip, IconButton, CircularProgress
} from '@mui/material';
import { PhotoCamera, Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon } from '@mui/icons-material';
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

const MemberForm: React.FC = () => {
  const { user } = useAuth();
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

  const renderSectionTitle = (title: string) => (
    <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2, color: 'primary.main' }}>
      {title}
    </Typography>
  );

  // --- RENDER CIM CHECK STEP ---
  if (!isCimVerified && !id) {
    return (
      <Container maxWidth="sm">
        <Paper sx={{ p: 4, mt: 8, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom color="primary">
            Cadastro de Membro
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Informe o CIM para iniciar o cadastro. O sistema verificará se o membro já existe.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="CIM"
              value={formState.cim}
              onChange={(e) => setFormState({ ...formState, cim: e.target.value })}
              fullWidth
              variant="outlined"
            />
            <Button 
              variant="contained" 
              onClick={handleCheckCim}
              disabled={cimCheckLoading}
              startIcon={cimCheckLoading ? <CircularProgress size={20} /> : <SearchIcon />}
            >
              Verificar
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom color="primary">
          {id ? 'Editar Membro' : (existingMemberId ? 'Associar Membro Existente' : 'Novo Membro')}
        </Typography>
      </Box>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Main Content Column */}
          <Grid item xs={12} md={9}>
            
            {/* DADOS PESSOAIS */}
            <Paper sx={{ p: 2, mb: 2 }}>
              {renderSectionTitle('Dados Pessoais')}
              <Grid container spacing={2}>
                <Grid item xs={12} md={3} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Avatar
                    sx={{ width: 120, height: 120, mb: 2 }}
                    src={formState.profile_picture_path}
                    alt={formState.full_name}
                  />
                  <Button
                    variant="outlined"
                    startIcon={<PhotoCamera />}
                    component="label"
                    size="small"
                    sx={{ fontSize: '0.75rem' }}
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
                          // Create a preview URL
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
                        name="full_name"
                        label="Nome Completo"
                        value={formState.full_name}
                        onChange={handleChange}
                        fullWidth
                        required
                        variant="outlined"
                        size="small"
                        InputProps={{ style: { fontSize: '0.9rem' } }}
                        InputLabelProps={{ style: { fontSize: '0.9rem' } }}
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
                        size="small"
                        InputProps={{ style: { fontSize: '0.9rem' } }}
                        InputLabelProps={{ style: { fontSize: '0.9rem' } }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        name="email"
                        label="Email"
                        value={formState.email}
                        onChange={handleChange}
                        fullWidth
                        required
                        error={!!errors.email}
                        helperText={errors.email}
                        variant="outlined"
                        size="small"
                        InputProps={{ style: { fontSize: '0.9rem' } }}
                        InputLabelProps={{ style: { fontSize: '0.9rem' } }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        name="identity_document"
                        label="Identidade (RG)"
                        value={formState.identity_document}
                        onChange={handleChange}
                        fullWidth
                        variant="outlined"
                        size="small"
                        InputProps={{ style: { fontSize: '0.9rem' } }}
                        InputLabelProps={{ style: { fontSize: '0.9rem' } }}
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
                        InputLabelProps={{ shrink: true, style: { fontSize: '0.9rem' } }}
                        variant="outlined"
                        size="small"
                        InputProps={{ style: { fontSize: '0.9rem' } }}
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
                        InputLabelProps={{ shrink: true, style: { fontSize: '0.9rem' } }}
                        variant="outlined"
                        size="small"
                        InputProps={{ style: { fontSize: '0.9rem' } }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        name="phone"
                        label="Telefone"
                        value={formState.phone}
                        onChange={handleChange}
                        fullWidth
                        variant="outlined"
                        size="small"
                        InputProps={{ style: { fontSize: '0.9rem' } }}
                        InputLabelProps={{ style: { fontSize: '0.9rem' } }}
                      />
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Paper>

            {/* INFORMAÇÕES DE ACESSO */}
            <Paper sx={{ p: 2, mb: 2 }}>
              {renderSectionTitle('Informações de Acesso')}
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth variant="outlined" size="small">
                    <InputLabel sx={{ fontSize: '0.9rem' }}>Credencial</InputLabel>
                    <Select
                      value="Webmaster" // Placeholder
                      label="Credencial"
                      disabled
                      sx={{ fontSize: '0.9rem' }}
                    >
                      <MenuItem value="Webmaster">Webmaster</MenuItem>
                      <MenuItem value="Admin">Admin</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                   <FormControl fullWidth variant="outlined" size="small">
                    <InputLabel sx={{ fontSize: '0.9rem' }}>Status na Loja</InputLabel>
                    <Select
                      name="status"
                      value={formState.status}
                      label="Status na Loja"
                      onChange={handleChange}
                      sx={{ fontSize: '0.9rem' }}
                    >
                      <MenuItem value={MemberStatusEnum.ACTIVE}>Ativo</MenuItem>
                      <MenuItem value={MemberStatusEnum.INACTIVE}>Inativo</MenuItem>
                      <MenuItem value={MemberStatusEnum.DISABLED}>Desativado (Falecido)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                   <FormControl fullWidth variant="outlined" size="small">
                    <InputLabel sx={{ fontSize: '0.9rem' }}>Classe</InputLabel>
                    <Select
                      name="member_class"
                      value={formState.member_class}
                      label="Classe"
                      onChange={handleChange}
                      sx={{ fontSize: '0.9rem' }}
                    >
                      <MenuItem value={MemberClassEnum.REGULAR}>Regular</MenuItem>
                      <MenuItem value={MemberClassEnum.IRREGULAR}>Irregular</MenuItem>
                      <MenuItem value={MemberClassEnum.EMERITUS}>Emérito</MenuItem>
                      <MenuItem value={MemberClassEnum.REMITTED}>Remido</MenuItem>
                      <MenuItem value={MemberClassEnum.HONORARY}>Honorário</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                {!id && !existingMemberId ? (
                  <Grid item xs={12}>
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
                      InputProps={{ style: { fontSize: '0.9rem' } }}
                      InputLabelProps={{ style: { fontSize: '0.9rem' } }}
                    />
                  </Grid>
                ) : (
                   <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 1, mb: 1 }}>
                      Alterar Senha (Opcional)
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          name="password"
                          label="Nova Senha"
                          type="password"
                          value={formState.password || ''}
                          onChange={handleChange}
                          fullWidth
                          variant="outlined"
                          size="small"
                          helperText="Deixe em branco para manter a atual"
                          InputProps={{ style: { fontSize: '0.9rem' } }}
                          InputLabelProps={{ style: { fontSize: '0.9rem' } }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
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
                          helperText={formState.password && formState.password !== formState.confirmPassword ? "As senhas não conferem" : ""}
                          InputProps={{ style: { fontSize: '0.9rem' } }}
                          InputLabelProps={{ style: { fontSize: '0.9rem' } }}
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                )}
              </Grid>
            </Paper>

            {/* FAMILIARES */}
            <Paper sx={{ p: 2, mb: 2 }}>
              {renderSectionTitle('Familiares')}
              {familyMembers.map((member, index) => (
                <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #333', borderRadius: 1 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="Nome do Familiar"
                        value={member.full_name}
                        onChange={(e) => handleFamilyMemberChange(index, 'full_name', e.target.value)}
                        fullWidth
                        size="small"
                        variant="outlined"
                        InputProps={{ style: { fontSize: '0.9rem' } }}
                        InputLabelProps={{ style: { fontSize: '0.9rem' } }}
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <FormControl fullWidth size="small">
                        <InputLabel sx={{ fontSize: '0.9rem' }}>Parentesco</InputLabel>
                        <Select
                          value={member.relationship_type}
                          label="Parentesco"
                          onChange={(e) => handleFamilyMemberChange(index, 'relationship_type', e.target.value)}
                          sx={{ fontSize: '0.9rem' }}
                        >
                          <MenuItem value={RelationshipTypeEnum.SPOUSE}>Cônjuge</MenuItem>
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
                        InputLabelProps={{ shrink: true, style: { fontSize: '0.9rem' } }}
                        variant="outlined"
                        InputProps={{ style: { fontSize: '0.9rem' } }}
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <TextField
                        label="Telefone"
                        value={member.phone}
                        onChange={(e) => handleFamilyMemberChange(index, 'phone', e.target.value)}
                        fullWidth
                        size="small"
                        variant="outlined"
                        InputProps={{ style: { fontSize: '0.9rem' } }}
                        InputLabelProps={{ style: { fontSize: '0.9rem' } }}
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <TextField
                        label="Email"
                        value={member.email}
                        onChange={(e) => handleFamilyMemberChange(index, 'email', e.target.value)}
                        fullWidth
                        size="small"
                        variant="outlined"
                        InputProps={{ style: { fontSize: '0.9rem' } }}
                        InputLabelProps={{ style: { fontSize: '0.9rem' } }}
                      />
                    </Grid>
                    <Grid item xs={12} md={1} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={member.is_deceased}
                            onChange={(e) => handleFamilyMemberChange(index, 'is_deceased', e.target.checked)}
                            size="small"
                          />
                        }
                        label="Falecido?"
                        sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.8rem' } }}
                      />
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
                <Tooltip title="Adicionar Familiar">
                  <IconButton onClick={addFamilyMember} color="secondary" size="large">
                    <AddIcon fontSize="large" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Paper>

            {/* ENDEREÇO */}
            <Paper sx={{ p: 2, mb: 2 }}>
              {renderSectionTitle('Endereço')}
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
                    size="small"
                    InputProps={{ style: { fontSize: '0.9rem' } }}
                    InputLabelProps={{ style: { fontSize: '0.9rem' } }}
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
                    size="small"
                    InputProps={{ style: { fontSize: '0.9rem' } }}
                    InputLabelProps={{ style: { fontSize: '0.9rem' } }}
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
                    size="small"
                    InputProps={{ style: { fontSize: '0.9rem' } }}
                    InputLabelProps={{ style: { fontSize: '0.9rem' } }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="neighborhood"
                    label="Bairro"
                    value={formState.neighborhood}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
                    size="small"
                    InputProps={{ style: { fontSize: '0.9rem' } }}
                    InputLabelProps={{ style: { fontSize: '0.9rem' } }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="city"
                    label="Cidade"
                    value={formState.city}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
                    size="small"
                    InputProps={{ style: { fontSize: '0.9rem' } }}
                    InputLabelProps={{ style: { fontSize: '0.9rem' } }}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* DADOS PROFISSIONAIS */}
            <Paper sx={{ p: 2, mb: 2 }}>
              {renderSectionTitle('Dados Profissionais')}
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    name="education_level"
                    label="Formação Acadêmica"
                    value={formState.education_level}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
                    size="small"
                    InputProps={{ style: { fontSize: '0.9rem' } }}
                    InputLabelProps={{ style: { fontSize: '0.9rem' } }}
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
                    size="small"
                    InputProps={{ style: { fontSize: '0.9rem' } }}
                    InputLabelProps={{ style: { fontSize: '0.9rem' } }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    name="workplace"
                    label="Local de Trabalho"
                    value={formState.workplace}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
                    size="small"
                    InputProps={{ style: { fontSize: '0.9rem' } }}
                    InputLabelProps={{ style: { fontSize: '0.9rem' } }}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* DADOS MAÇÔNICOS */}
            <Paper sx={{ p: 2, mb: 2 }}>
              {renderSectionTitle('Dados Maçônicos')}
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <TextField
                    name="cim"
                    label="CIM"
                    value={formState.cim}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
                    size="small"
                    InputProps={{ style: { fontSize: '0.9rem' } }}
                    InputLabelProps={{ style: { fontSize: '0.9rem' } }}
                    disabled={!!existingMemberId} // Disable CIM editing if imported
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth variant="outlined" size="small">
                    <InputLabel sx={{ fontSize: '0.9rem' }}>Grau</InputLabel>
                    <Select
                      name="degree"
                      value={formState.degree}
                      label="Grau"
                      onChange={handleChange}
                      sx={{ fontSize: '0.9rem' }}
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
                    variant="outlined"
                    size="small"
                    InputProps={{ 
                      readOnly: true,
                      style: { fontSize: '0.9rem', backgroundColor: 'rgba(255, 255, 255, 0.05)' } 
                    }}
                    InputLabelProps={{ style: { fontSize: '0.9rem' } }}
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
                    InputLabelProps={{ shrink: true, style: { fontSize: '0.9rem' } }}
                    variant="outlined"
                    size="small"
                    InputProps={{ style: { fontSize: '0.9rem' } }}
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
                    InputLabelProps={{ shrink: true, style: { fontSize: '0.9rem' } }}
                    variant="outlined"
                    size="small"
                    InputProps={{ style: { fontSize: '0.9rem' } }}
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
                    InputLabelProps={{ shrink: true, style: { fontSize: '0.9rem' } }}
                    variant="outlined"
                    size="small"
                    InputProps={{ style: { fontSize: '0.9rem' } }}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* ADICIONAR NOVO CARGO (ROLE HISTORY) */}
            <Paper sx={{ p: 2, mb: 2 }}>
              {renderSectionTitle('Adicionar Novo Cargo')}
              <Box sx={{ p: 2, border: '1px solid #333', borderRadius: 1, mb: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel sx={{ fontSize: '0.9rem' }}>Cargo</InputLabel>
                        <Select
                          label="Cargo"
                          value={newRole.role_id}
                          onChange={(e) => setNewRole({ ...newRole, role_id: e.target.value })}
                          sx={{ fontSize: '0.9rem' }}
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
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="Data de Início"
                        type="date"
                        fullWidth
                        size="small"
                        InputLabelProps={{ shrink: true, style: { fontSize: '0.9rem' } }}
                        variant="outlined"
                        value={newRole.start_date}
                        onChange={(e) => setNewRole({ ...newRole, start_date: e.target.value })}
                        InputProps={{ style: { fontSize: '0.9rem' } }}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="Data de Término (opcional)"
                        type="date"
                        fullWidth
                        size="small"
                        InputLabelProps={{ shrink: true, style: { fontSize: '0.9rem' } }}
                        variant="outlined"
                        value={newRole.end_date}
                        onChange={(e) => setNewRole({ ...newRole, end_date: e.target.value })}
                        InputProps={{ style: { fontSize: '0.9rem' } }}
                      />
                    </Grid>
                    <Grid item xs={12} md={2} sx={{ display: 'flex', justifyContent: 'center' }}>
                      <Tooltip title="Adicionar Cargo">
                        <IconButton 
                          onClick={handleAddRole}
                          color="primary"
                        >
                          <AddIcon />
                        </IconButton>
                      </Tooltip>
                    </Grid>
                  </Grid>
                </Box>

                {/* Role History List */}
                <Box>
                  <Grid container spacing={2} sx={{ borderBottom: '1px solid #444', pb: 1, mb: 1 }}>
                    <Grid item xs={4}><Typography variant="caption">CARGO</Typography></Grid>
                    <Grid item xs={3}><Typography variant="caption">INÍCIO</Typography></Grid>
                    <Grid item xs={3}><Typography variant="caption">TÉRMINO</Typography></Grid>
                    <Grid item xs={2}><Typography variant="caption">AÇÕES</Typography></Grid>
                  </Grid>
                  {roleHistory.length > 0 ? (
                    roleHistory.map((history, index) => {
                      const roleName = roles.find(r => r.id === history.role_id)?.name || 'Cargo Desconhecido';
                      return (
                        <Grid container spacing={2} alignItems="center" key={index} sx={{ py: 1, '&:hover': { bgcolor: 'action.hover' } }}>
                          <Grid item xs={4}><Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{roleName}</Typography></Grid>
                          <Grid item xs={3}><Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{history.start_date ? new Date(history.start_date).toLocaleDateString('pt-BR') : '-'}</Typography></Grid>
                          <Grid item xs={3}><Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{history.end_date ? new Date(history.end_date).toLocaleDateString('pt-BR') : 'Presente'}</Typography></Grid>
                          <Grid item xs={2}>
                             <IconButton size="small" onClick={() => console.log('Edit role', history.id)}>
                               <EditIcon fontSize="small" />
                             </IconButton>
                             <IconButton size="small" color="error" onClick={() => handleDeleteRole(history.id)}>
                               <DeleteIcon fontSize="small" />
                             </IconButton>
                          </Grid>
                        </Grid>
                      );
                    })
                  ) : (
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2, fontSize: '0.85rem' }}>
                      Nenhum histórico de cargo encontrado.
                    </Typography>
                  )}
                </Box>
              </Paper>

            {/* CONDECORAÇÕES */}
            <Paper sx={{ p: 2, mb: 2 }}>
              {renderSectionTitle('Condecorações')}
              <Box sx={{ p: 2, border: '1px dashed grey', borderRadius: 1, textAlign: 'center' }}>
                <Tooltip title="Adicionar Condecoração">
                  <IconButton onClick={() => console.log('Add Decoration')} color="primary" size="large">
                    <AddIcon fontSize="large" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Paper>

          </Grid>

          {/* Sidebar Actions Column */}
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
              <Typography variant="h6" gutterBottom align="center">
                Ações
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center" paragraph>
                Reveja os dados com atenção antes de salvar. Todos os campos obrigatórios devem ser preenchidos.
              </Typography>
              <Stack spacing={2}>
                <Button type="submit" variant="contained" color="primary" fullWidth>
                  {id ? 'Salvar Alterações' : 'Criar Membro'}
                </Button>
                {id && (
                  <Button variant="contained" color="secondary" fullWidth>
                    Redefinir Senha
                  </Button>
                )}
                <Button variant="outlined" color="inherit" fullWidth onClick={() => navigate('/dashboard/management/members')}>
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
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default MemberForm;