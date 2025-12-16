import { useState, useEffect, useContext, useRef } from 'react';
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
  CircularProgress,
  Snackbar,
  Alert,
  FormControlLabel,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
  Divider,
  Tab, 
  Tabs, 
  ToggleButton, 
  ToggleButtonGroup
} from '@mui/material';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

// Icons
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DescriptionIcon from '@mui/icons-material/Description';

// Components
import VariablePalette from '../../components/DocumentBuilder/VariablePalette';
import RichTextVariableEditor from '../../components/DocumentBuilder/RichTextVariableEditor';

const DEFAULT_SETTINGS = {
    header: 'header_classico.html',
    body: 'template_padrao.html',
    footer: 'footer_padrao.html',
    content_template: '',
    titles_template: '',
    styles: {
        font_family: 'Arial, sans-serif',
        primary_color: '#000000',
        show_border: true,
        border_style: 'solid',
        page_margin: '1cm',
        background_color: '#ffffff',
        background_image: 'none',
        line_height: 1.5,
        page_size: 'A4',
        orientation: 'portrait',
        content_layout: 'standard', // 'standard' or 'condensed'
        show_page_numbers: true,
        page_padding: '0cm',
        border_width: '3px',
        border_color: '#000000',
        watermark_image: '',
        watermark_opacity: 0.1,
        // Granular Defaults
        header_config: {
            logo_size: '80px',
            font_size_title: '16pt',
            font_size_subtitle: '12pt',
            alignment_title: 'center',
            alignment_subtitle: 'center',
            color: null,
            background_color: 'transparent',
            background_image: '',
            background_opacity: 1.0,
            padding: '0.3cm',
            border_bottom_show: false,
            border_bottom_style: 'solid',
            border_bottom_width: '1px',
            border_bottom_color: null,
            spacing_bottom: '20px',
            logo_obedience: '',
            logo_url: null,
            font_family: null,
            line_height: 1.2
        },
        titles_config: {
            font_family: null,
            font_size: '14pt',
            color: '#000000', // Explicit black
            bold: true,
            uppercase: true, // Force uppercase
            alignment: 'center',
            line_height: 1.0, // Fixed tight spacing default
            margin_top: '10px',
            margin_bottom: '20px',
            show: true,
            background_color: 'transparent'
        },
        content_config: {
            font_family: null,
            font_size: '12pt',
            line_height: 1.5,
            spacing: '10px', // Paragraph spacing
            alignment: 'justify',
            color: '#000000',
            background_color: '#ffffff',
            background_image: '',
            padding_top: '0px'
        },
        footer_config: {
            font_size: '10pt',
            color: null,
            background_color: '#ffffff',
            background_image: '',
            spacing_top: '40px'
        }
    }
};

const DOC_TYPES = [
    { key: 'balaustre', label: 'Balaústre' },
    { key: 'prancha', label: 'Prancha' },
    { key: 'edital', label: 'Edital' },
    { key: 'convite', label: 'Convite' },
    { key: 'certificado', label: 'Certificado' }
];

