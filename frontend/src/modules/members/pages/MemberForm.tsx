import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button, Container, TextField, Typography, Select, MenuItem, FormControl,
  InputLabel, Grid, SelectChangeEvent, Paper, Box, 
  Avatar, IconButton, CircularProgress,
  Tabs, Tab, Fade, Card, CardContent, useTheme, useMediaQuery, Chip, alpha,
  FormControlLabel, Checkbox, Accordion, AccordionSummary, AccordionDetails,
  Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableContainer, TableHead, TableRow
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
  Work as WorkIcon,
  ExpandMore as ExpandMoreIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';

import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import api from '@/shared/services/api';
import { MemberResponse, RegistrationStatusEnum, RelationshipTypeEnum, RoleHistoryResponse, MemberStatusEnum, MemberClassEnum, MemberLodgeAssociationResponse } from '@/types';
import { formatCPF, formatPhone, formatCEP } from '@/shared/utils/formatters';
import { validateCPF, validateEmail } from '@/shared/utils/validators';
import { fetchAddressByCep } from '@/shared/services/cepService';
import { useAuth } from '@/modules/access_control/hooks/useAuth';
import { useSnackbar } from 'notistack';



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

interface DecorationLocal {
  id?: number;
  title: string;
  award_date: string;
  remarks: string;
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

const SectionTitle = ({ title, icon: Icon, theme }: { title: string, icon: any, theme: any }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`, pb: 1 }}>
    <Icon sx={{ color: theme.palette.primary.main, mr: 1.5, fontSize: 24 }} />
    <Typography variant="h6" sx={{ fontFamily: '"Playfair Display", serif', color: theme.palette.text.primary, fontWeight: 600 }}>
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
    marital_status: '',
    father_name: '',
    mother_name: '',
    blood_type: '',
    education_level: '',
    occupation: '',
    workplace: '',
    profile_picture_path: '',
    cim: '',
    status: MemberStatusEnum.ACTIVE,
    member_class: MemberClassEnum.REGULAR,
    degree: 1,
    is_installed: false,
    mother_lodge: '',
    collecting_lodge: '',
    initiation_certificate: '',
    initiation_data: { placet: '', data_sessao: '', data_entrada: '', processo: '', registro: '', loja: '' },
    elevation_data: { data_sessao: '', data_entrada: '', processo: '', registro: '', loja: '' },
    exaltation_data: { data_sessao: '', data_entrada: '', processo: '', registro: '', loja: '' },
    installation_data: { data_sessao: '', data_entrada: '', processo: '', registro: '', loja: '' },
    affiliation_data: { data_sessao: '', data_entrada: '', processo: '', registro: '', loja: '' },
    regularization_data: { data_sessao: '', data_entrada: '', processo: '', registro: '', loja: '' },
    dismissal_data: { quit_placet: '', data_sessao: '', data_entrada: '', processo: '', registro: '', loja: '' },
    registration_status: RegistrationStatusEnum.PENDING,
    password: '',
    confirmPassword: '',
    lodge_id: '',
    role_id: '',
    state: ''
  });

  const [familyMembers, setFamilyMembers] = useState<FamilyMemberLocal[]>([]);
  const [decorations, setDecorations] = useState<DecorationLocal[]>([]);
  const [roleHistory, setRoleHistory] = useState<RoleHistoryResponse[]>([]);
  const [lodgeAssociations, setLodgeAssociations] = useState<MemberLodgeAssociationResponse[]>([]);
  const [newLodgeAssoc, setNewLodgeAssoc] = useState({ lodge_id: '', start_date: '', end_date: '', status: MemberStatusEnum.ACTIVE, member_class: MemberClassEnum.REGULAR });
  const [newRole, setNewRole] = useState({ role_id: '', start_date: '', end_date: '' });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [importFileLoading, setImportFileLoading] = useState(false);
  const [importDiffModalOpen, setImportDiffModalOpen] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [selectedDiffFields, setSelectedDiffFields] = useState<Record<string, boolean>>({});
  const [roles, setRoles] = useState<Role[]>([]);
  const [lodges, setLodges] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { enqueueSnackbar } = useSnackbar();

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
    const fetchLodges = async () => {
      try {
        const response = await api.get('/lodges');
        setLodges(response.data);
      } catch (error) {
        console.error('Failed to fetch lodges', error);
      }
    };
    fetchRoles();
    fetchLodges();

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

          // Map masonic_history back to local form states
          const mapEvent = (type: string) => {
            const ev = memberData.masonic_history?.find(e => e.event_type === type);
            if (!ev) return { data_sessao: '', data_entrada: '', processo: '', registro: '', loja: '' };
            return {
              data_sessao: ev.session_date || '',
              data_entrada: ev.entry_date || '',
              processo: ev.process_number || '',
              registro: ev.registry_number || '',
              loja: ev.raw_lodge_name || '',
              ...(type === 'INITIATION' ? { placet: ev.placet_number || '' } : {}),
              ...(type === 'DISMISSAL' ? { quit_placet: ev.quit_placet_number || '' } : {})
            };
          };

          setFormState({
            ...memberData,
            initiation_data: mapEvent('INITIATION'),
            elevation_data: mapEvent('ELEVATION'),
            exaltation_data: mapEvent('EXALTATION'),
            installation_data: mapEvent('INSTALLATION'),
            affiliation_data: mapEvent('AFFILIATION'), // Just grabs the first one for now
            regularization_data: mapEvent('REGULARIZATION'),
            dismissal_data: mapEvent('DISMISSAL'),
            lodge_id: targetLodgeId || '',
            role_id: activeRole?.role_id || '',
            status: association?.status || MemberStatusEnum.ACTIVE,
            member_class: association?.member_class || MemberClassEnum.REGULAR,
            phone: formatPhone(memberData.phone || ''),
            password: '',
            confirmPassword: ''
          });

          if (memberData.family_members) {
            setFamilyMembers(memberData.family_members.map(fm => ({
              id: fm.id,
              full_name: fm.full_name,
              relationship_type: fm.relationship_type,
              birth_date: fm.birth_date || '',
              phone: formatPhone(fm.phone || ''),
              email: fm.email || '',
              is_deceased: fm.is_deceased
            })));
          }

          if (memberData.decorations) {
            setDecorations(memberData.decorations.map(d => ({
              id: d.id,
              title: d.title,
              award_date: d.award_date || '',
              remarks: d.remarks || ''
            })));
          }

          if (memberData.role_history) {
            setRoleHistory(memberData.role_history);
          }

          if (memberData.lodge_associations) {
            setLodgeAssociations(memberData.lodge_associations);
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
        enqueueSnackbar('CEP não encontrado.', { variant: 'error' });
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

  const handleNestedChange = (category: string, field: string, value: string) => {
    setFormState((prevState: any) => ({
      ...prevState,
      [category]: {
        ...(prevState[category] || {}),
        [field]: value
      }
    }));
  };

  const handleCheckCim = async () => {
    if (!formState.cim) {
      enqueueSnackbar('Por favor, informe o CIM.', { variant: 'warning' });
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
      enqueueSnackbar('Membro encontrado!', { variant: 'success' });
      setIsCimVerified(true);
    } catch (error: any) {
      if (error.response?.status === 404) {
        enqueueSnackbar('CIM não encontrado. Iniciando novo cadastro.', { variant: 'info' });
        setIsCimVerified(true);
        setExistingMemberId(null);
      } else {
        enqueueSnackbar('Erro ao verificar CIM.', { variant: 'error' });
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

  const handleDecorationChange = (index: number, field: keyof DecorationLocal, value: any) => {
    const updated = [...decorations];
    updated[index] = { ...updated[index], [field]: value };
    setDecorations(updated);
  };
  const addDecoration = () => {
    setDecorations([...decorations, { title: '', award_date: '', remarks: '' }]);
  };
  const removeDecoration = (index: number) => {
    const updated = [...decorations];
    updated.splice(index, 1);
    setDecorations(updated);
  };

  const handleAddRole = async () => {
    if (!newRole.role_id || !newRole.start_date) {
      enqueueSnackbar('Preencha o cargo e a data de início.', { variant: 'error' });
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
        enqueueSnackbar('Cargo adicionado!', { variant: 'success' });
      } catch {
        enqueueSnackbar('Erro ao adicionar cargo.', { variant: 'error' });
      }
    } else {
      enqueueSnackbar('Salve o membro primeiro antes de adicionar cargos.', { variant: 'warning' });
    }
  };

  const handleRemoveRole = async (roleHistoryId: number) => {
    if (id) {
      try {
        await api.delete(`/members/${id}/roles/${roleHistoryId}`);
        setRoleHistory(roleHistory.filter(h => h.id !== roleHistoryId));
        enqueueSnackbar('Cargo removido.', { variant: 'success' });
      } catch {
        enqueueSnackbar('Erro ao remover cargo.', { variant: 'error' });
      }
    } else {
      setRoleHistory(roleHistory.filter(h => h.id !== roleHistoryId));
    }
  };

  const handleAddLodgeAssoc = async () => {
    if (!newLodgeAssoc.lodge_id || !newLodgeAssoc.start_date) {
      enqueueSnackbar('Preencha a loja e a data de início.', { variant: 'error' });
      return;
    }
    if (id) {
      try {
        const response = await api.post(`/members/${id}/lodge-associations`, {
          lodge_id: Number(newLodgeAssoc.lodge_id),
          start_date: newLodgeAssoc.start_date,
          end_date: newLodgeAssoc.end_date || null,
          status: newLodgeAssoc.status,
          member_class: newLodgeAssoc.member_class
        });
        setLodgeAssociations([...lodgeAssociations, response.data]);
        setNewLodgeAssoc({ lodge_id: '', start_date: '', end_date: '', status: MemberStatusEnum.ACTIVE, member_class: MemberClassEnum.REGULAR });
        enqueueSnackbar('Associação de loja adicionada!', { variant: 'success' });
      } catch (error: any) {
        enqueueSnackbar(error.response?.data?.detail || 'Erro ao adicionar loja.', { variant: 'error' });
      }
    } else {
      enqueueSnackbar('Salve o membro primeiro antes de adicionar histórico de lojas.', { variant: 'warning' });
    }
  };

  const handleRemoveLodgeAssoc = async (lodgeId: number) => {
    if (id) {
      try {
        await api.delete(`/members/${id}/lodge-associations/${lodgeId}`);
        setLodgeAssociations(lodgeAssociations.filter(a => a.lodge_id !== lodgeId));
        enqueueSnackbar('Associação removida.', { variant: 'success' });
      } catch {
        enqueueSnackbar('Erro ao remover loja.', { variant: 'error' });
      }
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
      enqueueSnackbar('Corrija os erros do formulário.', { variant: 'error' });
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

    // Map local history state back to masonic_history payload
    const unmapEvent = (data: any, type: string) => {
      if (!data || (!data.data_sessao && !data.data_entrada && !data.processo && !data.registro && !data.loja)) return null;
      return {
        event_type: type,
        session_date: data.data_sessao || null,
        entry_date: data.data_entrada || null,
        process_number: data.processo || null,
        registry_number: data.registro || null,
        raw_lodge_name: data.loja || null,
        ...(type === 'INITIATION' ? { placet_number: data.placet || null } : {}),
        ...(type === 'DISMISSAL' ? { quit_placet_number: data.quit_placet || null } : {})
      };
    };

    const masonic_history = [
      unmapEvent(sanitizedFormState.initiation_data, 'INITIATION'),
      unmapEvent(sanitizedFormState.elevation_data, 'ELEVATION'),
      unmapEvent(sanitizedFormState.exaltation_data, 'EXALTATION'),
      unmapEvent(sanitizedFormState.installation_data, 'INSTALLATION'),
      unmapEvent(sanitizedFormState.affiliation_data, 'AFFILIATION'),
      unmapEvent(sanitizedFormState.regularization_data, 'REGULARIZATION'),
      unmapEvent(sanitizedFormState.dismissal_data, 'DISMISSAL')
    ].filter(Boolean);

    // Remove legacy properties
    delete sanitizedFormState.initiation_data;
    delete sanitizedFormState.elevation_data;
    delete sanitizedFormState.exaltation_data;
    delete sanitizedFormState.installation_data;
    delete sanitizedFormState.affiliation_data;
    delete sanitizedFormState.regularization_data;
    delete sanitizedFormState.dismissal_data;

    const toE164 = (phone: string | undefined) => {
      if (!phone) return undefined;
      const digits = phone.replace(/\D/g, '');
      if (digits.length >= 10 && !digits.startsWith('55')) return '+55' + digits;
      if (digits.length >= 12 && digits.startsWith('55')) return '+' + digits;
      return phone;
    };

    const formattedFamilyMembers = familyMembers.map(fm => ({
      ...fm,
      phone: toE164(fm.phone)
    }));

    const memberData = {
      ...sanitizedFormState,
      phone: toE164(sanitizedFormState.phone),
      role_id: sanitizedFormState.role_id ? Number(sanitizedFormState.role_id) : undefined,
      lodge_id: Number(sanitizedFormState.lodge_id),
      family_members: formattedFamilyMembers,
      masonic_history: masonic_history.length > 0 ? masonic_history : undefined
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
        enqueueSnackbar('Membro associado!', { variant: 'success' });
      } else if (id) {
        await api.put(`/members/${id}`, memberData);
        enqueueSnackbar('Membro atualizado!', { variant: 'success' });
      } else {
        const response = await api.post('/members/', memberData);
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
        enqueueSnackbar('Membro criado!', { variant: 'success' });
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
      enqueueSnackbar(msg, { variant: 'error' });
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileLoading(true);
    try {
      const formData = new FormData();
      formData.append('files', file);
      const res = await api.post('/members/import/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.rows?.length > 0) {
        const row = res.data.rows[0];
        setExtractedData(row);
        
        // Setup default selected fields (all true if there is a value)
        const initialSelected: Record<string, boolean> = {};
        Object.keys(row).forEach(key => {
          if (row[key] !== null && row[key] !== undefined && row[key] !== '' && key !== 'is_valid' && key !== 'errors' && key !== 'warnings') {
            initialSelected[key] = true;
          }
        });
        setSelectedDiffFields(initialSelected);
        setImportDiffModalOpen(true);
      } else {
        enqueueSnackbar('Nenhum dado encontrado no arquivo.', { variant: 'warning' });
      }
    } catch (error) {
      console.error(error);
      enqueueSnackbar('Erro ao extrair arquivo.', { variant: 'error' });
    } finally {
      setImportFileLoading(false);
      e.target.value = ''; // reset
    }
  };

  const applyExtractedData = () => {
    setFormState(prev => {
      const updated = { ...prev };
      Object.keys(selectedDiffFields).forEach(key => {
        if (selectedDiffFields[key] && extractedData[key] !== null && extractedData[key] !== undefined) {
          if (key === 'degree') {
            updated[key] = parseInt(extractedData[key]);
          } else if (key === 'name') {
            updated['full_name'] = extractedData[key];
          } else {
            updated[key] = extractedData[key];
          }
        }
      });
      return updated;
    });
    setImportDiffModalOpen(false);
    enqueueSnackbar('Dados aplicados. Revise e salve o formulário.', { variant: 'success' });
  };

  const diffFieldNames: Record<string, string> = {
    cim: 'CIM', name: 'Nome', email: 'E-mail', cpf: 'CPF', rg: 'RG',
    degree: 'Grau', marital_status: 'Estado Civil', father_name: 'Nome do Pai',
    mother_name: 'Nome da Mãe', mother_lodge: 'Loja Mãe', collecting_lodge: 'Loja de Recolhimento',
    initiation_certificate: 'Placet de Iniciação',
    initiation_data: 'Dados Iniciação', elevation_data: 'Dados Elevação',
    exaltation_data: 'Dados Exaltação', installation_data: 'Dados Instalação',
    affiliation_data: 'Dados Filiação', regularization_data: 'Dados Regularização',
    dismissal_data: 'Dados Desligamento'
  };

  // --- CIM SEARCH STEP ---
  if (!isCimVerified && !id) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper elevation={0} sx={{
          p: 4, textAlign: 'center', borderRadius: 2,
          bgcolor: theme.palette.background.paper, border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
            <SearchIcon sx={{ fontSize: 60, color: theme.palette.primary.main }} />
          </Box>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, color: theme.palette.text.primary, fontFamily: '"Playfair Display", serif' }}>
            Cadastro de Novo Membro
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, color: theme.palette.text.secondary }}>
            Informe o CIM para iniciarmos. O sistema verificará se o irmão já possui cadastro.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Número do CIM"
              value={formState.cim}
              onChange={(e) => setFormState({ ...formState, cim: e.target.value })}
              fullWidth
              sx={{ mb: 2 }}
              placeholder="Ex: 12345"
              InputLabelProps={{ shrink: true }}
            />
            <Button
              variant="contained"
              onClick={handleCheckCim}
              disabled={cimCheckLoading}
              sx={{ px: 4, bgcolor: theme.palette.primary.main, color: theme.palette.primary.contrastText, fontWeight: 'bold' }}
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
        p: 0, mb: 3, borderRadius: 2, bgcolor: theme.palette.background.paper,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, overflow: 'hidden', position: 'relative'
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
                border: `4px solid ${theme.palette.background.paper}`, borderRadius: 4,
                bgcolor: theme.palette.background.default, color: theme.palette.primary.main, fontSize: '3rem',
                fontFamily: '"Playfair Display", serif', boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
              }}
              src={formState.profile_picture_path ? (formState.profile_picture_path.startsWith('blob:') ? formState.profile_picture_path : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${formState.profile_picture_path}`) : undefined}
            >
              {getInitials(formState.full_name || 'Novo Membro')}
            </Avatar>
            <IconButton
              component="label"
              sx={{ position: 'absolute', bottom: 5, right: 5, bgcolor: theme.palette.primary.main, color: theme.palette.primary.contrastText, '&:hover': { bgcolor: theme.palette.primary.dark } }}
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
              <Typography variant="h4" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, color: theme.palette.text.primary }}>
                {formState.full_name || 'Novo Membro'}
              </Typography>
              <Chip label={formState.degree || 'Desconhecido'} size="small" sx={{ bgcolor: 'rgba(212, 175, 55, 0.15)', color: theme.palette.primary.main, border: `1px solid ${theme.palette.primary.main}`, fontWeight: 600 }} />
            </Box>
            <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
              CIM: {formState.cim} • {formState.email || 'Sem email'}
            </Typography>
          </Box>

          <Box sx={{ mt: isMobile ? 3 : 0, display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: isMobile ? 'center' : 'flex-end' }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={importFileLoading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
              disabled={importFileLoading}
              sx={{ color: theme.palette.primary.main, borderColor: theme.palette.primary.main, fontWeight: 600 }}
            >
              {importFileLoading ? 'Importando...' : 'Importar Arquivo'}
              <input type="file" hidden accept=".pdf,.xlsx,.csv" onChange={handleImportFile} />
            </Button>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/dashboard/management/members')}
              sx={{ color: theme.palette.text.secondary, borderColor: alpha(theme.palette.divider, 0.2) }}
            >
              Voltar
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={() => handleSubmit()}
              sx={{ bgcolor: theme.palette.primary.main, color: theme.palette.primary.contrastText, fontWeight: 700, px: 3, '&:hover': { bgcolor: theme.palette.primary.dark } }}
            >
              Salvar
            </Button>
          </Box>
        </Box>
      </Paper>
      {/* 2. TABS */}
      <Box sx={{ borderBottom: 1, borderColor: alpha(theme.palette.divider, 0.1), mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant={isMobile ? "scrollable" : "standard"}
          sx={{ '& .MuiTab-root': { color: theme.palette.text.secondary, '&.Mui-selected': { color: theme.palette.primary.main } }, '& .MuiTabs-indicator': { backgroundColor: theme.palette.primary.main } }}
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
        <Card sx={{ bgcolor: theme.palette.background.paper, border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, borderRadius: 2 }}>
          <CardContent sx={{ p: 4 }}>
            <SectionTitle title="Informações Pessoais" icon={PersonIcon} theme={theme} />
            <Grid container spacing={2}>
              <Grid
                size={{
                  xs: 12
                }}><TextField label="Nome Completo" name="full_name" value={formState.full_name} onChange={handleChange} fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} /></Grid>
              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}><TextField label="CPF" name="cpf" value={formState.cpf} onChange={handleChange} fullWidth error={!!errors.cpf} helperText={errors.cpf} sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} /></Grid>
              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}><TextField label="Email" name="email" value={formState.email} onChange={handleChange} fullWidth error={!!errors.email} helperText={errors.email} sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} /></Grid>
              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}><TextField label="RG" name="identity_document" value={formState.identity_document} onChange={handleChange} fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} /></Grid>
              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}><TextField label="Data de Nascimento" type="date" name="birth_date" value={formState.birth_date || ''} onChange={handleChange} fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} /></Grid>
              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}><TextField label="Data de Casamento" type="date" name="marriage_date" value={formState.marriage_date || ''} onChange={handleChange} fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} /></Grid>
              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}><TextField label="Celular" name="phone" value={formState.phone} onChange={handleChange} fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} /></Grid>
              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}><TextField label="Naturalidade" name="place_of_birth" value={formState.place_of_birth} onChange={handleChange} fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} /></Grid>
              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel shrink>Estado Civil</InputLabel>
                  <Select name="marital_status" value={formState.marital_status || ''} onChange={handleChange} sx={{ color: theme.palette.text.primary, '.MuiOutlinedInput-notchedOutline': { borderColor: alpha(theme.palette.divider, 0.1) } }}>
                    <MenuItem value=""><em>Nenhum</em></MenuItem>
                    <MenuItem value="Solteiro">Solteiro</MenuItem>
                    <MenuItem value="Casado">Casado</MenuItem>
                    <MenuItem value="Divorciado">Divorciado</MenuItem>
                    <MenuItem value="Viúvo">Viúvo</MenuItem>
                    <MenuItem value="União Estável">União Estável</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}><TextField label="Religião" name="religion" value={formState.religion} onChange={handleChange} fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} /></Grid>
              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}><TextField label="Tipo Sanguíneo" name="blood_type" value={formState.blood_type || ''} onChange={handleChange} fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} /></Grid>
              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}><TextField label="Nome do Pai" name="father_name" value={formState.father_name || ''} onChange={handleChange} fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} /></Grid>
              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}><TextField label="Nome da Mãe" name="mother_name" value={formState.mother_name || ''} onChange={handleChange} fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} /></Grid>
            </Grid>
          </CardContent>
        </Card>
      </TabPanel>
      {/* ADDRESS */}
      <TabPanel value={tabValue} index={1}>
        <Card sx={{ bgcolor: theme.palette.background.paper, border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, borderRadius: 2 }}>
          <CardContent sx={{ p: 4 }}>
            <SectionTitle title="Endereço Residencial" icon={HomeIcon} theme={theme} />
            <Grid container spacing={2}>
              <Grid
                size={{
                  xs: 12,
                  md: 3
                }}><TextField label="CEP" name="zip_code" value={formState.zip_code} onChange={handleChange} onBlur={handleCepBlur} fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} /></Grid>
              <Grid
                size={{
                  xs: 12,
                  md: 7
                }}><TextField label="Logradouro" name="street_address" value={formState.street_address} onChange={handleChange} fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} /></Grid>
              <Grid
                size={{
                  xs: 12,
                  md: 2
                }}><TextField label="Número" name="street_number" value={formState.street_number} onChange={handleChange} fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} /></Grid>
              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}><TextField label="Bairro" name="neighborhood" value={formState.neighborhood} onChange={handleChange} fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} /></Grid>
              <Grid
                size={{
                  xs: 12,
                  md: 4
                }}><TextField label="Cidade" name="city" value={formState.city} onChange={handleChange} fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} /></Grid>
              <Grid
                size={{
                  xs: 12,
                  md: 2
                }}><TextField label="UF" name="state" value={formState.state} onChange={handleChange} fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} /></Grid>
            </Grid>
          </CardContent>
        </Card>
      </TabPanel>
      {/* MASONIC */}
      <TabPanel value={tabValue} index={2}>
        <Card sx={{ bgcolor: theme.palette.background.paper, border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, borderRadius: 2, mb: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <SectionTitle title="Dados do Maçom" icon={BadgeIcon} theme={theme} />
            <Grid container spacing={2}>
              <Grid
                size={{
                  xs: 12,
                  md: 3
                }}><TextField label="CIM" name="cim" value={formState.cim} onChange={handleChange} fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} disabled={!!existingMemberId} /></Grid>
              <Grid
                size={{
                  xs: 12,
                  md: 3
                }}>
                <TextField fullWidth label="Grau (1-33)" name="degree" type="number" value={formState.degree} onChange={handleChange} InputLabelProps={{ shrink: true }} sx={{ mb: 2 }} inputProps={{ min: 1, max: 33 }} />
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  md: 3
                }}>
                <FormControlLabel
                  control={<Checkbox name="is_installed" checked={Boolean(formState.is_installed)} onChange={(e) => setFormState((prev: any) => ({ ...prev, is_installed: e.target.checked }))} sx={{ color: theme.palette.text.secondary, '&.Mui-checked': { color: '#00c6ff' } }} disabled={Number(formState.degree) < 3} />}
                  label="Mestre Instalado"
                  sx={{ color: theme.palette.text.primary, mt: 1 }}
                />
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  md: 3
                }}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel shrink>Status</InputLabel>
                  <Select name="status" value={formState.status} onChange={handleChange} sx={{ color: theme.palette.text.primary, '.MuiOutlinedInput-notchedOutline': { borderColor: alpha(theme.palette.divider, 0.1) } }}>
                    <MenuItem value={MemberStatusEnum.ACTIVE}>Ativo</MenuItem>
                    <MenuItem value={MemberStatusEnum.INACTIVE}>Inativo</MenuItem>
                    <MenuItem value={MemberStatusEnum.DISABLED}>Desativado</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  md: 4
                }}>
                <TextField label="Loja Mãe" name="mother_lodge" value={formState.mother_lodge || ''} onChange={handleChange} fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  md: 4
                }}>
                <TextField label="Loja de Recolhimento" name="collecting_lodge" value={formState.collecting_lodge || ''} onChange={handleChange} fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  md: 4
                }}>
                <TextField label="Placet de Iniciação" name="initiation_certificate" value={formState.initiation_certificate || ''} onChange={handleChange} fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} />
              </Grid>
            </Grid>

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ color: theme.palette.primary.main, mb: 2 }}>Registro Histórico</Typography>
              {['initiation_data', 'elevation_data', 'exaltation_data', 'installation_data', 'affiliation_data', 'regularization_data', 'dismissal_data'].map((category) => {
                const labels: any = {
                  initiation_data: 'Iniciação',
                  elevation_data: 'Elevação',
                  exaltation_data: 'Exaltação',
                  installation_data: 'Instalação',
                  affiliation_data: 'Filiação',
                  regularization_data: 'Regularização',
                  dismissal_data: 'Desligamento'
                };
                return (
                  <Accordion key={category} sx={{ mb: 1, bgcolor: alpha(theme.palette.background.paper, 0.5), border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, boxShadow: 'none', '&:before': { display: 'none' } }} disableGutters>
                    <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: theme.palette.primary.main }} />}>
                      <Typography variant="subtitle2" sx={{ color: theme.palette.text.primary, fontWeight: 500 }}>{labels[category]}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        {category === 'initiation_data' && (
                          <Grid size={{ xs: 12, md: 4 }}>
                            <TextField label="Placet" value={formState[category]?.placet || ''} onChange={e => handleNestedChange(category, 'placet', e.target.value)} fullWidth size="small" InputLabelProps={{ shrink: true }} />
                          </Grid>
                        )}
                        <Grid size={{ xs: 12, md: 4 }}>
                          <TextField label="Data Sessão" type="date" value={formState[category]?.data_sessao || ''} onChange={e => handleNestedChange(category, 'data_sessao', e.target.value)} fullWidth size="small" InputLabelProps={{ shrink: true }} />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <TextField label="Data Entrada" type="date" value={formState[category]?.data_entrada || ''} onChange={e => handleNestedChange(category, 'data_entrada', e.target.value)} fullWidth size="small" InputLabelProps={{ shrink: true }} />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <TextField label="Processo" value={formState[category]?.processo || ''} onChange={e => handleNestedChange(category, 'processo', e.target.value)} fullWidth size="small" InputLabelProps={{ shrink: true }} />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <TextField label="Registro" value={formState[category]?.registro || ''} onChange={e => handleNestedChange(category, 'registro', e.target.value)} fullWidth size="small" InputLabelProps={{ shrink: true }} />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <TextField label="Loja" value={formState[category]?.loja || ''} onChange={e => handleNestedChange(category, 'loja', e.target.value)} fullWidth size="small" InputLabelProps={{ shrink: true }} />
                        </Grid>
                        {category === 'dismissal_data' && (
                          <Grid size={{ xs: 12, md: 4 }}>
                            <TextField label="Quit Placet" value={formState[category]?.quit_placet || ''} onChange={e => handleNestedChange(category, 'quit_placet', e.target.value)} fullWidth size="small" InputLabelProps={{ shrink: true }} />
                          </Grid>
                        )}
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Box>
          </CardContent>
        </Card>

        {/* Roles History */}
        <Card sx={{ bgcolor: theme.palette.background.paper, border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, borderRadius: 2 }}>
          <CardContent sx={{ p: 4 }}>
            <SectionTitle title="Histórico de Cargos" icon={HistoryIcon} theme={theme} />

            {/* Add Role Form */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 3, p: 2, bgcolor: alpha(theme.palette.divider, 0.05), borderRadius: 1 }}>
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel shrink>Cargo</InputLabel>
                <Select value={newRole.role_id} onChange={(e) => setNewRole({ ...newRole, role_id: e.target.value })} sx={{ color: theme.palette.text.primary, '.MuiOutlinedInput-notchedOutline': { borderColor: alpha(theme.palette.divider, 0.1) } }}>
                  {roles.map(r => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField label="Início" type="date" size="small" value={newRole.start_date} onChange={(e) => setNewRole({ ...newRole, start_date: e.target.value })} sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} />
              <TextField label="Fim" type="date" size="small" value={newRole.end_date} onChange={(e) => setNewRole({ ...newRole, end_date: e.target.value })} sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} />
              <Button variant="contained" onClick={handleAddRole} sx={{ height: 40, bgcolor: theme.palette.primary.main, color: theme.palette.primary.contrastText, mt: '2px' }}>Adicionar</Button>
            </Box>

            <Box>
              {roleHistory.map((role, i) => (
                <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <Box>
                    <Typography sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>{roles.find(r => r.id === role.role_id)?.name || 'Cargo'}</Typography>
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                      {role.start_date ? new Date(role.start_date).toLocaleDateString() : ''} até {role.end_date ? new Date(role.end_date).toLocaleDateString() : 'Atual'}
                    </Typography>
                  </Box>
                  <IconButton size="small" color="error" onClick={() => handleRemoveRole(role.id)}><DeleteIcon /></IconButton>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* Lojas (Histórico) */}
        <Card sx={{ bgcolor: theme.palette.background.paper, border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, borderRadius: 2, mt: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <SectionTitle title="Histórico de Lojas (Iniciação e Filiação)" icon={HistoryIcon} theme={theme} />

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 3, p: 2, bgcolor: alpha(theme.palette.divider, 0.05), borderRadius: 1, flexWrap: 'wrap' }}>
              <FormControl sx={{ minWidth: 250, flexGrow: 1 }} size="small">
                <InputLabel shrink>Loja</InputLabel>
                <Select value={newLodgeAssoc.lodge_id} onChange={(e) => setNewLodgeAssoc({ ...newLodgeAssoc, lodge_id: e.target.value })} sx={{ color: theme.palette.text.primary }}>
                  {lodges.map(l => <MenuItem key={l.id} value={l.id}>{l.lodge_name} nº {l.lodge_number || 'S/N'}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField label="Ingresso" type="date" size="small" value={newLodgeAssoc.start_date} onChange={(e) => setNewLodgeAssoc({ ...newLodgeAssoc, start_date: e.target.value })} InputLabelProps={{ shrink: true }} />
              <TextField label="Saída (Quite Placet)" type="date" size="small" value={newLodgeAssoc.end_date} onChange={(e) => setNewLodgeAssoc({ ...newLodgeAssoc, end_date: e.target.value })} InputLabelProps={{ shrink: true }} />
              <FormControl size="small" sx={{ width: 120 }}>
                <InputLabel shrink>Status</InputLabel>
                <Select value={newLodgeAssoc.status} onChange={(e) => setNewLodgeAssoc({ ...newLodgeAssoc, status: e.target.value as MemberStatusEnum })}>
                  <MenuItem value={MemberStatusEnum.ACTIVE}>Ativo</MenuItem>
                  <MenuItem value={MemberStatusEnum.INACTIVE}>Desligado</MenuItem>
                </Select>
              </FormControl>
              <Button variant="contained" onClick={handleAddLodgeAssoc} sx={{ height: 40, bgcolor: theme.palette.primary.main, color: theme.palette.primary.contrastText, mt: '2px' }}>Vincular</Button>
            </Box>

            <Box>
              {lodgeAssociations.map((assoc, i) => {
                const lodge = lodges.find(l => l.id === assoc.lodge_id) || assoc.lodge;
                const lodgeName = lodge ? `${lodge.lodge_name} nº ${lodge.lodge_number || 'S/N'}` : `Loja #${assoc.lodge_id}`;
                return (
                  <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <Box>
                      <Typography sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>{lodgeName}</Typography>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                        {assoc.start_date ? new Date(assoc.start_date).toLocaleDateString() : ''} até {assoc.end_date ? new Date(assoc.end_date).toLocaleDateString() : 'Atual'} - {assoc.status}
                      </Typography>
                    </Box>
                    <IconButton size="small" color="error" onClick={() => handleRemoveLodgeAssoc(assoc.lodge_id)}><DeleteIcon /></IconButton>
                  </Box>
                );
              })}
            </Box>
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-start' }}>
              <Typography variant="body2" color="text.secondary">
                * Para lojas não cadastradas (Visitantes ou Histórico Externo), utilize o menu Lojas &gt; Nova Loja para cadastrar uma Loja Inativa e integrá-la ao sistema.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </TabPanel>
      {/* DECORATIONS */}
      <Card sx={{ bgcolor: alpha(theme.palette.background.paper, 0.4), backdropFilter: 'blur(10px)', border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, borderRadius: 2, mb: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <SectionTitle title="Títulos e Diplomas" icon={WorkspacePremiumIcon} theme={theme} />
            <Button variant="outlined" startIcon={<AddIcon />} onClick={addDecoration} sx={{ color: theme.palette.primary.main, borderColor: theme.palette.primary.main }}>Adicionar</Button>
          </Box>
          <Grid container spacing={2}>
            {decorations.map((dec, index) => (
              <Grid key={index} size={{ xs: 12, xl: 6 }}>
                <Paper sx={{ p: 2, bgcolor: theme.palette.background.default, border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ color: theme.palette.primary.main }}>Título #{index + 1}</Typography>
                    <IconButton size="small" color="error" onClick={() => removeDecoration(index)}><DeleteIcon fontSize="small" /></IconButton>
                  </Box>
                  <Grid container spacing={1}>
                    <Grid size={{ xs: 12, sm: 8 }}><TextField label="Título" size="small" value={dec.title} onChange={(e) => handleDecorationChange(index, 'title', e.target.value)} fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} /></Grid>
                    <Grid size={{ xs: 12, sm: 4 }}><TextField label="Data" type="date" size="small" value={dec.award_date} onChange={(e) => handleDecorationChange(index, 'award_date', e.target.value)} fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} /></Grid>
                    <Grid size={{ xs: 12 }}><TextField label="Observações (Loja, Registro)" size="small" value={dec.remarks} onChange={(e) => handleDecorationChange(index, 'remarks', e.target.value)} fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} /></Grid>
                  </Grid>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* FAMILY */}
      <TabPanel value={tabValue} index={3}>
        <Card sx={{ bgcolor: theme.palette.background.paper, border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, borderRadius: 2 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <SectionTitle title="Familiares" icon={FamilyIcon} theme={theme} />
              <Button variant="outlined" startIcon={<AddIcon />} onClick={addFamilyMember} sx={{ color: theme.palette.primary.main, borderColor: theme.palette.primary.main }}>Adicionar</Button>
            </Box>
            <Grid container spacing={2}>
              {familyMembers.map((member, index) => (
                <Grid
                  key={index}
                  size={{
                    xs: 12,
                    xl: 6
                  }}>
                  <Paper sx={{ p: 2, bgcolor: theme.palette.background.default, border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ color: theme.palette.primary.main }}>Familiar #{index + 1}</Typography>
                      <IconButton size="small" color="error" onClick={() => removeFamilyMember(index)}><DeleteIcon fontSize="small" /></IconButton>
                    </Box>
                    <Grid container spacing={1}>
                      <Grid
                        size={{
                          xs: 8
                        }}><TextField label="Nome" size="small" value={member.full_name} onChange={(e) => handleFamilyMemberChange(index, 'full_name', e.target.value)} fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} /></Grid>
                      <Grid
                        size={{
                          xs: 4
                        }}>
                        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                          <InputLabel shrink>Tipo</InputLabel>
                          <Select value={member.relationship_type} onChange={(e) => handleFamilyMemberChange(index, 'relationship_type', e.target.value)} sx={{ color: theme.palette.text.primary, '.MuiOutlinedInput-notchedOutline': { borderColor: alpha(theme.palette.divider, 0.1) } }}>
                            <MenuItem value={RelationshipTypeEnum.SPOUSE}>Esposa</MenuItem>
                            <MenuItem value={RelationshipTypeEnum.SON}>Filho</MenuItem>
                            <MenuItem value={RelationshipTypeEnum.DAUGHTER}>Filha</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid
                        size={{
                          xs: 6
                        }}><TextField label="Nascimento" type="date" size="small" value={member.birth_date} onChange={(e) => handleFamilyMemberChange(index, 'birth_date', e.target.value)} fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} /></Grid>
                      <Grid
                        size={{
                          xs: 6
                        }}><TextField label="Telefone" size="small" value={member.phone} onChange={(e) => handleFamilyMemberChange(index, 'phone', e.target.value)} fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} /></Grid>
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
        <Card sx={{ bgcolor: theme.palette.background.paper, border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, borderRadius: 2 }}>
          <CardContent sx={{ p: 4 }}>
            <SectionTitle title="Dados Profissionais" icon={WorkIcon} theme={theme} />
            <Grid container spacing={2}>
              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}><TextField label="Formação" name="education_level" value={formState.education_level} onChange={handleChange} fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} /></Grid>
              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}><TextField label="Ocupação" name="occupation" value={formState.occupation} onChange={handleChange} fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} /></Grid>
              <Grid
                size={{
                  xs: 12
                }}><TextField label="Empresa / Local" name="workplace" value={formState.workplace} onChange={handleChange} fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} /></Grid>
            </Grid>
          </CardContent>
        </Card>
      </TabPanel>
      {/* SYSTEM / SECURITY */}
      <TabPanel value={tabValue} index={5}>
        <Card sx={{ bgcolor: theme.palette.background.paper, border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, borderRadius: 2 }}>
          <CardContent sx={{ p: 4 }}>
            <SectionTitle title="Credenciais de Acesso" icon={LockIcon} theme={theme} />
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 3 }}>
              Defina uma senha caso o membro ainda não possua acesso ou precise de redefinição.
            </Typography>
            <Grid container spacing={2}>
              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}><TextField label="Nova Senha" type="password" name="password" value={formState.password} onChange={handleChange} fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} /></Grid>
              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}><TextField label="Confirmar Senha" type="password" name="confirmPassword" value={formState.confirmPassword} onChange={handleChange} fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} /></Grid>
            </Grid>
          </CardContent>
        </Card>
      </TabPanel>
      {/* SNACKBAR */}
      
      {/* 3. DIFF MODAL */}
      <Dialog 
        open={importDiffModalOpen} 
        onClose={() => setImportDiffModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontFamily: '"Playfair Display", serif' }}>
          Revisão de Dados Importados
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
            O sistema encontrou as seguintes informações no arquivo. Marque os campos que deseja aplicar ao formulário.
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={Object.values(selectedDiffFields).every(Boolean) && Object.keys(selectedDiffFields).length > 0}
                      onChange={(e) => {
                        const allSelected = e.target.checked;
                        const newSelected: Record<string, boolean> = {};
                        Object.keys(selectedDiffFields).forEach(k => { newSelected[k] = allSelected; });
                        setSelectedDiffFields(newSelected);
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: theme.palette.text.secondary, textTransform: 'uppercase', fontSize: '0.75rem' }}>Campo</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: theme.palette.text.secondary, textTransform: 'uppercase', fontSize: '0.75rem' }}>Valor Atual</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: theme.palette.text.secondary, textTransform: 'uppercase', fontSize: '0.75rem' }}>Valor Extraído</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {extractedData && Object.keys(selectedDiffFields).map(key => {
                  const currentValue = key === 'name' ? formState['full_name'] : formState[key as keyof typeof formState];
                  const extractedValue = extractedData[key];
                  
                  const formatObj = (val: any) => {
                    if (!val) return '-';
                    if (Array.isArray(val)) return val.map((item, i) => [] ).join('
');
                    if (typeof val !== 'object') return String(val);
                    return Object.entries(val)
                      .filter(([_, v]) => v !== null && v !== undefined && v !== '')
                      .map(([k, v]) => `${k.replace('data_', 'Data ').replace('sessao', 'Sessão').replace('entrada', 'Entrada').replace('loja', 'Loja').replace('processo', 'Processo').replace('registro', 'Registro')}: ${v}`)
                      .join(' | ');
                  };
                  
                  const displayExtracted = formatObj(extractedValue);
                  const displayCurrent = formatObj(currentValue);
                  
                  return (
                    <TableRow key={key} hover>
                      <TableCell padding="checkbox">
                        <Checkbox 
                          checked={!!selectedDiffFields[key]} 
                          onChange={(e) => setSelectedDiffFields({ ...selectedDiffFields, [key]: e.target.checked })}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500, color: theme.palette.primary.main }}>{diffFieldNames[key] || key}</TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{displayCurrent.split(' | ').join('\n')}</TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{displayExtracted.split(' | ').join('\n')}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          {extractedData?.warnings?.length > 0 && (
            <Box sx={{ mt: 3, p: 2, bgcolor: alpha(theme.palette.warning.main, 0.1), borderRadius: 2, border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}` }}>
              <Typography variant="subtitle2" color="warning.dark" sx={{ fontWeight: 700, mb: 1 }}>Avisos da Importação:</Typography>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: theme.palette.warning.dark, fontSize: '0.85rem' }}>
                {extractedData.warnings.map((w: string, i: number) => <li key={i}>{w}</li>)}
              </ul>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, px: 3 }}>
          <Button onClick={() => setImportDiffModalOpen(false)} color="inherit" sx={{ fontWeight: 600 }}>Cancelar</Button>
          <Button onClick={applyExtractedData} variant="contained" sx={{ fontWeight: 700, borderRadius: 2 }}>Aplicar Selecionados</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MemberForm;