
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Button, Container, TextField, Typography, Select, MenuItem, FormControl, 
  InputLabel, Grid, SelectChangeEvent, Paper, Box, Snackbar, Alert, 
  Avatar, Stack, Checkbox, FormControlLabel, IconButton 
} from '@mui/material';
import { PhotoCamera, Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import api from '../../services/api';
import { MemberResponse, DegreeEnum, RegistrationStatusEnum, RelationshipTypeEnum, RoleHistoryResponse } from '../../types';
import { formatCPF, formatPhone, formatCEP } from '../../utils/formatters';
import { validateCPF, validateEmail } from '../../utils/validators';
import RoleAssignmentDialog from '../../components/RoleAssignmentDialog';

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
    status: 'Active',
    degree: DegreeEnum.APPRENTICE,
    initiation_date: '',
    elevation_date: '',
    exaltation_date: '',
    affiliation_date: '',
    regularization_date: '',
    philosophical_degree: '',
    registration_status: RegistrationStatusEnum.PENDING,
    password: '',
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
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

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
      const fetchMember = async () => {
        try {
          const response = await api.get<MemberResponse>(`/members/${id}`);
          const memberData = response.data;
          
          // Find active role for the primary lodge (assuming first association for now)
          const lodgeId = memberData.lodge_associations?.[0]?.lodge_id;
          const activeRole = memberData.role_history?.find(h => !h.end_date && h.lodge_id === lodgeId);
          
          setFormState({
            ...memberData,
            lodge_id: lodgeId || '',
            role_id: activeRole?.role_id || ''
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
  }, [id]);

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
  };

  const handleDeleteRole = async (roleHistoryId: number) => {
    try {
      await api.delete(`/members/${id}/roles/${roleHistoryId}`);
      setRoleHistory(roleHistory.filter(h => h.id !== roleHistoryId));
      setSnackbar({ open: true, message: 'Cargo removido com sucesso!', severity: 'success' });
    } catch (error) {
      console.error('Failed to delete role', error);
      setSnackbar({ open: true, message: 'Erro ao remover cargo.', severity: 'error' });
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    const newErrors: { [key: string]: string } = {};
    if (formState.cpf && !validateCPF(formState.cpf)) newErrors.cpf = 'CPF inválido';
    if (formState.email && !validateEmail(formState.email)) newErrors.email = 'Email inválido';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSnackbar({ open: true, message: 'Por favor, corrija os erros no formulário.', severity: 'error' });
      return;
    }

    const memberData = { 
      ...formState,
      family_members: familyMembers 
    };

    try {
      if (id) {
        await api.put(`/members/${id}`, memberData);
        setSnackbar({ open: true, message: 'Membro atualizado com sucesso!', severity: 'success' });
      } else {
        await api.post('/members', memberData);
        setSnackbar({ open: true, message: 'Membro criado com sucesso!', severity: 'success' });
      }
      setTimeout(() => navigate('/dashboard/management/members'), 1500);
    } catch (error) {
      console.error('Failed to save member', error);
      setSnackbar({ open: true, message: 'Erro ao salvar membro. Verifique os dados.', severity: 'error' });
    }
  };

  const renderSectionTitle = (title: string) => (
    <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2, color: 'primary.main' }}>
      {title}
    </Typography>
  );

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom color="primary">
          {id ? 'Editar Membro' : 'Novo Membro'}
        </Typography>
      </Box>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Main Content Column */}
          <Grid item xs={12} md={9}>
            
            {/* DADOS PESSOAIS */}
            <Paper sx={{ p: 3, mb: 3 }}>
              {renderSectionTitle('Dados Pessoais')}
              <Grid container spacing={3}>
                <Grid item xs={12} md={3} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Avatar
                    sx={{ width: 150, height: 150, mb: 2 }}
                    src={formState.profile_picture_path}
                    alt={formState.full_name}
                  />
                  <Button
                    variant="outlined"
                    startIcon={<PhotoCamera />}
                    component="label"
                    size="small"
                  >
                    Alterar Foto
                    <input hidden accept="image/*" type="file" />
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
                        label="Email"
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
                        label="Identidade (RG)"
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
                        label="Telefone"
                        value={formState.phone}
                        onChange={handleChange}
                        fullWidth
                        variant="outlined"
                      />
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>

              {/* CONDECORAÇÕES */}
              <Box mt={4}>
                {renderSectionTitle('Condecorações')}
                <Box sx={{ p: 2, border: '1px dashed grey', borderRadius: 1, textAlign: 'center' }}>
                  <Button variant="contained" color="primary" startIcon={<AddIcon />}>
                    Adicionar Condecoração
                  </Button>
                </Box>
              </Box>
            </Paper>

            {/* FAMILIARES */}
            <Paper sx={{ p: 3, mb: 3 }}>
              {renderSectionTitle('Familiares')}
              {familyMembers.map((member, index) => (
                <Box key={index} sx={{ mb: 3, p: 2, border: '1px solid #333', borderRadius: 1 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="Nome do Familiar"
                        value={member.full_name}
                        onChange={(e) => handleFamilyMemberChange(index, 'full_name', e.target.value)}
                        fullWidth
                        size="small"
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Parentesco</InputLabel>
                        <Select
                          value={member.relationship_type}
                          label="Parentesco"
                          onChange={(e) => handleFamilyMemberChange(index, 'relationship_type', e.target.value)}
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
                        InputLabelProps={{ shrink: true }}
                        variant="outlined"
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
                      />
                    </Grid>
                    <Grid item xs={12} md={1}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={member.is_deceased}
                            onChange={(e) => handleFamilyMemberChange(index, 'is_deceased', e.target.checked)}
                            size="small"
                          />
                        }
                        label="Falecido(a)?"
                        sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.8rem' } }}
                      />
                    </Grid>
                    <Grid item xs={12} md={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button 
                        variant="contained" 
                        color="error" 
                        size="small" 
                        onClick={() => removeFamilyMember(index)}
                      >
                        Remover
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              ))}
              <Button variant="contained" color="secondary" startIcon={<AddIcon />} onClick={addFamilyMember}>
                Adicionar Familiar
              </Button>
            </Paper>

            {/* ENDEREÇO */}
            <Paper sx={{ p: 3, mb: 3 }}>
              {renderSectionTitle('Endereço')}
              <Grid container spacing={3}>
                <Grid item xs={12} md={2}>
                  <TextField
                    name="zip_code"
                    label="CEP"
                    value={formState.zip_code}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
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
                <Grid item xs={12} md={2}>
                  <TextField
                    name="street_number"
                    label="Número"
                    value={formState.street_number}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    name="neighborhood"
                    label="Bairro"
                    value={formState.neighborhood}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    name="city"
                    label="Cidade"
                    value={formState.city}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* DADOS MAÇÔNICOS */}
            <Paper sx={{ p: 3, mb: 3 }}>
              {renderSectionTitle('Dados Maçônicos')}
              <Grid container spacing={3}>
                <Grid item xs={12} md={3}>
                  <TextField
                    name="cim"
                    label="CIM"
                    value={formState.cim}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
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

            {/* DADOS PROFISSIONAIS */}
            <Paper sx={{ p: 3, mb: 3 }}>
              {renderSectionTitle('Dados Profissionais')}
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <TextField
                    name="education_level"
                    label="Formação Acadêmica"
                    value={formState.education_level}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
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
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* ADICIONAR NOVO CARGO (ROLE HISTORY) */}
            {id && (
              <Paper sx={{ p: 3, mb: 3 }}>
                {renderSectionTitle('Adicionar Novo Cargo')}
                <Box sx={{ p: 2, border: '1px solid #333', borderRadius: 1, mb: 3 }}>
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
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="Data de Início"
                        type="date"
                        fullWidth
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        variant="outlined"
                        value={newRole.start_date}
                        onChange={(e) => setNewRole({ ...newRole, start_date: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="Data de Término (opcional)"
                        type="date"
                        fullWidth
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        variant="outlined"
                        value={newRole.end_date}
                        onChange={(e) => setNewRole({ ...newRole, end_date: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <Button 
                        variant="contained" 
                        color="primary" 
                        fullWidth 
                        onClick={handleAddRole}
                      >
                        Adicionar
                      </Button>
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
                          <Grid item xs={4}><Typography variant="body2">{roleName}</Typography></Grid>
                          <Grid item xs={3}><Typography variant="body2">{history.start_date ? new Date(history.start_date).toLocaleDateString('pt-BR') : '-'}</Typography></Grid>
                          <Grid item xs={3}><Typography variant="body2">{history.end_date ? new Date(history.end_date).toLocaleDateString('pt-BR') : 'Presente'}</Typography></Grid>
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
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                      Nenhum histórico de cargo encontrado.
                    </Typography>
                  )}
                </Box>
              </Paper>
            )}

            {/* INFORMAÇÕES DE ACESSO */}
            <Paper sx={{ p: 3, mb: 3 }}>
              {renderSectionTitle('Informações de Acesso')}
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth variant="outlined">
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
                </Grid>
                <Grid item xs={12} md={6}>
                   <FormControl fullWidth variant="outlined">
                    <InputLabel>Status</InputLabel>
                    <Select
                      name="registration_status"
                      value={formState.registration_status}
                      label="Status"
                      onChange={handleChange}
                    >
                      <MenuItem value={RegistrationStatusEnum.PENDING}>Pendente</MenuItem>
                      <MenuItem value={RegistrationStatusEnum.APPROVED}>Aprovado</MenuItem>
                      <MenuItem value={RegistrationStatusEnum.REJECTED}>Rejeitado</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                {!id && (
                  <Grid item xs={12} md={6}>
                    <TextField
                      name="password"
                      label="Senha Inicial"
                      type="password"
                      value={formState.password}
                      onChange={handleChange}
                      fullWidth
                      required
                      variant="outlined"
                    />
                  </Grid>
                )}
              </Grid>
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