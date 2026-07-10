import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Tabs,
  Tab,
  TextField,
  Grid,
  IconButton,
  Avatar,
  Divider,
  useTheme,
  Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import api from '../../../shared/services/api';

interface LodgeDetailsModalProps {
  open: boolean;
  onClose: () => void;
  lodgeData: any;
  isAdmin: boolean;
  isWebmaster: boolean;
  onUpdate: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const LodgeDetailsModal: React.FC<LodgeDetailsModalProps> = ({ open, onClose, lodgeData, isAdmin, isWebmaster, onUpdate }) => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState<any>({});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (lodgeData) {
      setFormData({ ...lodgeData });
      setLogoPreview(lodgeData.logo_path ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${lodgeData.logo_path}` : null);
    }
  }, [lodgeData]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (file.type !== 'image/png') {
        setError('O arquivo deve ser no formato PNG');
        return;
      }
      
      if (file.size > 300 * 1024) {
        setError('O arquivo não pode ter mais de 300 KB');
        return;
      }

      setError('');
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');

      // Upload logo if selected
      if (selectedFile) {
        const formDataLogo = new FormData();
        formDataLogo.append('file', selectedFile);
        await api.post(`/lodges/${lodgeData.id}/logo`, formDataLogo, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      // Update lodge data (excluding read-only fields handled by backend or not updated here)
      const updateData = {
        ...formData
      };
      
      await api.put(`/lodges/${lodgeData.id}`, updateData);
      
      setIsEditing(false);
      onUpdate(); // Trigger refresh on parent
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao salvar os dados.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const canEditSuperAdmin = isAdmin && !isWebmaster; // Só SuperAdmin
  const canEditWebmaster = isAdmin || isWebmaster; // SuperAdmin e Webmaster

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Typography variant="h6" fontWeight="bold">Detalhes da Loja</Typography>
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="lodge details tabs">
          <Tab label="Dados Gerais" />
          <Tab label="Endereço" />
          <Tab label="Sessões" />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 0 }}>
        {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}
        
        {/* DADOS GERAIS */}
        <CustomTabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'center' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <Avatar
                  src={logoPreview || undefined}
                  sx={{ width: 100, height: 100, border: `2px solid ${theme.palette.divider}` }}
                  variant="rounded"
                >
                  {!logoPreview && 'LOGO'}
                </Avatar>
                {isEditing && canEditWebmaster && (
                  <IconButton
                    color="primary"
                    aria-label="upload picture"
                    component="label"
                    sx={{
                      position: 'absolute',
                      bottom: -10,
                      right: -10,
                      bgcolor: 'background.paper',
                      boxShadow: 1,
                      '&:hover': { bgcolor: 'background.paper' }
                    }}
                  >
                    <input hidden accept="image/png" type="file" onChange={handleFileChange} />
                    <PhotoCamera fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField 
                fullWidth 
                label="Nome da Loja" 
                name="lodge_name" 
                value={formData.lodge_name || ''} 
                onChange={handleInputChange}
                disabled={!isEditing || !canEditSuperAdmin} 
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField 
                fullWidth 
                label="Número" 
                name="lodge_number" 
                value={formData.lodge_number || ''} 
                onChange={handleInputChange}
                disabled={!isEditing || !canEditSuperAdmin} 
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField 
                fullWidth 
                label="Data de Fundação" 
                name="foundation_date" 
                type="date"
                value={formData.foundation_date || ''} 
                onChange={handleInputChange}
                disabled={!isEditing || !canEditSuperAdmin} 
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField 
                fullWidth 
                label="Potência" 
                name="obedience_name" 
                value={formData.obedience_name || ''} 
                disabled={true}
                helperText="Alterado via painel do SuperAdmin"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField 
                fullWidth 
                label="Potência Estadual" 
                name="subobedience_name" 
                value={formData.subobedience_name || ''} 
                disabled={true} 
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField 
                fullWidth 
                label="Rito" 
                name="rite" 
                value={formData.rite || ''} 
                onChange={handleInputChange}
                disabled={!isEditing || !canEditSuperAdmin} 
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField 
                fullWidth 
                label="CNPJ" 
                name="cnpj" 
                value={formData.cnpj || ''} 
                onChange={handleInputChange}
                disabled={!isEditing || !canEditSuperAdmin} 
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField 
                fullWidth 
                label="E-mail" 
                name="email" 
                value={formData.email || ''} 
                onChange={handleInputChange}
                disabled={!isEditing || !canEditWebmaster} 
              />
            </Grid>
          </Grid>
        </CustomTabPanel>

        {/* ENDEREÇO */}
        <CustomTabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 9 }}>
              <TextField 
                fullWidth 
                label="Endereço" 
                name="street_address" 
                value={formData.street_address || ''} 
                onChange={handleInputChange}
                disabled={!isEditing || !canEditWebmaster} 
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField 
                fullWidth 
                label="Número" 
                name="street_number" 
                value={formData.street_number || ''} 
                onChange={handleInputChange}
                disabled={!isEditing || !canEditWebmaster} 
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField 
                fullWidth 
                label="Complemento" 
                name="address_complement" 
                value={formData.address_complement || ''} 
                onChange={handleInputChange}
                disabled={!isEditing || !canEditWebmaster} 
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField 
                fullWidth 
                label="Bairro" 
                name="neighborhood" 
                value={formData.neighborhood || ''} 
                onChange={handleInputChange}
                disabled={!isEditing || !canEditWebmaster} 
              />
            </Grid>

            <Grid size={{ xs: 12, md: 5 }}>
              <TextField 
                fullWidth 
                label="Cidade" 
                name="city" 
                value={formData.city || ''} 
                onChange={handleInputChange}
                disabled={!isEditing || !canEditWebmaster} 
              />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <TextField 
                fullWidth 
                label="UF" 
                name="state" 
                value={formData.state || ''} 
                onChange={handleInputChange}
                disabled={!isEditing || !canEditWebmaster} 
              />
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <TextField 
                fullWidth 
                label="CEP" 
                name="zip_code" 
                value={formData.zip_code || ''} 
                onChange={handleInputChange}
                disabled={!isEditing || !canEditWebmaster} 
              />
            </Grid>
          </Grid>
        </CustomTabPanel>

        {/* SESSÕES */}
        <CustomTabPanel value={tabValue} index={2}>
           <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField 
                fullWidth 
                label="Dia das Sessões" 
                name="session_day" 
                value={formData.session_day || ''} 
                onChange={handleInputChange}
                disabled={!isEditing || !canEditWebmaster} 
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField 
                fullWidth 
                label="Horário das Sessões" 
                name="session_time" 
                type="time"
                value={formData.session_time || ''} 
                onChange={handleInputChange}
                disabled={!isEditing || !canEditWebmaster} 
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
             <Grid size={{ xs: 12, md: 6 }}>
              <TextField 
                fullWidth 
                label="Periodicidade" 
                name="periodicity" 
                value={formData.periodicity || ''} 
                onChange={handleInputChange}
                disabled={!isEditing || !canEditWebmaster} 
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField 
                fullWidth 
                label="Grupo Oficial do WhatsApp" 
                name="whatsapp_group_id" 
                value={formData.whatsapp_group_id || ''} 
                onChange={handleInputChange}
                disabled={!isEditing || !canEditWebmaster} 
                helperText="Link ou ID do grupo"
              />
            </Grid>
          </Grid>
        </CustomTabPanel>

      </DialogContent>
      <Divider />
      <DialogActions sx={{ p: 2 }}>
        {!isEditing ? (
          <>
            <Button onClick={onClose} color="inherit">Fechar</Button>
            {canEditWebmaster && (
              <Button variant="contained" onClick={() => setIsEditing(true)}>Editar Informações</Button>
            )}
          </>
        ) : (
          <>
            <Button onClick={() => setIsEditing(false)} color="inherit">Cancelar</Button>
            <Button variant="contained" onClick={handleSave} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default LodgeDetailsModal;