const DocumentConfigPage = () => {
    const { user } = useContext(AuthContext) || {};
    const [saving, setSaving] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
    const [lodgeData, setLodgeData] = useState<any>(null);
    
    // State
    const [currentType, setCurrentType] = useState('balaustre');
    const [activeConfigTab, setActiveConfigTab] = useState(0); // 0: Layout/Timbre, 1: Conteúdo/Modelo
    const [viewMode, setViewMode] = useState<'preview' | 'editor'>('preview');
    const [contentEditMode, setContentEditMode] = useState<'content' | 'titles'>('content'); // Which template to edit in editor mode
    const [expandedAccordion, setExpandedAccordion] = useState<string | false>('page_section');

    const editorRef = useRef<any>(null);

    const [allSettings, setAllSettings] = useState({
        balaustre: { ...DEFAULT_SETTINGS },
        prancha: { ...DEFAULT_SETTINGS, styles: { ...DEFAULT_SETTINGS.styles, line_height: 2.0 } },
        edital: { ...DEFAULT_SETTINGS, styles: { ...DEFAULT_SETTINGS.styles, line_height: 1.5, show_border: true } },
        convite: { ...DEFAULT_SETTINGS, header: 'header_moderno.html', styles: { ...DEFAULT_SETTINGS.styles, font_family: "'Times New Roman', serif", show_border: true, border_style: 'double' } },
        certificado: { ...DEFAULT_SETTINGS, header: 'header_timbre.html', styles: { ...DEFAULT_SETTINGS.styles, orientation: 'landscape', show_border: true, border_style: 'solid', border_width: '5px' } }
    });

    const currentSettings = allSettings[currentType as keyof typeof allSettings];
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    // --- Effects & Data Loading ---

    useEffect(() => {
        if (user?.lodge_id) {
            fetchSettings();
        }
    }, [user]);

    // Format utility
    const fetchSettings = async () => {
        try {
            const response = await api.get(`/lodges/${user.lodge_id}`);
            setLodgeData(response.data);
            const data = response.data.document_settings;
            
            if (data && Object.keys(data).length > 0) {
                const deepMergeStyles = (defaultStyles: any, remoteStyles: any) => ({
                    ...defaultStyles,
                    ...remoteStyles,
                    header_config: { ...defaultStyles.header_config, ...(remoteStyles?.header_config || {}) },
                    titles_config: { ...defaultStyles.titles_config, ...(remoteStyles?.titles_config || {}) },
                    content_config: { ...defaultStyles.content_config, ...(remoteStyles?.content_config || {}) },
                    footer_config: { ...defaultStyles.footer_config, ...(remoteStyles?.footer_config || {}) },
                    signatures_config: { ...defaultStyles.signatures_config, ...(remoteStyles?.signatures_config || {}) },
                });

                if (!data.balaustre && !data.prancha) {
                    // Estrutura antiga migration
                    setAllSettings(prev => ({
                        ...prev,
                        balaustre: { 
                            ...prev.balaustre, 
                            ...data, 
                            styles: deepMergeStyles(prev.balaustre.styles, data.styles)
                        }
                    }));
                } else {
                    // Estrutura nova
                    setAllSettings(prev => ({
                        balaustre: { ...prev.balaustre, ...data.balaustre, styles: deepMergeStyles(prev.balaustre.styles, data.balaustre?.styles) },
                        prancha: { ...prev.prancha, ...data.prancha, styles: deepMergeStyles(prev.prancha.styles, data.prancha?.styles) },
                        edital: { ...prev.edital, ...data.edital, styles: deepMergeStyles(prev.edital.styles, data.edital?.styles) },
                        convite: { ...prev.convite, ...data.convite, styles: deepMergeStyles(prev.convite.styles, data.convite?.styles) },
                        certificado: { ...prev.certificado, ...data.certificado, styles: deepMergeStyles(prev.certificado.styles, data.certificado?.styles) }
                    }));
                }
            }
        } catch (error) {
            console.error('Erro ao buscar configurações', error);
            showSnackbar('Erro ao carregar configurações', 'error');
        }
    };

    // --- Updates Logic ---

    const updateCurrentSetting = (field: string, value: any, isStyle = false) => {
        setAllSettings(prev => {
            const typeSettings = prev[currentType as keyof typeof prev];
            const newTypeSettings = isStyle 
                ? { ...typeSettings, styles: { ...typeSettings.styles, [field]: value } }
                : { ...typeSettings, [field]: value };
            
            return { ...prev, [currentType]: newTypeSettings };
        });
    };

    const updateNestedSetting = (section: string, field: string, value: any) => {
        setAllSettings(prev => {
            const typeSettings = prev[currentType as keyof typeof prev];
            const currentStyles = typeSettings.styles;
            const currentSectionConfig = (currentStyles as any)[section] || {};
            
            const newStyles = {
                ...currentStyles,
                [section]: {
                    ...currentSectionConfig,
                    [field]: value
                }
            };
            return { ...prev, [currentType]: { ...typeSettings, styles: newStyles } };
        });
    };

    const handleTemplateChange = (html: string) => {
        if (contentEditMode === 'content') {
            updateCurrentSetting('content_template', html);
        } else {
             updateCurrentSetting('titles_template', html);
        }
    };
    
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, section: string, field: string) => {
        const file = event.target.files?.[0];
        if (!file || !user?.lodge_id) return;

        setSaving(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post(`/lodges/${user.lodge_id}/upload_asset`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const fullUrl = `${API_URL}${response.data.url}`;
            
            if (['header_config', 'content_config', 'footer_config'].includes(section)) {
                updateNestedSetting(section, field, fullUrl);
            } else {
                updateCurrentSetting(field, fullUrl, true);
            }
            showSnackbar('Upload realizado com sucesso!', 'success');
        } catch (error) {
            console.error(error);
            showSnackbar('Erro ao fazer upload da imagem.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleSave = async () => {
        if (!user?.lodge_id) return;
        setSaving(true);
        try {
            const payload = { document_settings: allSettings };
            await api.put(`/lodges/${user.lodge_id}`, payload);
            showSnackbar('Configurações salvas com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao salvar:', error);
            showSnackbar('Erro ao salvar configurações.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const showSnackbar = (message: string, severity: 'success' | 'error') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleAccordionChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
        setExpandedAccordion(isExpanded ? panel : false);
    };

    // --- Preview Logic ---

    const [previewHtml, setPreviewHtml] = useState<string>('');
    const [previewLoading, setPreviewLoading] = useState(false);

    useEffect(() => {
        const fetchPreview = async () => {
            if (viewMode === 'editor') return; // Don't fetch if editing
            setPreviewLoading(true);
            try {
                const payload = { settings: currentSettings, lodge_id: lodgeData?.id };
                const response = await api.post(`/documents/preview/${currentType}`, payload);
                setPreviewHtml(response.data.html);
            } catch (error) {
                console.error("Error preview", error);
                setPreviewHtml(`<div style="color:red;padding:20px;text-align:center">Erro ao carregar preview</div>`);
            } finally {
                setPreviewLoading(false);
            }
        };

        if (lodgeData) {
            const timer = setTimeout(fetchPreview, 800);
            return () => clearTimeout(timer);
        }
    }, [currentSettings, currentType, lodgeData, viewMode]);

    const getPaperDimensions = () => {
        const { page_size, orientation } = currentSettings.styles;
        let width = 210, height = 297; // A4
        if (page_size === 'A5') { width = 148; height = 210; }
        if (orientation === 'landscape') return { width: `${height}mm`, height: `${width}mm` };
        return { width: `${width}mm`, height: `${height}mm` };
    };

    const paperDims = getPaperDimensions();

    // --- Render Helpers ---

    const renderFileUploadControl = (label: string, section: string, field: string, currentValue: string | null | undefined, hint?: string) => (
        <Box sx={{ mb: 2 }}>
            <Typography variant="caption" gutterBottom display="block">{label}</Typography>
            {currentValue ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, p: 1, border: '1px dashed #ccc', borderRadius: 1 }}>
                    <img src={currentValue} alt="Preview" style={{ maxHeight: '60px', maxWidth: '100%', objectFit: 'contain' }} />
                    <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                        <Button component="label" variant="outlined" size="small" fullWidth sx={{ fontSize: '0.7em' }}>
                            Trocar <input type="file" hidden onChange={(e) => handleFileUpload(e, section, field)} />
                        </Button>
                        <Button variant="outlined" color="error" size="small" fullWidth sx={{ fontSize: '0.7em' }}
                            onClick={() => section === 'styles' ? updateCurrentSetting(field, null, true) : updateNestedSetting(section, field, null)}>
                            X
                        </Button>
                    </Box>
                </Box>
            ) : (
                <Button component="label" variant="outlined" size="small" fullWidth sx={{ borderStyle: 'dashed', textTransform: 'none' }} startIcon={<CloudUploadIcon />}>
                    {hint || 'Upload'}
                    <input type="file" hidden onChange={(e) => handleFileUpload(e, section, field)} />
                </Button>
            )}
        </Box>
    );

    // --- Panel Renderers ---

    const renderLayoutControls = () => (
        <Box sx={{ p: 2, overflowY: 'auto', height: '100%' }}>
            <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary', fontWeight: 'bold' }}>CONFIGURAÇÕES GERAIS (TIMBRE)</Typography>

            <Accordion expanded={expandedAccordion === 'page_section'} onChange={handleAccordionChange('page_section')}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Página e Fundo</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid container spacing={2}>
                         <Grid item xs={6}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Tamanho</InputLabel>
                                <Select value={currentSettings.styles.page_size || 'A4'} label="Tamanho" onChange={(e) => updateCurrentSetting('page_size', e.target.value, true)}>
                                    <MenuItem value="A4">A4</MenuItem>
                                    <MenuItem value="A5">A5</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Orientação</InputLabel>
                                <Select value={currentSettings.styles.orientation || 'portrait'} label="Orientação" onChange={(e) => updateCurrentSetting('orientation', e.target.value, true)}>
                                    <MenuItem value="portrait">Retrato</MenuItem>
                                    <MenuItem value="landscape">Paisagem</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                             <TextField label="Margens" size="small" fullWidth value={currentSettings.styles.page_margin || '1cm'} onChange={(e) => updateCurrentSetting('page_margin', e.target.value, true)} />
                        </Grid>
                         <Grid item xs={6}>
                             <TextField label="Cor Fundo" type="color" size="small" fullWidth value={currentSettings.styles.background_color || '#ffffff'} onChange={(e) => updateCurrentSetting('background_color', e.target.value, true)} />
                        </Grid>
                        <Grid item xs={12}>
                             {renderFileUploadControl("Imagem de Fundo (Página)", "styles", "background_image", currentSettings.styles.background_image && currentSettings.styles.background_image !== 'none' ? currentSettings.styles.background_image : null)}
                        </Grid>
                    </Grid>
                </AccordionDetails>
            </Accordion>

            <Accordion expanded={expandedAccordion === 'header_section'} onChange={handleAccordionChange('header_section')}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Cabeçalho</Typography>
                </AccordionSummary>
                <AccordionDetails>
                     <FormControl fullWidth sx={{ mb: 2 }} size="small">
                        <InputLabel>Modelo de Cabeçalho</InputLabel>
                        <Select value={currentSettings.header} label="Modelo de Cabeçalho" onChange={(e) => updateCurrentSetting('header', e.target.value)}>
                            <MenuItem value="header_timbre.html">Timbre (Logo Central)</MenuItem>
                            <MenuItem value="header_classico.html">Clássico (Logo Esquerda)</MenuItem>
                            <MenuItem value="header_invertido.html">Clássico 2 (Logo Direita)</MenuItem>
                            <MenuItem value="header_duplo.html">Duplo (Logos Laterais)</MenuItem>
                            <MenuItem value="no_header">Nenhum (Em branco)</MenuItem>
                        </Select>
                    </FormControl>
                    
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                             <TextField label="Altura Logo" size="small" fullWidth value={currentSettings.styles.header_config?.logo_size || '80px'} onChange={(e) => updateNestedSetting('header_config', 'logo_size', e.target.value)} />
                        </Grid>
                        <Grid item xs={6}>
                             <TextField label="Espaço Abaixo" size="small" fullWidth value={currentSettings.styles.header_config?.spacing_bottom || '20px'} onChange={(e) => updateNestedSetting('header_config', 'spacing_bottom', e.target.value)} />
                        </Grid>
                         <Grid item xs={12}>
                             {renderFileUploadControl("Logo Principal (Opcional)", "header_config", "logo_url", currentSettings.styles.header_config?.logo_url)}
                        </Grid>
                        {currentSettings.header === 'header_duplo.html' && (
                            <Grid item xs={12}>
                                {renderFileUploadControl("Logo Obediência (Secundário)", "header_config", "logo_obedience", currentSettings.styles.header_config?.logo_obedience)}
                            </Grid>
                        )}
                    </Grid>
                </AccordionDetails>
            </Accordion>

             <Accordion expanded={expandedAccordion === 'footer_section'} onChange={handleAccordionChange('footer_section')}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Rodapé</Typography>
                </AccordionSummary>
                <AccordionDetails>
                     <Grid container spacing={2}>
                        <Grid item xs={6}>
                             <TextField label="Espaço Acima" size="small" fullWidth value={currentSettings.styles.footer_config?.spacing_top || '40px'} onChange={(e) => updateNestedSetting('footer_config', 'spacing_top', e.target.value)} />
                        </Grid>
                         <Grid item xs={6}>
                             <FormControlLabel control={<Switch size="small" checked={currentSettings.styles.show_page_numbers} onChange={(e) => updateCurrentSetting('show_page_numbers', e.target.checked, true)} />} label="Num. Pág." />
                        </Grid>
                         <Grid item xs={12}>
                             {renderFileUploadControl("Imagem Fundo Rodapé", "footer_config", "background_image", currentSettings.styles.footer_config?.background_image)}
                        </Grid>
                    </Grid>
                </AccordionDetails>
            </Accordion>

            <Accordion expanded={expandedAccordion === 'borders_section'} onChange={handleAccordionChange('borders_section')}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Bordas e Marca d'Água</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid container spacing={2}>
                         <Grid item xs={12}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Estilo Borda</InputLabel>
                                <Select value={currentSettings.styles.show_border ? currentSettings.styles.border_style : 'none'} label="Estilo Borda" 
                                    onChange={(e) => {
                                        if (e.target.value === 'none') updateCurrentSetting('show_border', false, true);
                                        else { updateCurrentSetting('show_border', true, true); updateCurrentSetting('border_style', e.target.value, true); }
                                    }}>
                                    <MenuItem value="none">Sem Borda</MenuItem>
                                    <MenuItem value="solid">Linha Simples</MenuItem>
                                    <MenuItem value="double">Linha Dupla</MenuItem>
                                    <MenuItem value="masonic_v1">Borda Maçônica</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        {renderFileUploadControl("Marca d'Água", "styles", "watermark_image", currentSettings.styles.watermark_image)}
                        <Grid item xs={12}>
                             <Typography variant="caption">Opacidade: {Math.round((currentSettings.styles.watermark_opacity || 0.1)*100)}%</Typography>
                             <Slider size="small" value={currentSettings.styles.watermark_opacity || 0.1} min={0} max={1} step={0.05} onChange={(_, v) => updateCurrentSetting('watermark_opacity', v, true)} />
                        </Grid>
                    </Grid>
                </AccordionDetails>
            </Accordion>
        </Box>
    );

    const renderContentControls = () => (
        <Box sx={{ p: 2, overflowY: 'auto', height: '100%' }}>
            <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary', fontWeight: 'bold' }}>CONFIGURAÇÕES DE CONTEÚDO</Typography>

            <Accordion expanded={expandedAccordion === 'titles_section'} onChange={handleAccordionChange('titles_section')}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Títulos do Documento</Typography>
                </AccordionSummary>
                <AccordionDetails>
                     <FormControlLabel sx={{ mb: 2 }} control={<Switch checked={currentSettings.styles.titles_config?.show !== false} onChange={(e) => updateNestedSetting('titles_config', 'show', e.target.checked)} />} label="Exibir Títulos" />
                     
                     <Grid container spacing={2}>
                        <Grid item xs={6}>
                             <TextField label="Padding Superior" size="small" fullWidth value={currentSettings.styles.titles_config?.margin_top || '10px'} onChange={(e) => updateNestedSetting('titles_config', 'margin_top', e.target.value)} />
                        </Grid>
                        <Grid item xs={6}>
                             <TextField label="Padding Inferior" size="small" fullWidth value={currentSettings.styles.titles_config?.margin_bottom || '20px'} onChange={(e) => updateNestedSetting('titles_config', 'margin_bottom', e.target.value)} />
                        </Grid>
                        <Grid item xs={12}>
                             <TextField label="Fonte (Padrão)" size="small" fullWidth value={currentSettings.styles.titles_config?.font_size || '14pt'} onChange={(e) => updateNestedSetting('titles_config', 'font_size', e.target.value)} />
                        </Grid>
                     </Grid>

                     <Box sx={{ mt: 2, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                        <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>Personalize o texto dos títulos:</Typography>
                        <Button 
                            variant="outlined" 
                            startIcon={<EditIcon />} 
                            fullWidth 
                            size="small"
                            onClick={() => {
                                setContentEditMode('titles');
                                setViewMode('editor');
                            }}
                        >
                            Editar Modelo de Títulos
                        </Button>
                     </Box>
                </AccordionDetails>
            </Accordion>

            <Accordion expanded={expandedAccordion === 'content_section'} onChange={handleAccordionChange('content_section')}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Corpo do Texto</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid container spacing={2}>
                         <Grid item xs={12}>
                             <TextField label="Padding Superior" size="small" fullWidth value={currentSettings.styles.content_config?.padding_top || '0px'} onChange={(e) => updateNestedSetting('content_config', 'padding_top', e.target.value)} />
                        </Grid>
                    </Grid>

                     <Box sx={{ mt: 2, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                        <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>Edite a estrutura do texto e variáveis:</Typography>
                        <Button 
                            variant="contained" 
                            startIcon={<EditIcon />} 
                            fullWidth 
                            color="secondary"
                            onClick={() => {
                                setContentEditMode('content');
                                setViewMode('editor');
                            }}
                        >
                            Editar Modelo de Texto
                        </Button>
                     </Box>
                </AccordionDetails>
            </Accordion>
        </Box>
    );

    return (
        <Box sx={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
            {/* Header Toolbar */}
            <Paper elevation={2} sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <DescriptionIcon color="primary" />
                    <Typography variant="h6" component="h1">
                        Construtor de Documentos
                    </Typography>
                    <Divider orientation="vertical" flexItem />
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <Select value={currentType} onChange={(e) => setCurrentType(e.target.value)} displayEmpty>
                            {DOC_TYPES.map(t => <MenuItem key={t.key} value={t.key}>{t.label}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Box>
                <Button variant="contained" color="primary" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving}>
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
            </Paper>

            <Grid container sx={{ flexGrow: 1, overflow: 'hidden' }}>
                {/* LEFT SIDEBAR (Controls) */}
                <Grid item xs={12} md={3} lg={3} sx={{ height: '100%', borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column', bgcolor: '#f5f5f5' }}>
                    <Paper square sx={{ zIndex: 1 }}>
                        <Tabs 
                            value={activeConfigTab} 
                            onChange={(_, v) => { setActiveConfigTab(v); if (v === 0) setViewMode('preview'); }} 
                            variant="fullWidth" 
                            indicatorColor="primary"
                            textColor="primary"
                        >
                            <Tab label="Layout & Timbre" iconPosition="start" />
                            <Tab label="Conteúdo & Modelo" iconPosition="start" />
                        </Tabs>
                    </Paper>
                    
                    {activeConfigTab === 0 ? renderLayoutControls() : renderContentControls()}
                </Grid>

                {/* RIGHT MAIN AREA (Preview / Editor) */}
                <Grid item xs={12} md={9} lg={9} sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#e0e0e0' }}>
                    
                    {/* View Switcher Toolbar (Only visible in Content Tab) */}
                    {activeConfigTab === 1 && (
                         <Box sx={{ p: 1, bgcolor: '#fff', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'center' }}>
                            <ToggleButtonGroup
                                value={viewMode}
                                exclusive
                                onChange={(_, v) => v && setViewMode(v)}
                                size="small"
                            >
                                <ToggleButton value="preview">
                                    <VisibilityIcon sx={{ mr: 1 }} /> Visualizar
                                </ToggleButton>
                                <ToggleButton value="editor">
                                    <EditIcon sx={{ mr: 1 }} /> 
                                    {contentEditMode === 'content' ? 'Editor de Texto' : 'Editor de Títulos'}
                                </ToggleButton>
                            </ToggleButtonGroup>
                        </Box>
                    )}

                    {/* Content Area */}
                    <Box sx={{ flexGrow: 1, overflow: 'hidden', position: 'relative', display: 'flex', justifyContent: 'center' }}>
                        
                        {viewMode === 'preview' ? (
                            <Box sx={{ 
                                width: '100%', 
                                height: '100%', 
                                overflow: 'auto', 
                                display: 'flex', 
                                justifyContent: 'center', 
                                alignItems: 'flex-start',
                                p: 4,
                            }}>
                                {/* Scale wrapper if needed, or just paper */}
                                <Paper elevation={4} sx={{ 
                                    width: paperDims.width, 
                                    minHeight: paperDims.height,
                                    padding: currentSettings.styles.page_padding || '0cm',
                                    // Margin is simulated by the Paper's padding if we treat Paper as the Page
                                    // However, user usually expects 'page_margin' to be the distance from edge to content.
                                    // The backend HTML often doesn't have body margin.
                                    paddingLeft: currentSettings.styles.page_margin || '1cm',
                                    paddingRight: currentSettings.styles.page_margin || '1cm',
                                    paddingTop: currentSettings.styles.page_margin || '1cm',
                                    paddingBottom: currentSettings.styles.page_margin || '1cm',
                                    
                                    bgcolor: currentSettings.styles.background_color || '#fff',
                                    backgroundImage: currentSettings.styles.background_image && currentSettings.styles.background_image !== 'none' ? `url(${currentSettings.styles.background_image})` : undefined,
                                    backgroundSize: '100% 100%',
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'center',

                                    position: 'relative',
                                    boxSizing: 'border-box'
                                }}>
                                    {/* Marca d'Água */}
                                    {currentSettings.styles.watermark_image && (
                                        <div style={{
                                            position: 'absolute',
                                            top: 0, 
                                            left: 0, 
                                            right: 0, 
                                            bottom: 0,
                                            opacity: currentSettings.styles.watermark_opacity || 0.1,
                                            pointerEvents: 'none',
                                            zIndex: 0,
                                            backgroundImage: `url(${currentSettings.styles.watermark_image})`,
                                            backgroundSize: '60%', 
                                            backgroundRepeat: 'no-repeat',
                                            backgroundPosition: 'center'
                                        }}></div>
                                    )}

                                    {/* Borda Fixa (Simulação Visual) - Positioned at Margin */}
                                    {currentSettings.styles.show_border && (
                                        <div style={{
                                            position: 'absolute',
                                            top: currentSettings.styles.page_margin || '1cm',
                                            left: currentSettings.styles.page_margin || '1cm', 
                                            right: currentSettings.styles.page_margin || '1cm', 
                                            bottom: currentSettings.styles.page_margin || '1cm',
                                            border: currentSettings.styles.border_style === 'masonic_v1' 
                                                ? `${currentSettings.styles.border_width || '3px'} solid transparent`
                                                : `${currentSettings.styles.border_width || '3px'} ${currentSettings.styles.border_style} ${currentSettings.styles.border_color || currentSettings.styles.primary_color}`,
                                            borderImage: currentSettings.styles.border_style === 'masonic_v1' ? `url(/borders/border_masonic_v1.png) 30 round` : 'none',
                                            pointerEvents: 'none',
                                            zIndex: 50
                                        }} />
                                    )}

                                    {/* CSS Reset for Preview Content to match Editor */}
                                    <style>{`
                                        .preview-content p {
                                            margin-bottom: 0;
                                            margin-top: 0;
                                            line-height: 1.15;
                                            color: #000000;
                                        }
                                        .preview-content span, .preview-content div, .preview-content li {
                                            color: #000000;
                                        }
                                        /* Helper to ensure titles are uppercase in preview */
                                        .preview-title-section, .preview-content h1, .preview-content h2, .preview-content h3 {
                                            text-transform: uppercase;
                                        }
                                    `}</style>
                                    
                                    {previewLoading ? (
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '800px' }}>
                                            <CircularProgress />
                                        </Box>
                                    ) : (
                                        <div className="preview-content" style={{ position: 'relative', zIndex: 10, width: '100%', height: '100%' }} dangerouslySetInnerHTML={{ __html: previewHtml }} />
                                    )}
                                </Paper>
                            </Box>
                        ) : (
                            // EDITOR VIEW
                            <Grid container sx={{ height: '100%' }}>
                                <Grid item xs={3} sx={{ height: '100%', borderRight: '1px solid #ddd', bgcolor: '#fafafa', overflowY: 'auto' }}>
                                    <Box sx={{ p: 2 }}>
                                        <Typography variant="subtitle2" gutterBottom>Variáveis Dinâmicas</Typography>
                                        <VariablePalette 
                                            documentType={currentType} 
                                            onInsertVariable={(key) => {
                                                if(editorRef.current) {
                                                    const quill = editorRef.current.getEditor();
                                                    quill.focus();
                                                    const range = quill.getSelection(true);
                                                    // Insert the variable as a custom blot
                                                    quill.insertEmbed(range.index, 'variable', key);
                                                    // Insert a space after to ensure cursor moves out of the chip
                                                    quill.insertText(range.index + 1, ' ');
                                                    quill.setSelection(range.index + 2);
                                                }
                                            }} 
                                        />
                                    </Box>
                                </Grid>
                                <Grid item xs={9} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    <Box sx={{ p: 2, bgcolor: '#fff', borderBottom: '1px solid #eee' }}>
                                         <Typography variant="body2" color="text.secondary">
                                            Editando: <strong>{contentEditMode === 'content' ? 'Modelo do Corpo do Texto' : 'Modelo dos Títulos'}</strong>
                                         </Typography>
                                    </Box>
                                    <Box sx={{ flexGrow: 1, overflow: 'hidden', p: 2, 
                                        '& .ql-editor': contentEditMode === 'titles' ? { textTransform: 'uppercase' } : {} 
                                    }}>
                                        <RichTextVariableEditor 
                                            ref={editorRef}
                                            value={contentEditMode === 'content' ? (currentSettings.content_template || '') : (currentSettings.titles_template || '')}
                                            onChange={handleTemplateChange}
                                        />
                                    </Box>
                                </Grid>
                            </Grid>
                        )}
                    </Box>
                </Grid>
            </Grid>
            
            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
};

export default DocumentConfigPage;
