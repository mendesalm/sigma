import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Grid, Card, CardContent, CardActions, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Alert, Snackbar, Chip, FormControl, InputLabel, Select, MenuItem, IconButton } from '@mui/material';
import { Add, Delete, PhotoCamera, Refresh, Edit, Close } from '@mui/icons-material';
import { getMyClassifieds, createClassified, deleteClassified, reactivateClassified, updateClassified, deleteClassifiedPhoto, addClassifiedPhotos } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

const MeusAnuncios: React.FC = () => {
  const { user } = useAuth();
  const [ads, setAds] = useState<any[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' });
  const [editingAd, setEditingAd] = useState<any | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [category, setCategory] = useState('Outros');
  const [files, setFiles] = useState<File[]>([]);

  const CATEGORIES = ['Veículos', 'Imóveis', 'Serviços', 'Vestuário', 'Eletrônicos', 'Outros'];

  useEffect(() => {
    loadMyAds();
  }, []);

  const loadMyAds = async () => {
    try {
      const response = await getMyClassifieds();
      setAds(response.data);
    } catch (error) {
      console.error("Error loading my classifieds", error);
    }
  };

  const handleOpenDialog = (ad?: any) => {
    if (ad) {
      setEditingAd(ad);
      setTitle(ad.title);
      setDescription(ad.description);
      setPrice(ad.price || '');
      setContactInfo(ad.contact_info || '');
      setContactEmail(ad.contact_email || '');
      setStreet(ad.street || '');
      setNumber(ad.number || '');
      setNeighborhood(ad.neighborhood || '');
      setCity(ad.city || '');
      setState(ad.state || '');
      setZipCode(ad.zip_code || '');
      setCategory(ad.category || 'Outros');
      setFiles([]); 
    } else {
      setEditingAd(null);
      resetForm();
      // Preencher automaticamente com dados do usuário logado ao criar novo anúncio
      if (user?.email) {
        setContactEmail(user.email);
      }
      // Telefone
      if ((user as any)?.phone) {
        setContactInfo((user as any).phone);
      }
      // Endereço (se disponível no perfil)
      if ((user as any)?.street_address) {
        setStreet((user as any).street_address);
      }
      if ((user as any)?.street_number) {
        setNumber((user as any).street_number);
      }
      if ((user as any)?.neighborhood) {
        setNeighborhood((user as any).neighborhood);
      }
      if ((user as any)?.city) {
        setCity((user as any).city);
      }
      if ((user as any)?.state) {
        setState((user as any).state);
      }
      if ((user as any)?.zip_code) {
        setZipCode((user as any).zip_code);
      }
    }
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    if (!title || !description || !contactInfo || !contactEmail) {
      setSnackbar({ open: true, message: 'Preencha os campos obrigatórios', severity: 'error' });
      return;
    }

    setLoading(true);
    try {
      if (editingAd) {
        // Update
        const updateData = {
          title,
          description,
          price: price ? parseFloat(price) : null,
          contact_info: contactInfo,
          contact_email: contactEmail,
          street,
          number,
          neighborhood,
          city,
          state,
          zip_code: zipCode,
          category
        };
        await updateClassified(editingAd.id, updateData);
        
        // Save additional files if added during edit
        if (files.length > 0) {
            const formData = new FormData();
            files.forEach((file) => {
              formData.append('files', file);
            });
            await addClassifiedPhotos(editingAd.id, formData);
        }
        
        setSnackbar({ open: true, message: 'Anúncio atualizado com sucesso!', severity: 'success' });
      } else {
        // Create
        if (files.length > 5) {
            setSnackbar({ open: true, message: 'Máximo de 5 fotos permitidas', severity: 'error' });
            setLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        if (price) formData.append('price', price);
        formData.append('contact_info', contactInfo);
        formData.append('contact_email', contactEmail);
        formData.append('street', street);
        formData.append('number', number);
        formData.append('neighborhood', neighborhood);
        formData.append('city', city);
        formData.append('state', state);
        formData.append('zip_code', zipCode);
        formData.append('category', category);
        
        files.forEach((file) => {
          formData.append('files', file);
        });

        await createClassified(formData);
        setSnackbar({ open: true, message: 'Anúncio criado com sucesso!', severity: 'success' });
      }
      
      setOpenDialog(false);
      resetForm();
      loadMyAds();
    } catch (error) {
      console.error("Error saving classified", error);
      setSnackbar({ open: true, message: 'Erro ao salvar anúncio', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este anúncio?')) {
      try {
        await deleteClassified(id);
        setSnackbar({ open: true, message: 'Anúncio excluído', severity: 'success' });
        loadMyAds();
      } catch (error) {
        console.error("Error deleting classified", error);
        setSnackbar({ open: true, message: 'Erro ao excluir anúncio', severity: 'error' });
      }
    }
  };

  const handleReactivate = async (id: number) => {
    try {
      await reactivateClassified(id);
      setSnackbar({ open: true, message: 'Anúncio reativado com sucesso!', severity: 'success' });
      loadMyAds();
    } catch (error) {
      console.error("Error reactivating classified", error);
      setSnackbar({ open: true, message: 'Erro ao reativar anúncio. Verifique se está no período de graça.', severity: 'error' });
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPrice('');
    setContactInfo('');
    setContactEmail('');
    setStreet('');
    setNumber('');
    setNeighborhood('');
    setCity('');
    setState('');
    setZipCode('');
    setCategory('Outros');
    setFiles([]);
  };

  const handleDeletePhoto = async (photoId: number) => {
    if (!editingAd) return;
    if (window.confirm('Excluir esta foto?')) {
        try {
            await deleteClassifiedPhoto(editingAd.id, photoId);
            setSnackbar({ open: true, message: 'Foto excluída', severity: 'success' });
            // Remove locally
            setEditingAd((prev: any) => ({
                ...prev,
                photos: prev.photos.filter((p: any) => p.id !== photoId)
            }));
            const response = await getMyClassifieds();
            setAds(response.data);
        } catch (error) {
            console.error(error);
            setSnackbar({ open: true, message: 'Erro ao excluir foto', severity: 'error' });
        }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const limit = editingAd ? (5 - (editingAd.photos?.length || 0)) : 5;
      
      if (selectedFiles.length > limit) {
        setSnackbar({ open: true, message: `Selecione no máximo ${limit} fotos`, severity: 'warning' });
        setFiles(selectedFiles.slice(0, limit));
      } else {
        setFiles(selectedFiles);
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff' }}>
          Meus Anúncios
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<Add />} 
          onClick={() => handleOpenDialog()}
        >
          Novo Anúncio
        </Button>
      </Box>
      <Grid container spacing={3}>
        {ads.map((ad) => (
          <Grid
            key={ad.id}
            size={{
              xs: 12,
              sm: 6,
              md: 4
            }}>
            <Card sx={{ bgcolor: '#1e293b', color: '#fff' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6">{ad.title}</Typography>
                    <Typography variant="caption" sx={{ color: theme => theme.palette.primary.main }}>{ad.category || 'Outros'}</Typography>
                  </Box>
                  <Chip 
                    label={ad.status} 
                    color={ad.status === 'ACTIVE' ? 'success' : 'error'} 
                    size="small" 
                  />
                </Box>
                <Typography variant="body2" color="rgba(255,255,255,0.7)" gutterBottom>
                  {ad.description}
                </Typography>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Expira em: {new Date(ad.expires_at).toLocaleDateString()}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" color="primary" startIcon={<Edit />} onClick={() => handleOpenDialog(ad)}>
                  Editar
                </Button>
                <Button size="small" color="error" startIcon={<Delete />} onClick={() => handleDelete(ad.id)}>
                  Excluir
                </Button>
                {ad.status === 'EXPIRED' && (
                  <Button size="small" color="primary" startIcon={<Refresh />} onClick={() => handleReactivate(ad.id)}>
                    Reativar
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingAd ? 'Editar Anúncio' : 'Novo Anúncio'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {!editingAd && (
              <Alert severity="info" sx={{ mb: 1 }}>
                Seus dados de contato e endereço foram preenchidos automaticamente do seu perfil. Você pode editá-los se necessário.
              </Alert>
            )}
            <Grid container spacing={2}>
              <Grid
                size={{
                  xs: 12
                }}>
                <TextField
                  label="Título"
                  fullWidth
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  sm: 4
                }}>
                <FormControl fullWidth>
                  <InputLabel>Categoria</InputLabel>
                  <Select
                    value={category}
                    label="Categoria"
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {CATEGORIES.map(cat => (
                      <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  sm: 8
                }}>
                <TextField
                  label="Descrição"
                  fullWidth
                  multiline
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  sm: 4
                }}>
                <TextField
                  label="Preço (R$)"
                  fullWidth
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  sm: 4
                }}>
                <TextField
                  label="Telefone"
                  fullWidth
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  required
                  placeholder="(XX) XXXXX-XXXX"
                  helperText={!editingAd && contactInfo ? "Preenchido do seu perfil. Pode editar se necessário." : ""}
                />
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  sm: 4
                }}>
                <TextField
                  label="Email"
                  fullWidth
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  required
                  helperText={!editingAd && contactEmail ? "Preenchido do seu perfil. Pode editar se necessário." : ""}
                />
              </Grid>
              
              <Grid
                size={{
                  xs: 12
                }}>
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Endereço</Typography>
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  sm: 9
                }}>
                <TextField
                  label="Rua"
                  fullWidth
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                />
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  sm: 3
                }}>
                <TextField
                  label="Número"
                  fullWidth
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                />
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  sm: 6
                }}>
                <TextField
                  label="Bairro"
                  fullWidth
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                />
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  sm: 6
                }}>
                <TextField
                  label="CEP"
                  fullWidth
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                />
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  sm: 9
                }}>
                <TextField
                  label="Cidade"
                  fullWidth
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  sm: 3
                }}>
                <TextField
                  label="UF"
                  fullWidth
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  inputProps={{ maxLength: 2 }}
                />
              </Grid>
            </Grid>
            
            {editingAd && editingAd.photos && editingAd.photos.length > 0 && (
                <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Fotos Atuais</Typography>
                    <Grid container spacing={1}>
                        {editingAd.photos.map((photo: any) => (
                            <Grid key={photo.id}>
                                <Box sx={{ position: 'relative', width: 100, height: 100, border: '1px solid #ccc', borderRadius: 1, overflow: 'hidden' }}>
                                    <img src={`${import.meta.env.VITE_API_URL}/storage/${photo.image_path}`} alt="Ad" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <IconButton 
                                      size="small" 
                                      sx={{ position: 'absolute', top: 0, right: 0, bgcolor: 'rgba(0,0,0,0.5)', color: 'white', '&:hover': { bgcolor: 'rgba(255,0,0,0.8)' } }}
                                      onClick={() => handleDeletePhoto(photo.id)}
                                    >
                                        <Close fontSize="small" />
                                    </IconButton>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            {(!editingAd || (editingAd && editingAd.photos?.length < 5)) && (
              <>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<PhotoCamera />}
                  sx={{ mt: 2 }}
                >
                  Upload Fotos (Máx {editingAd ? 5 - editingAd.photos.length : 5})
                  <input
                    type="file"
                    hidden
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </Button>
                {files.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" display="block">
                      {files.length} arquivos selecionados:
                    </Typography>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      {files.map((f, index) => (
                        <li key={index}>
                          <Typography variant="caption">{f.name} ({(f.size / 1024 / 1024).toFixed(2)} MB)</Typography>
                        </li>
                      ))}
                    </ul>
                  </Box>
                )}
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MeusAnuncios;
