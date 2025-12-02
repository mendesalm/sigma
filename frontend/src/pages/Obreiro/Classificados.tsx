import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, CardMedia, Chip, TextField, InputAdornment, Dialog, DialogContent, DialogTitle, IconButton, MobileStepper, Button, useTheme } from '@mui/material';
import { Search, Close, LocationOn, AccessTime, KeyboardArrowLeft, KeyboardArrowRight, LocalOffer } from '@mui/icons-material';
import { getClassifieds } from '../../services/api';

const Classificados: React.FC = () => {
  const theme = useTheme();
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAd, setSelectedAd] = useState<any | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    loadAds();
  }, []);

  const loadAds = async () => {
    try {
      const response = await getClassifieds();
      setAds(response.data);
    } catch (error) {
      console.error("Error loading classifieds", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAds = ads.filter(ad => 
    ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ad.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDaysRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiration = new Date(expiresAt);
    const diffTime = expiration.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays > 0 ? diffDays : 0;
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  useEffect(() => {
    if (selectedAd) setActiveStep(0);
  }, [selectedAd]);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header with Glassmorphism */}
      <Box sx={{ 
        mb: 5, 
        p: 4, 
        borderRadius: 4,
        background: 'rgba(30, 41, 59, 0.4)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Box>
          <Typography variant="h3" sx={{ 
            fontWeight: 800, 
            background: 'linear-gradient(45deg, #90caf9 30%, #ce93d8 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1,
            letterSpacing: '-0.02em'
          }}>
            Classificados
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 400 }}>
            Oportunidades exclusivas entre irmãos
          </Typography>
        </Box>
        <TextField
          placeholder="Buscar oportunidades..."
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: 'rgba(255,255,255,0.5)' }} />
              </InputAdornment>
            ),
            sx: {
              borderRadius: 3,
              bgcolor: 'rgba(0,0,0,0.2)',
              color: '#fff',
              '& fieldset': { border: '1px solid rgba(255,255,255,0.1)' },
              '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3) !important' },
              '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main + ' !important' },
              width: { xs: '100%', sm: 350 }
            }
          }}
        />
      </Box>

      <Grid container spacing={4}>
        {filteredAds.map((ad) => (
          <Grid item xs={12} md={6} key={ad.id}>
            <Card 
              sx={{ 
                height: 600, 
                maxWidth: 800,
                mx: 'auto',
                display: 'flex', 
                flexDirection: 'column',
                // Premium Glassmorphism
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '24px',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
                color: '#fff',
                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                cursor: 'pointer',
                overflow: 'visible',
                position: 'relative',
                '&:hover': { 
                  transform: 'translateY(-8px) scale(1.01)',
                  // Glow Effect
                  boxShadow: `0 0 30px ${theme.palette.primary.main}40, 0 10px 40px rgba(0,0,0,0.5)`,
                  border: `1px solid ${theme.palette.primary.main}60`,
                  '& .MuiCardMedia-root': {
                    transform: 'scale(1.05)'
                  }
                }
              }}
              onClick={() => setSelectedAd(ad)}
            >
              <Box sx={{ 
                position: 'relative', 
                height: 380, 
                m: 2, 
                borderRadius: '16px', 
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
              }}>
                {ad.photos && ad.photos.length > 0 ? (
                  <CardMedia
                    component="img"
                    height="100%"
                    image={`${import.meta.env.VITE_API_URL}/storage/${ad.photos[0].image_path}`}
                    alt={ad.title}
                    sx={{ 
                      objectFit: 'cover',
                      transition: 'transform 0.6s ease'
                    }}
                  />
                ) : (
                  <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.3)' }}>
                    <Typography color="text.secondary">Sem Imagem</Typography>
                  </Box>
                )}
                
                {/* Price Tag */}
                <Box sx={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  bgcolor: 'rgba(0, 0, 0, 0.7)',
                  backdropFilter: 'blur(4px)',
                  px: 2,
                  py: 1,
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <LocalOffer sx={{ fontSize: 16, color: theme.palette.success.light }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#fff' }}>
                    {ad.price ? `R$ ${ad.price.toFixed(2)}` : 'A Combinar'}
                  </Typography>
                </Box>

                {/* Photo Count */}
                {ad.photos && ad.photos.length > 1 && (
                   <Box sx={{ 
                     position: 'absolute', 
                     bottom: 16, 
                     right: 16, 
                     bgcolor: 'rgba(0,0,0,0.6)', 
                     backdropFilter: 'blur(4px)',
                     px: 1.5, 
                     py: 0.5, 
                     borderRadius: '8px',
                     border: '1px solid rgba(255,255,255,0.1)'
                   }}>
                      <Typography variant="caption" color="white" fontWeight="bold">
                        +{ad.photos.length - 1} fotos
                      </Typography>
                   </Box>
                )}
              </Box>
              
              <CardContent sx={{ flexGrow: 1, px: 3, pb: 3, pt: 0 }}>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                   <Chip 
                    label={ad.lodge_name || 'Loja Externa'} 
                    size="small" 
                    icon={<LocationOn sx={{ fontSize: 14 }} />}
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.08)', 
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.05)',
                      backdropFilter: 'blur(4px)'
                    }} 
                   />
                   <Chip 
                    label={`${getDaysRemaining(ad.expires_at)} dias restantes`} 
                    size="small" 
                    icon={<AccessTime sx={{ fontSize: 14 }} />}
                    sx={{ 
                      bgcolor: 'rgba(255,152,0,0.15)', 
                      color: '#ffb74d',
                      border: '1px solid rgba(255,152,0,0.3)'
                    }}
                   />
                </Box>
                
                <Typography variant="h5" gutterBottom sx={{ 
                  color: '#fff', 
                  fontWeight: 700,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {ad.title}
                </Typography>
                
                <Typography variant="body1" sx={{ 
                  color: 'rgba(255,255,255,0.6)', 
                  mb: 2, 
                  display: '-webkit-box', 
                  WebkitLineClamp: 2, 
                  WebkitBoxOrient: 'vertical', 
                  overflow: 'hidden',
                  lineHeight: 1.6
                }}>
                  {ad.description}
                </Typography>
                
                <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LocationOn sx={{ fontSize: 14 }} />
                    {ad.city} - {ad.state}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Detail Dialog with Glassmorphism */}
      <Dialog 
        open={!!selectedAd} 
        onClose={() => setSelectedAd(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 3,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }
        }}
      >
        {selectedAd && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', pb: 2 }}>
              <Typography variant="h5" fontWeight="bold" color="white">{selectedAd.title}</Typography>
              <IconButton onClick={() => setSelectedAd(null)} sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                <Close />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ mt: 2 }}>
              <Grid container spacing={4}>
                <Grid item xs={12} md={7}>
                  <Box sx={{ 
                    mb: 2, 
                    bgcolor: '#000', 
                    borderRadius: 3, 
                    overflow: 'hidden', 
                    position: 'relative',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    {selectedAd.photos && selectedAd.photos.length > 0 ? (
                      <>
                        <img 
                          src={`${import.meta.env.VITE_API_URL}/storage/${selectedAd.photos[activeStep].image_path}`} 
                          alt={selectedAd.title}
                          style={{ width: '100%', height: 450, objectFit: 'contain', display: 'block' }}
                        />
                        {selectedAd.photos.length > 1 && (
                          <MobileStepper
                            steps={selectedAd.photos.length}
                            position="static"
                            activeStep={activeStep}
                            sx={{ 
                              bgcolor: 'transparent',
                              position: 'absolute',
                              bottom: 0,
                              width: '100%',
                              background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)'
                            }}
                            nextButton={
                              <Button
                                size="small"
                                onClick={handleNext}
                                disabled={activeStep === selectedAd.photos.length - 1}
                                sx={{ color: 'white' }}
                              >
                                Próximo
                                <KeyboardArrowRight />
                              </Button>
                            }
                            backButton={
                              <Button size="small" onClick={handleBack} disabled={activeStep === 0} sx={{ color: 'white' }}>
                                <KeyboardArrowLeft />
                                Anterior
                              </Button>
                            }
                          />
                        )}
                      </>
                    ) : (
                      <Box sx={{ height: 450, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        Sem Imagem
                      </Box>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12} md={5}>
                  <Box sx={{ 
                    p: 3, 
                    borderRadius: 3, 
                    bgcolor: 'rgba(255,255,255,0.03)', 
                    border: '1px solid rgba(255,255,255,0.05)',
                    height: '100%'
                  }}>
                    <Typography variant="h3" color="primary" sx={{ mb: 3, fontWeight: 800 }}>
                      {selectedAd.price ? `R$ ${selectedAd.price.toFixed(2)}` : 'A Combinar'}
                    </Typography>
                    
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, mb: 1 }}>Descrição</Typography>
                      <Typography variant="body1" color="text.primary" sx={{ lineHeight: 1.7 }}>{selectedAd.description}</Typography>
                    </Box>

                    <Box sx={{ mb: 4 }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, mb: 1 }}>Localização</Typography>
                      <Typography variant="body1" color="text.primary">
                        {selectedAd.street}, {selectedAd.number}<br/>
                        {selectedAd.neighborhood}<br/>
                        {selectedAd.city} - {selectedAd.state}<br/>
                        CEP: {selectedAd.zip_code}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, mb: 1 }}>Contato</Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Button variant="outlined" fullWidth sx={{ justifyContent: 'flex-start', color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}>
                          📱 {selectedAd.contact_info || 'Não informado'}
                        </Button>
                        <Button variant="outlined" fullWidth sx={{ justifyContent: 'flex-start', color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}>
                          📧 {selectedAd.contact_email || 'Não informado'}
                        </Button>
                      </Box>
                    </Box>

                    <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                      <Typography variant="caption" color="text.secondary">
                        Anunciado por membro da loja {selectedAd.lodge_name}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default Classificados;
