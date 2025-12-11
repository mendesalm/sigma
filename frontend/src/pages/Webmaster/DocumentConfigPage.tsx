import { useState, useEffect, useContext } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  TextField,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import { Dashboard as DashboardIcon, AccountBalance as ObedienceIcon } from '@mui/icons-material';

const DOC_TYPES = [
    { key: 'balaustre', label: 'Balaústre (Ata)' },
    { key: 'prancha', label: 'Prancha / Edital' },
    { key: 'convite', label: 'Convite / Certificado' }
];

const DEFAULT_SETTINGS = {
    header: 'header_classico.html',
    body: 'template_padrao.html',
    footer: 'footer_padrao.html',
    styles: {
        font_family: 'Arial, sans-serif',
        primary_color: '#000000',
        show_border: true,
        border_style: 'solid',
        page_margin: '1cm',
        background_color: '#ffffff',
        background_image: 'none',
        line_height: 1.5
    }
};

const DocumentConfigPage = () => {
    const { user } = useContext(AuthContext) || {};
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
    
    const [currentType, setCurrentType] = useState('balaustre');
    const [allSettings, setAllSettings] = useState({
        balaustre: { ...DEFAULT_SETTINGS },
        prancha: { ...DEFAULT_SETTINGS, styles: { ...DEFAULT_SETTINGS.styles, line_height: 2.0 } },
        convite: { ...DEFAULT_SETTINGS, header: 'header_moderno.html', styles: { ...DEFAULT_SETTINGS.styles, font_family: "'Times New Roman', serif", show_border: true, border_style: 'double' } }
    });

    const currentSettings = allSettings[currentType as keyof typeof allSettings];

    useEffect(() => {
        if (user?.lodge_id) {
            fetchSettings();
        }
    }, [user]);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/lodges/${user.lodge_id}`);
            const data = response.data.document_settings;
            
            if (data && Object.keys(data).length > 0) {
                // Verificação de Migração: Se o JSON não tiver as chaves de tipo, assumimos que é tudo 'balaustre'
                // e replicamos ou mantemos defaults para os outros.
                if (!data.balaustre && !data.prancha) {
                    // Estrutura antiga detectada
                    setAllSettings(prev => ({
                        ...prev,
                        balaustre: { ...prev.balaustre, ...data, styles: { ...prev.balaustre.styles, ...data.styles } }
                    }));
                } else {
                    // Estrutura nova detectada
                    // Fazemos merge profundo seguro
                    setAllSettings(prev => ({
                        balaustre: { ...prev.balaustre, ...data.balaustre, styles: { ...prev.balaustre.styles, ...data.balaustre?.styles } },
                        prancha: { ...prev.prancha, ...data.prancha, styles: { ...prev.prancha.styles, ...data.prancha?.styles } },
                        convite: { ...prev.convite, ...data.convite, styles: { ...prev.convite.styles, ...data.convite?.styles } }
                    }));
                }
            }
        } catch (error) {
            console.error('Erro ao buscar configurações', error);
            showSnackbar('Erro ao carregar configurações', 'error');
        } finally {
            setLoading(false);
        }
    };

    const updateCurrentSetting = (field: string, value: any, isStyle = false) => {
        setAllSettings(prev => {
            const typeSettings = prev[currentType as keyof typeof prev];
            const newTypeSettings = isStyle 
                ? { ...typeSettings, styles: { ...typeSettings.styles, [field]: value } }
                : { ...typeSettings, [field]: value };
            
            return { ...prev, [currentType]: newTypeSettings };
        });
    };

    const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
        setCurrentType(newValue);
    };

    const showSnackbar = (message: string, severity: 'success' | 'error') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleSave = async () => {
        if (!user?.lodge_id) {
            showSnackbar('Erro: ID da Loja não encontrado.', 'error');
            return;
        }

        setSaving(true);
        try {
            // Envia apenas o objeto document_settings. O backend (LodgeUpdate schema) aceita atualização parcial.
            const payload = {
                document_settings: allSettings
            };
            
            await api.put(`/lodges/${user.lodge_id}`, payload);
            showSnackbar('Todas as configurações foram salvas com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao salvar configurações:', error);
            showSnackbar('Erro ao salvar. Verifique o console para mais detalhes.', 'error');
        } finally {
            setSaving(false);
        }
    };

    // Renderização do Conteúdo de Preview baseada no tipo
    const renderPreviewContent = () => {
        const styles = currentSettings.styles;
        
        if (currentType === 'convite') {
             return (
                <div style={{ textAlign: 'center', fontFamily: styles.font_family, color: styles.primary_color }}>
                    <Typography variant="h3" sx={{ fontFamily: 'cursive', mb: 4, mt: 4 }}>Convite</Typography>
                    <Typography paragraph sx={{ fontSize: '1.2em' }}>
                        O Venerável Mestre e os Obreiros da<br/>
                        <strong>A.'. R.'. L.'. S.'. EXEMPLO DE LOJA</strong><br/>
                        têm a honra de convidar Vossa Senhoria e Exma. Família para a
                    </Typography>
                    <Typography variant="h5" sx={{ my: 3, fontWeight: 'bold' }}>SESSÃO MAGNA DE ANIVERSÁRIO</Typography>
                    <Typography paragraph>
                        A realizar-se no dia 20 de Setembro de 2025, às 20h00.<br/>
                        Traje: Passeio Completo.
                    </Typography>
                </div>
            );
        }

        if (currentType === 'prancha') {
            return (
                <div style={{ textAlign: 'justify', fontFamily: styles.font_family, color: 'black' }}>
                    <div style={{ textAlign: 'right', marginBottom: '2cm' }}>
                        São Paulo, 11 de Dezembro de 2025.
                    </div>
                    <div style={{ marginBottom: '1cm' }}>
                        <strong>Aos<br/>
                        Respeitáveis Irmãos do Quadro</strong>
                    </div>
                    <Typography paragraph sx={{ textIndent: '2cm' }}>
                        <strong>ASSUNTO: Convocação para Assembleia Geral.</strong>
                    </Typography>
                    <Typography paragraph sx={{ textIndent: '2cm' }}>
                         Pela presente Prancha, comunicamos aos Amados Irmãos que no próximo dia 15 do corrente mês,
                         realizaremos nossa Assembleia Geral Ordinária para deliberar sobre assuntos administrativos
                         de vital importância para nossa Oficina.
                    </Typography>
                    <Typography paragraph sx={{ textIndent: '2cm' }}>
                        Contamos com a presença e pontualidade de todos para o brilho dos nossos trabalhos.
                    </Typography>
                    <div style={{ textAlign: 'center', marginTop: '4cm' }}>
                        <p>Fraternalmente,</p>
                        <br/><br/>
                        <strong>Secretário da Loja</strong>
                    </div>
                </div>
            );
        }

        // Padrão: Balaústre
        return (
             <div style={{ textAlign: 'justify', lineHeight: styles.line_height || 1.5 }}>
                <Typography paragraph sx={{ textIndent: '2cm' }}>
                    <strong>ASSUNTO: Exemplo de Ata (Balaústre).</strong>
                </Typography>
                <Typography paragraph sx={{ textIndent: '2cm' }}>
                    Aos onze dias do mês de dezembro do ano de dois mil e vinte e cinco, reuniram-se os Obreiros desta 
                    Augusta e Respeitável Loja Simbólica para a realização da Sessão Ordinária no Grau de Aprendiz.
                </Typography>
                <Typography paragraph sx={{ textIndent: '2cm' }}>
                    Os trabalhos foram abertos ritualisticamente pelo Venerável Mestre, que solicitou ao Irmão Secretário 
                    a leitura do Balaústre da sessão anterior, o qual foi aprovado sem emendas. O Tronco de Solidariedade 
                     circulou e colheu a quantia de x metais.
                </Typography>
                <br />
                <Typography sx={{ textAlign: 'center', mt: 4 }}>
                    ___________________________________________________<br />
                    <strong>Ven. Mestre</strong><br />
                </Typography>
            </div>
        );
    };

    if (loading) return <Box p={3}><CircularProgress /></Box>;

    return (
        <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
             <Typography variant="h5" gutterBottom sx={{ color: '#fff', mb: 2 }}>
                Construtor de Documentos
            </Typography>
            
            <Paper sx={{ mb: 2 }}>
                <Tabs value={currentType} onChange={handleTabChange} indicatorColor="primary" textColor="primary" variant="fullWidth">
                    {DOC_TYPES.map(type => (
                        <Tab key={type.key} label={type.label} value={type.key} />
                    ))}
                </Tabs>
            </Paper>
            
            <Grid container spacing={3} sx={{ flexGrow: 1 }}>
                {/* Painel de Controles (Esquerda) */}
                <Grid item xs={12} md={4} sx={{ height: '100%' }}>
                    <Paper sx={{ p: 3, height: '100%', overflowY: 'auto', bgcolor: 'background.paper' }}>
                        <Typography variant="h6" gutterBottom color="primary">
                            Configurações: {DOC_TYPES.find(t => t.key === currentType)?.label}
                        </Typography>
                        
                        <FormControl fullWidth sx={{ mb: 3 }}>
                            <InputLabel>Estilo do Cabeçalho</InputLabel>
                            <Select
                                value={currentSettings.header}
                                label="Estilo do Cabeçalho"
                                onChange={(e) => updateCurrentSetting('header', e.target.value)}
                            >
                                <MenuItem value="header_classico.html">Clássico (Brasão Central)</MenuItem>
                                <MenuItem value="header_moderno.html">Moderno (Minimalista)</MenuItem>
                                <MenuItem value="header_duplo.html">Duplo (Loja + Obediência)</MenuItem>
                            </Select>
                        </FormControl>

                        <Divider sx={{ my: 3 }} />
                        
                        <Typography variant="h6" gutterBottom color="primary">
                            Estilos e Tipografia
                        </Typography>

                         <FormControl fullWidth sx={{ mb: 3 }}>
                            <InputLabel>Fonte do Texto</InputLabel>
                            <Select
                                value={currentSettings.styles.font_family}
                                label="Fonte do Texto"
                                onChange={(e) => updateCurrentSetting('font_family', e.target.value, true)}
                            >
                                <MenuItem value="Arial, sans-serif">Arial (Padrão)</MenuItem>
                                <MenuItem value="'Times New Roman', serif">Times New Roman (Formal)</MenuItem>
                                <MenuItem value="'Roboto', sans-serif">Roboto (Moderno)</MenuItem>
                                <MenuItem value="'Great Vibes', cursive">Manuscrita (Convites)</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            label="Cor Primária (Titulos/Bordas)"
                            type="color"
                            fullWidth
                            value={currentSettings.styles.primary_color}
                            onChange={(e) => updateCurrentSetting('primary_color', e.target.value, true)}
                            sx={{ mb: 3 }}
                            InputLabelProps={{ shrink: true }}
                        />

                        <TextField
                            label="Cor de Fundo da Página"
                            type="color"
                            fullWidth
                            value={currentSettings.styles.background_color || '#ffffff'}
                            onChange={(e) => updateCurrentSetting('background_color', e.target.value, true)}
                            sx={{ mb: 3 }}
                            InputLabelProps={{ shrink: true }}
                        />

                         <FormControl fullWidth sx={{ mb: 3 }}>
                            <InputLabel>Fundo Artístico</InputLabel>
                            <Select
                                value={currentSettings.styles.background_image || 'none'}
                                label="Fundo Artístico"
                                onChange={(e) => updateCurrentSetting('background_image', e.target.value, true)}
                            >
                                <MenuItem value="none">Nenhum (Cor Sólida)</MenuItem>
                                <MenuItem value="url('/assets/bg/pergaminho.jpg')">Pergaminho Antigo</MenuItem>
                                <MenuItem value="url('/assets/bg/marmore.jpg')">Mármore</MenuItem>
                                <MenuItem value="radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(200,200,200,0.5) 100%)">Gradiente Radial</MenuItem>
                                <MenuItem value="repeating-linear-gradient(45deg, #f0f0f0, #f0f0f0 10px, #ffffff 10px, #ffffff 20px)">Hachura Suave</MenuItem>
                            </Select>
                        </FormControl>

                         <FormControl fullWidth sx={{ mb: 3 }}>
                            <InputLabel>Exibir Borda</InputLabel>
                            <Select
                                value={currentSettings.styles.show_border ? 'yes' : 'no'}
                                label="Exibir Borda"
                                onChange={(e) => updateCurrentSetting('show_border', e.target.value === 'yes', true)}
                            >
                                <MenuItem value="yes">Sim, exibir borda</MenuItem>
                                <MenuItem value="no">Não, remover borda</MenuItem>
                            </Select>
                        </FormControl>

                        {currentSettings.styles.show_border && (
                            <FormControl fullWidth sx={{ mb: 3 }}>
                                <InputLabel>Estilo da Borda</InputLabel>
                                <Select
                                    value={currentSettings.styles.border_style || 'solid'}
                                    label="Estilo da Borda"
                                    onChange={(e) => updateCurrentSetting('border_style', e.target.value, true)}
                                >
                                    <MenuItem value="solid">Sólida Simples</MenuItem>
                                    <MenuItem value="double">Borda Dupla</MenuItem>
                                    <MenuItem value="groove">Borda em Relevo</MenuItem>
                                    <MenuItem value="dotted">Pontilhada</MenuItem>
                                </Select>
                            </FormControl>
                        )}
                        
                         <FormControl fullWidth sx={{ mb: 3 }}>
                            <InputLabel>Fina (Padding Interno)</InputLabel>
                             {/* Nota: Padding fixo 0.3cm por enquanto, mas poderia ser slider */}
                             <Select disabled value="0.3cm" label="Fina (Padding Interno)">
                                <MenuItem value="0.3cm">Padrão (0.3cm)</MenuItem>
                             </Select>
                        </FormControl>

                        <FormControl fullWidth sx={{ mb: 3 }}>
                            <InputLabel>Espaçamento entre Linhas</InputLabel>
                            <Select
                                value={currentSettings.styles.line_height || 1.5}
                                label="Espaçamento entre Linhas"
                                onChange={(e) => updateCurrentSetting('line_height', e.target.value, true)}
                            >
                                <MenuItem value={1.0}>Simples (1.0)</MenuItem>
                                <MenuItem value={1.15}>Normal (1.15)</MenuItem>
                                <MenuItem value={1.5}>Padrão ABNT (1.5)</MenuItem>
                                <MenuItem value={2.0}>Duplo (2.0)</MenuItem>
                            </Select>
                        </FormControl>

                         <FormControl fullWidth sx={{ mb: 3 }}>
                            <InputLabel>Margem da Página</InputLabel>
                            <Select
                                value={currentSettings.styles.page_margin}
                                label="Margem da Página"
                                onChange={(e) => updateCurrentSetting('page_margin', e.target.value, true)}
                            >
                                <MenuItem value="1cm">Normal (1cm)</MenuItem>
                                <MenuItem value="2.5cm">Larga (2.5cm)</MenuItem>
                                <MenuItem value="0.5cm">Estreita (0.5cm)</MenuItem>
                            </Select>
                        </FormControl>

                        <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                            <Button 
                                variant="contained" 
                                color="primary" 
                                fullWidth 
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? 'Salvando...' : 'Salvar Configurações'}
                            </Button>
                        </Box>
                    </Paper>
                </Grid>

                {/* Painel de Preview (Direita) */}
                <Grid item xs={12} md={8} sx={{ height: '100%' }}>
                     <Paper sx={{ 
                         p: 0, 
                         height: '100%', 
                         bgcolor: '#525659', 
                         display: 'flex', 
                         alignItems: 'center', 
                         justifyContent: 'center',
                         overflow: 'hidden',
                         border: '1px solid #444'
                     }}>
                        <Paper sx={{ 
                            width: '210mm', 
                            height: currentType === 'convite' ? '148mm' : '297mm', 
                            bgcolor: currentSettings.styles.background_color || 'white', 
                            backgroundImage: currentSettings.styles.background_image !== 'none' ? currentSettings.styles.background_image : undefined,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            transform: currentType === 'convite' ? 'scale(1)' : 'scale(0.85)', 
                            transformOrigin: 'top center',
                            mt: 4,
                            mx: 'auto',
                            boxShadow: '0 0 20px rgba(0,0,0,0.5)',
                            position: 'relative',
                            color: 'black',
                            fontFamily: currentSettings.styles.font_family.split(',')[0],
                            p: currentSettings.styles.page_margin,
                            overflow: 'hidden',
                            lineHeight: currentSettings.styles.line_height || 1.5
                        }}>
                             {currentSettings.styles.show_border && (
                                <div style={{ 
                                    borderWidth: currentSettings.styles.border_style === 'double' ? '3px' : '2px',
                                    borderStyle: currentSettings.styles.border_style || 'solid',
                                    borderColor: currentSettings.styles.primary_color, 
                                    position: 'absolute', 
                                    top: '1cm', left: '1cm', right: '1cm', bottom: '1cm',
                                    pointerEvents: 'none'
                                }} />
                            )}
                            
                            <div style={{ padding: '0.3cm', height: '100%', boxSizing: 'border-box' }}>
                                {/* Header renderizado condicionalmente */}
                                {currentSettings.header === 'header_duplo.html' ? (
                                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: currentType === 'convite' ? '0.5cm' : '1.5cm', borderBottom: `1px solid ${currentSettings.styles.primary_color}`, paddingBottom: '10px' }}>
                                        {/* Logo Esquerda (Loja) */}
                                        <Box sx={{ width: '60px', textAlign: 'center' }}>
                                            <DashboardIcon sx={{ fontSize: 50, color: currentSettings.styles.primary_color }} />
                                            <Typography variant="caption" sx={{ fontSize: '0.6em', display: 'block' }}>LOJA</Typography>
                                        </Box>
                                        
                                        {/* Centro (Títulos) */}
                                        <div style={{ textAlign: 'center', flex: 1 }}>
                                            <Typography variant="h6" sx={{ color: currentSettings.styles.primary_color, fontWeight: 'bold', lineHeight: 1.2, textTransform: 'uppercase' }}>
                                                A.'. R.'. L.'. S.'. EXEMPLO DE LOJA
                                            </Typography>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                                Nº 1.234
                                            </Typography>
                                            <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                                                ORIENTE DE SÃO PAULO
                                            </Typography>
                                        </div>

                                        {/* Logo Direita (Obediência) */}
                                        <Box sx={{ width: '60px', textAlign: 'center' }}>
                                            <ObedienceIcon sx={{ fontSize: 50, color: '#1a237e' }} />
                                            <Typography variant="caption" sx={{ fontSize: '0.6em', display: 'block' }}>POTÊNCIA</Typography>
                                        </Box>
                                     </div>
                                ) : (
                                    <div style={{ textAlign: 'center', marginBottom: currentType === 'convite' ? '1cm' : '1.5cm' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
                                            <DashboardIcon sx={{ fontSize: 60, color: currentSettings.styles.primary_color }} />
                                        </Box>
                                        <Typography variant="h5" sx={{ color: currentSettings.styles.primary_color, fontWeight: 'bold', mb: 0.5, textTransform: 'uppercase' }}>
                                            CABEÇALHO {currentSettings.header.includes('classico') ? 'CLÁSSICO' : 'MODERNO'}
                                        </Typography>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                                            ARLS "EXEMPLO DE LOJA" Nº 1.234
                                        </Typography>
                                        <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                                            ORIENTE DE SÃO PAULO - RITO ESCOCÊS ANTIGO E ACEITO
                                        </Typography>
                                    </div>
                                )}

                                {/* Conteúdo Contextual */}
                                {renderPreviewContent()}
                            </div>

                            {/* Footer */}
                            <div style={{ position: 'absolute', bottom: '1.5cm', left: 0, width: '100%', textAlign: 'center' }}>
                                    <Divider sx={{ width: '80%', mx: 'auto', mb: 1 }} />
                                <Typography variant="caption" sx={{ color: '#666' }}>
                                    Documento gerado eletronicamente pelo Sistema Sigma.
                                </Typography>
                            </div>
                        </Paper>
                     </Paper>
                </Grid>
            </Grid>

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default DocumentConfigPage;
