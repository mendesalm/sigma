import React, { useEffect, useState, useContext } from 'react';
import { 
    Box, 
    Card, 
    CardActionArea, 
    CardContent, 
    Typography, 
    Grid, 
    Chip, 
    CircularProgress, 
    Alert, 
    Container, 
    Divider,
    Tabs,
    Tab
} from '@mui/material';
import { AuthContext } from '../../context/AuthContext';
import { publicationService, Publication } from '../../services/publicationService';
import IcTempoEstudos from '../../assets/images/Ic_Tempo_de_Estudos.png';

// Ensure API URL is available
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const PUBLICATION_TYPES = ['Todos', 'Regulamentos', 'Atos', 'Documentos', 'Boletins', 'Artigos'];

const MinhasPublicacoes: React.FC = () => {
    const { user } = useContext(AuthContext) || {};
    const [publications, setPublications] = useState<Publication[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentTab, setCurrentTab] = useState('Todos');

    useEffect(() => {
        const fetchPublications = async () => {
            try {
                const lodgeId = user?.lodge_id || user?.association_id;
                
                if (!lodgeId) {
                    setError("Não foi possível identificar a Loja vinculada.");
                    setLoading(false);
                    return;
                }

                const data = await publicationService.getAll(lodgeId);
                setPublications(data);
            } catch (err) {
                console.error("Erro ao buscar publicações:", err);
                setError("Erro ao carregar publicações.");
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchPublications();
        }
    }, [user]);

    const handleOpenPdf = (filePath: string) => {
        const url = `${API_URL}${filePath}`;
        window.open(url, '_blank');
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
        setCurrentTab(newValue);
    };

    const filteredPublications = currentTab === 'Todos' 
        ? publications 
        : publications.filter(pub => pub.type === currentTab);

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                <img src={IcTempoEstudos} alt="Publicações" style={{ width: 50, height: 50, objectFit: 'contain' }} />
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff' }}>
                        Publicações e Estudos
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                        Documentos, artigos e avisos oficiais da Loja
                    </Typography>
                </Box>
            </Box>

            <Tabs 
                value={currentTab} 
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ 
                    mb: 4, 
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    '& .MuiTab-root': { color: 'rgba(255,255,255,0.6)', fontWeight: 600 },
                    '& .Mui-selected': { color: '#38bdf8 !important' },
                    '& .MuiTabs-indicator': { backgroundColor: '#38bdf8' }
                }}
            >
                {PUBLICATION_TYPES.map((type) => (
                    <Tab key={type} label={type} value={type} />
                ))}
            </Tabs>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Grid container spacing={3}>
                    {filteredPublications.length === 0 ? (
                        <Grid item xs={12}>
                            <Box sx={{ textAlign: 'center', py: 5, color: 'rgba(255,255,255,0.5)' }}>
                                <Typography variant="h6">
                                    {currentTab === 'Todos' 
                                        ? "Nenhuma publicação encontrada." 
                                        : `Nenhum ${currentTab.toLowerCase()} encontrado.`}
                                </Typography>
                            </Box>
                        </Grid>
                    ) : (
                        filteredPublications.map((pub) => (
                            <Grid item xs={12} sm={6} md={4} key={pub.id}>
                                <Card 
                                    sx={{ 
                                        bgcolor: 'rgba(30, 41, 59, 0.7)', 
                                        backdropFilter: 'blur(10px)',
                                        borderRadius: 3, 
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        height: '100%',
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                                            border: '1px solid rgba(255,255,255,0.2)'
                                        }
                                    }}
                                >
                                    <CardActionArea 
                                        onClick={() => handleOpenPdf(pub.file_path)}
                                        sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start' }}
                                    >
                                        <CardContent sx={{ p: 3, width: '100%' }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                                <Chip 
                                                    label={pub.type} 
                                                    size="small" 
                                                    sx={{ 
                                                        bgcolor: 'rgba(14, 165, 233, 0.2)', 
                                                        color: '#38bdf8',
                                                        fontWeight: 600,
                                                        border: '1px solid rgba(14, 165, 233, 0.3)'
                                                    }} 
                                                />
                                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                                                    {pub.published_at 
                                                        ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(pub.published_at)) 
                                                        : '-'}
                                                </Typography>
                                            </Box>
                                            
                                            <Typography variant="h6" sx={{ 
                                                color: '#fff', 
                                                fontWeight: 600, 
                                                lineHeight: 1.3,
                                                mb: 1,
                                                minHeight: '3.9em',
                                                display: '-webkit-box',
                                                overflow: 'hidden',
                                                WebkitBoxOrient: 'vertical',
                                                WebkitLineClamp: 3
                                            }}>
                                                {pub.title}
                                            </Typography>

                                            {pub.content && (
                                                <Typography variant="body2" sx={{ 
                                                    color: 'rgba(255,255,255,0.6)',
                                                    display: '-webkit-box',
                                                    overflow: 'hidden',
                                                    WebkitBoxOrient: 'vertical',
                                                    WebkitLineClamp: 2,
                                                    mb: 2
                                                }}>
                                                    {pub.content}
                                                </Typography>
                                            )}

                                            <Box sx={{ mt: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                                                    PDF • {pub.file_size ? `${(pub.file_size / 1024 / 1024).toFixed(2)} MB` : ''} 
                                                </Typography>
                                            </Box>
                                        </CardContent>
                                    </CardActionArea>
                                </Card>
                            </Grid>
                        ))
                    )}
                </Grid>
            )}
        </Container>
    );
};

export default MinhasPublicacoes;
