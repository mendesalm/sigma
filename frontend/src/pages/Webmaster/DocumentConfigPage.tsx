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
import FormatColorResetIcon from '@mui/icons-material/FormatColorReset';
import DescriptionIcon from '@mui/icons-material/Description';

// Components
import VariablePalette from '../../components/DocumentBuilder/VariablePalette';
import RichTextVariableEditor from '../../components/DocumentBuilder/RichTextVariableEditor';



interface DocumentSettings {
    header: string;
    body: string;
    footer: string;
    content_template: string;
    titles_template: string;
    header_template: string;
    footer_template: string;
    styles: {
        font_family: string;
        primary_color: string;
        show_border: boolean;
        border_style: string;
        border_width: string;
        border_color: string;
        page_size: string;
        orientation: 'portrait' | 'landscape';
        page_margin: string;
        line_height: number;
        background_color: string;
        background_image: string;
        image_opacity?: number; // Added for generic image opacity
        page_padding: string; // Added explicitly
        watermark_image: string;
        watermark_opacity: number;
        content_layout: 'standard' | 'condensed';
        show_page_numbers: boolean;
        header_config: any;
        titles_config: any;
        content_config: any;
        signatures_config: any;
        footer_config: any;
    };
}
const DEFAULT_SETTINGS = {
    header: 'header_universal.html',
    body: 'template_padrao.html',
    footer: 'footer_padrao.html',
    content_template: '',
    titles_template: '',
    header_template: '',
    footer_template: '',
    styles: {
        font_family: 'Arial, sans-serif',
        primary_color: '#000000',
        show_border: true,
        border_style: 'solid',
        border_width: '3px',
        border_color: '#000000',
        page_margin: '1cm',
        background_color: '#ffffff',
        background_image: 'none',
        image_opacity: 1.0,
        page_padding: '0cm',
        watermark_image: '',
        watermark_opacity: 0.1,
        line_height: 1.5,
        page_size: 'A4',
        orientation: 'portrait',
        content_layout: 'standard', // 'standard' or 'condensed'
        show_page_numbers: true,
        header_config: {
            layout_mode: 'classic',
            logo_size: '80px',
            logo_url: '',
            logo_obedience: '',
            font_size_title: '16pt',
            font_size_subtitle: '12pt',
            color_title: '',
            color_subtitle: '',
            margin_title: '0',
            margin_subtitle: '5px 0 0 0',
            spacing_bottom: '20px',
            background_color: '',
            background_image: '',
            image_opacity: 1.0,
            show_affiliations: true,
            custom_title_text: '',
            custom_subtitle_text: ''
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
            background_color: 'transparent',
            background_image: '',
            image_opacity: 1.0
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
            image_opacity: 1.0,
            padding_top: '0px'
        },
        footer_config: {
            font_size: '10pt',
            color: null,
            background_color: '#ffffff',
            background_image: '',
            image_opacity: 1.0,
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
    const [contentEditMode, setContentEditMode] = useState<'content' | 'titles' | 'header' | 'footer'>('content'); // Which template to edit in editor mode
    const [expandedAccordion, setExpandedAccordion] = useState<string | false>('page_section');

    const editorRef = useRef<any>(null);

    const [allSettings, setAllSettings] = useState({
        balaustre: { 
            ...DEFAULT_SETTINGS,
            content_template: `
<p style="text-align: justify;"><strong>ABERTURA:</strong> Aos {{ DiaSessao }}, às {{ HoraInicioSessao }}, reuniu-se a {{ TituloLoja }} {{ NomeLoja }} nº {{ NumeroLoja }}, no seu Templo sito à {{ EnderecoLoja }}, sob a presidência do Venerável Mestre {{ Veneravel }}.</p>

<p style="text-align: justify;"><strong>COMPOSIÇÃO:</strong> Os cargos em Loja foram preenchidos pelos Irmãos: 1º Vig. {{ PrimeiroVigilante }}, 2º Vig. {{ SegundoVigilante }}, Orador {{ Orador }}, Secretário {{ Secretario }}, Tesoureiro {{ Tesoureiro }}, Chanceler {{ Chanceler }}, Hospitaleiro {{ Hospitaleiro }}.</p>

<p style="text-align: justify;"><strong>BALAÚSTRE:</strong> {{ BalaustreAnterior }}</p>

<p style="text-align: justify;"><strong>EXPEDIENTE RECEBIDO:</strong> {{ ExpedienteRecebido }}</p>

<p style="text-align: justify;"><strong>EXPEDIENTE EXPEDIDO:</strong> {{ ExpedienteExpedido }}</p>

<p style="text-align: justify;"><strong>SACO DE PROPOSTAS E INFORMAÇÕES:</strong> {{ SacoProposta }}</p>

<p style="text-align: justify;"><strong>ORDEM DO DIA:</strong> {{ OrdemDia }}</p>

<p style="text-align: justify;"><strong>TEMPO DE INSTRUÇÃO:</strong> {{ TempoInstrucao }}</p>

<p style="text-align: justify;"><strong>TRONCO DE BENEFICÊNCIA:</strong> {{ Tronco }}</p>

<p style="text-align: justify;"><strong>PALAVRA A BEM DA ORDEM:</strong> {{ Palavra }}</p>

<p style="text-align: justify;"><strong>ENCERRAMENTO:</strong> Nada mais havendo a tratar, a sessão foi encerrada às {{ Encerramento }}.</p>
            `.trim()
        },
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
            const HEADER_TEMPLATES: Record<string, string> = {
    'classic': `
<div style="display: flex; align-items: center; justify-content: flex-start;">
    <div style="width: 120px; text-align: center; margin-right: 15px;">
        <img src="{{ header_image }}" style="width: 80px; height: auto;" />
    </div>
    <div style="flex-grow: 1; text-align: center;">
        <p style="font-size: 16pt; font-weight: bold; text-transform: uppercase; margin: 0; line-height: 1.2;">
            {{ lodge_title_formatted }} {{ lodge_name }} Nº {{ lodge_number }}
        </p>
        <p style="font-size: 12pt; margin: 5px 0 0 0; line-height: 1.2;">
            Federada ao {{ lodge_obedience }}<br>
            Jurisdicionada ao {{ lodge_subobedience }}
        </p>
    </div>
</div>`,
    'inverted': `
<div style="display: flex; align-items: center; justify-content: flex-end;">
    <div style="flex-grow: 1; text-align: center; margin-right: 15px;">
        <p style="font-size: 16pt; font-weight: bold; text-transform: uppercase; margin: 0; line-height: 1.2;">
            {{ lodge_title_formatted }} {{ lodge_name }} Nº {{ lodge_number }}
        </p>
        <p style="font-size: 12pt; margin: 5px 0 0 0; line-height: 1.2;">
            Federada ao {{ lodge_obedience }}<br>
            Jurisdicionada ao {{ lodge_subobedience }}
        </p>
    </div>
    <div style="width: 120px; text-align: center;">
        <img src="{{ header_image }}" style="width: 80px; height: auto;" />
    </div>
</div>`,
    'modern': `
<div style="display: flex; align-items: center; justify-content: space-between;">
    <div style="flex-grow: 1; text-align: left;">
        <p style="font-size: 12pt; font-weight: bold; text-transform: uppercase; margin: 0; line-height: 1.2;">
            À GL∴ DO SUPR∴ ARQ∴ DO UNIV'∴<br>
            {{ lodge_title_formatted }} {{ lodge_name }} Nº {{ lodge_number }}
        </p>
        <p style="font-size: 12pt; font-weight: bold; text-transform: uppercase; margin: 5px 0 0 0; line-height: 1.2;">
            BALAÚSTRE DA {{ session_number }}ª SESSÃO DO E∴ M∴ {{ exercicio_maconico }}
        </p>
    </div>
    <div style="width: 120px; text-align: right;">
        <img src="{{ header_image }}" style="width: 80px; height: auto;" />
    </div>
</div>`,
    'double': `
<div style="display: flex; align-items: center; justify-content: space-between;">
    <div style="width: 120px; text-align: left;">
        <img src="{{ footer_image }}" style="width: 80px; height: auto;" alt="Potencia"/>
    </div>
    <div style="flex-grow: 1; text-align: center; margin: 0 15px;">
        <p style="font-size: 16pt; font-weight: bold; text-transform: uppercase; margin: 0; line-height: 1.2;">
            {{ lodge_title_formatted }} {{ lodge_name }} Nº {{ lodge_number }}
        </p>
        <p style="font-size: 12pt; margin: 5px 0 0 0; line-height: 1.2;">
            Federada ao {{ lodge_obedience }}<br>
            Jurisdicionada ao {{ lodge_subobedience }}
        </p>
    </div>
    <div style="width: 120px; text-align: right;">
        <img src="{{ header_image }}" style="width: 80px; height: auto;" alt="Loja"/>
    </div>
</div>`
};


            
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

    const renderColorControl = (label: string, section: string, field: string, currentValue: string | undefined) => {
        // Handle "transparent" specifically for the color input which expects hex
        const displayColor = currentValue === 'transparent' ? '#ffffff' : (currentValue || '#ffffff');
        
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextField 
                    label={label} 
                    type="color" 
                    size="small" 
                    fullWidth 
                    value={displayColor}
                    onChange={(e) => section === 'styles' ? updateCurrentSetting(field, e.target.value, true) : updateNestedSetting(section as any, field, e.target.value)} 
                    disabled={currentValue === 'transparent'}
                />
                <Button 
                    variant={currentValue === 'transparent' ? "contained" : "outlined"}
                    size="small"
                    color={currentValue === 'transparent' ? "success" : "primary"}
                    onClick={() => {
                        const newValue = currentValue === 'transparent' ? '#ffffff' : 'transparent';
                        section === 'styles' ? updateCurrentSetting(field, newValue, true) : updateNestedSetting(section as any, field, newValue);
                    }}
                    sx={{ minWidth: '40px', px: 1 }}
                    title="Alternar Transparência"
                >
                    <FormatColorResetIcon />
                </Button>
            </Box>
        );
    };

    const renderFileUploadControl = (label: string, section: string, field: string, currentValue: string | null | undefined, hint?: string, opacityField?: string, currentOpacity?: number) => (
        <Box sx={{ mb: 2 }}>
            <Typography variant="caption" gutterBottom display="block">{label}</Typography>
            {currentValue ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, p: 1, border: '1px dashed #ccc', borderRadius: 1 }}>
                    <img src={currentValue} alt="Preview" style={{ maxHeight: '60px', maxWidth: '100%', objectFit: 'contain' }} />
                    <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                        <Button component="label" variant="outlined" size="small" fullWidth sx={{ fontSize: '0.7em' }}>
                            Trocar <input type="file" hidden onChange={(e) => handleFileUpload(e, section as any, field)} />
                        </Button>
                        <Button variant="outlined" color="error" size="small" fullWidth sx={{ fontSize: '0.7em' }}
                            onClick={() => section === 'styles' ? updateCurrentSetting(field, null, true) : updateNestedSetting(section as any, field, null)}>
                            X
                        </Button>
                    </Box>
                    {opacityField && (
                        <Box sx={{ width: '100%', px: 1 }}>
                             <Typography variant="caption">Opacidade: {Math.round((currentOpacity ?? 1) * 100)}%</Typography>
                             <Slider 
                                size="small" 
                                value={currentOpacity ?? 1} 
                                min={0} 
                                max={1} 
                                step={0.05} 
                                onChange={(_, v) => section === 'styles' ? updateCurrentSetting(opacityField, v, true) : updateNestedSetting(section as any, opacityField, v)} 
                             />
                        </Box>
                    )}
                </Box>
            ) : (
                <Button component="label" variant="outlined" size="small" fullWidth sx={{ borderStyle: 'dashed', textTransform: 'none' }} startIcon={<CloudUploadIcon />}>
                    {hint || 'Upload'}
                    <input type="file" hidden onChange={(e) => handleFileUpload(e, section as any, field)} />
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
                             {renderColorControl("Cor Fundo", "styles", "background_color", currentSettings.styles.background_color)}
                        </Grid>
                        <Grid item xs={12}>
                             {renderFileUploadControl("Imagem de Fundo (Página)", "styles", "background_image", currentSettings.styles.background_image && currentSettings.styles.background_image !== 'none' ? currentSettings.styles.background_image : null, undefined, "image_opacity", currentSettings.styles.image_opacity)}
                        </Grid>
                    </Grid>
                </AccordionDetails>
            </Accordion>

            <Accordion expanded={expandedAccordion === 'header_section'} onChange={handleAccordionChange('header_section')}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Cabeçalho</Typography>
                </AccordionSummary>
                <AccordionDetails>

                    <Box sx={{ mb: 3 }}>
                         <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold', mb: 1, display: 'block' }}>LAYOUT</Typography>
                         <ToggleButtonGroup
                            value={currentSettings.styles.header_config?.layout_mode || 'classic'}
                            exclusive
                            onChange={(_, newVal) => {
                                if (newVal) updateNestedSetting('header_config', 'layout_mode', newVal);
                            }}
                            fullWidth
                            size="small"
                        >
                            <ToggleButton value="timbre">Timbre</ToggleButton>
                            <ToggleButton value="classic">Clássico</ToggleButton>
                            <ToggleButton value="inverted">Invertido</ToggleButton>
                            <ToggleButton value="double">Duplo</ToggleButton>
                        </ToggleButtonGroup>
                        <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center' }}>
                             <ToggleButtonGroup
                                value={currentSettings.styles.header_config?.layout_mode || 'classic'}
                                exclusive
                                onChange={(_, newVal) => {
                                    if (newVal) updateNestedSetting('header_config', 'layout_mode', newVal);
                                }}
                                size="small"
                            >
                                <ToggleButton value="centered_stack" sx={{ px: 4 }}>Empilhado (Vertical)</ToggleButton>
                            </ToggleButtonGroup>
                        </Box>
                    </Box>
                    
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold', mt: 2, mb: 1, display: 'block' }}>LOGO</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                             <TextField label="Tamanho (px ou %)" size="small" fullWidth value={currentSettings.styles.header_config?.logo_size || '80px'} onChange={(e) => updateNestedSetting('header_config', 'logo_size', e.target.value)} />
                        </Grid>
                    </Grid>
                    <Box sx={{ mt: 1 }}>
                         {currentSettings.styles.header_config?.layout_mode === 'double' ? (
                            <Grid container spacing={2}>
                                <Grid item xs={12}>{renderFileUploadControl("Logo Esq", "header_config", "logo_url", currentSettings.styles.header_config?.logo_url)}</Grid>
                                <Grid item xs={12}>{renderFileUploadControl("Logo Dir (Secundário)", "header_config", "logo_obedience", currentSettings.styles.header_config?.logo_obedience)}</Grid>
                            </Grid>
                        ) : (
                            renderFileUploadControl("Arquivo de Logo", "header_config", "logo_url", currentSettings.styles.header_config?.logo_url)
                        )}
                    </Box>


                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold', mt: 3, mb: 1, display: 'block' }}>NOME DA LOJA (TÍTULO)</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                             <TextField label="Tamanho Fonte" size="small" fullWidth value={currentSettings.styles.header_config?.font_size_title || '16pt'} onChange={(e) => updateNestedSetting('header_config', 'font_size_title', e.target.value)} />
                        </Grid>
                        <Grid item xs={6}>
                            {renderColorControl("Cor Título", "header_config", "color_title", currentSettings.styles.header_config?.color_title)}
                        </Grid>
                         <Grid item xs={12}>
                             <TextField label="Margem (ex: 0 0 5px 0)" size="small" fullWidth value={currentSettings.styles.header_config?.margin_title || ''} onChange={(e) => updateNestedSetting('header_config', 'margin_title', e.target.value)} placeholder="Top Right Bottom Left" helperText="Espaçamento CSS (ex: 0px 0px 10px 0px)" />
                         </Grid>
                        <Grid item xs={12}>
                             <TextField label="Texto Fixo (Opcional)" size="small" fullWidth value={currentSettings.styles.header_config?.custom_title_text || ''} onChange={(e) => updateNestedSetting('header_config', 'custom_title_text', e.target.value)} placeholder="Sobrescreve o nome da loja padrão" helperText="Deixe vazio para usar o automático" />
                        </Grid>
                    </Grid>

                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold', mt: 3, mb: 1, display: 'block' }}>AFILIAÇÕES (SUBTÍTULO)</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                             <TextField label="Tamanho Fonte" size="small" fullWidth value={currentSettings.styles.header_config?.font_size_subtitle || '12pt'} onChange={(e) => updateNestedSetting('header_config', 'font_size_subtitle', e.target.value)} />
                        </Grid>
                         <Grid item xs={6}>
                            {renderColorControl("Cor Subtítulo", "header_config", "color_subtitle", currentSettings.styles.header_config?.color_subtitle)}
                        </Grid>
                         <Grid item xs={12}>
                             <TextField label="Margem" size="small" fullWidth value={currentSettings.styles.header_config?.margin_subtitle || ''} onChange={(e) => updateNestedSetting('header_config', 'margin_subtitle', e.target.value)} />
                         </Grid>
                        <Grid item xs={12}>
                             <TextField label="Texto Fixo (Opcional)" size="small" fullWidth value={currentSettings.styles.header_config?.custom_subtitle_text || ''} onChange={(e) => updateNestedSetting('header_config', 'custom_subtitle_text', e.target.value)} placeholder="Sobrescreve as afiliações padrão" helperText="Deixe vazio para usar o automático" />
                        </Grid>
                    </Grid>

                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold', mt: 3, mb: 1, display: 'block' }}>GERAL</Typography>
                     <Grid container spacing={2}>
                        <Grid item xs={6}>
                             <TextField label="Espaço Abaixo Cabeçalho" size="small" fullWidth value={currentSettings.styles.header_config?.spacing_bottom || '20px'} onChange={(e) => updateNestedSetting('header_config', 'spacing_bottom', e.target.value)} />
                        </Grid>
                        <Grid item xs={12}>
                              {renderColorControl("Fundo Cabeçalho", "header_config", "background_color", currentSettings.styles.header_config?.background_color)}
                        </Grid>
                        <Grid item xs={12}>
                              {renderFileUploadControl("Imagem Fundo", "header_config", "background_image", currentSettings.styles.header_config?.background_image, undefined, "image_opacity", currentSettings.styles.header_config?.image_opacity)}
                        </Grid>
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
                             {renderColorControl("Cor Fundo Rodapé", "footer_config", "background_color", currentSettings.styles.footer_config?.background_color)}
                        </Grid>
                         <Grid item xs={12}>
                             {renderFileUploadControl("Imagem Fundo Rodapé", "footer_config", "background_image", currentSettings.styles.footer_config?.background_image, undefined, "image_opacity", currentSettings.styles.footer_config?.image_opacity)}
                        </Grid>
                    </Grid>

                     <Box sx={{ mt: 2, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                        <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>Personalize o conteúdo do rodapé:</Typography>
                        <Button 
                            variant="outlined" 
                            startIcon={<EditIcon />} 
                            fullWidth 
                            size="small"
                            onClick={() => {
                                setContentEditMode('footer');
                                setViewMode('editor');
                            }}
                        >
                            Editar Modelo de Rodapé
                        </Button>
                     </Box>
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
                                    <MenuItem value="masonic_v2">Borda Maçônica V2</MenuItem>
                                    <MenuItem value="masonic_v1">Borda Maçônica</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            {renderFileUploadControl("Marca d'Água", "styles", "watermark_image", currentSettings.styles.watermark_image)}
                        </Grid>
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
                         <Grid item xs={12}>
                             {renderColorControl("Cor Fundo Títulos", "titles_config", "background_color", currentSettings.styles.titles_config?.background_color)}
                        </Grid>
                         <Grid item xs={12}>
                             {renderFileUploadControl("Imagem Fundo Títulos", "titles_config", "background_image", currentSettings.styles.titles_config?.background_image, undefined, "image_opacity", currentSettings.styles.titles_config?.image_opacity)}
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
                         <Grid item xs={6}>
                             <TextField label="Padding Superior" size="small" fullWidth value={currentSettings.styles.content_config?.padding_top || '0px'} onChange={(e) => updateNestedSetting('content_config', 'padding_top', e.target.value)} />
                        </Grid>
                         <Grid item xs={6}>
                             {renderColorControl("Cor Fundo Conteúdo", "content_config", "background_color", currentSettings.styles.content_config?.background_color)}
                        </Grid>
                        <Grid item xs={12}>
                             {renderFileUploadControl("Imagem Fundo Conteúdo", "content_config", "background_image", currentSettings.styles.content_config?.background_image, undefined, "image_opacity", currentSettings.styles.content_config?.image_opacity)}
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
                <Grid item xs={12} md={3} lg={3} sx={{ height: '100%', borderRight: '1px solid #1e293b', display: 'flex', flexDirection: 'column', bgcolor: '#0f172a' }}>
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
                <Grid item xs={12} md={9} lg={9} sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#0a101f' }}>
                    
                    {/* View Switcher Toolbar (Visible in Content Tab OR when in Editor Mode) */}
                    {(activeConfigTab === 1 || viewMode === 'editor') && (
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
                                <Grid item xs={3} sx={{ height: '100%', borderRight: '1px solid #334155', bgcolor: '#1e293b', overflowY: 'auto' }}>
                                    <Box sx={{ p: 2 }}>
                                        <Typography variant="subtitle2" gutterBottom sx={{ color: '#e2e8f0' }}>Variáveis Dinâmicas</Typography>
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
                                    <Box sx={{ p: 2, bgcolor: '#1e293b', borderBottom: '1px solid #334155' }}>
                                         <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                                            Editando: <strong style={{ color: '#e2e8f0' }}>{
                                                contentEditMode === 'content' ? 'Modelo do Corpo do Texto' : 
                                                contentEditMode === 'titles' ? 'Modelo dos Títulos' :
                                                contentEditMode === 'header' ? 'Modelo de Cabeçalho' : 'Modelo de Rodapé'
                                            }</strong>
                                         </Typography>
                                    </Box>
                                    <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, 
                                        '& .ql-editor': contentEditMode === 'titles' ? { textTransform: 'uppercase' } : {} 
                                    }}>
                                        <RichTextVariableEditor 
                                            ref={editorRef}
                                            value={
                                                contentEditMode === 'content' ? (currentSettings.content_template || '') : 
                                                contentEditMode === 'header' ? (currentSettings.header_template || '') :
                                                contentEditMode === 'footer' ? (currentSettings.footer_template || '') :
                                                (currentSettings.titles_template || '')
                                            }
                                            onChange={(val) => {
                                                if (contentEditMode === 'content') updateCurrentSetting('content_template', val);
                                                else if (contentEditMode === 'header') {
                                                    updateCurrentSetting('header_template', val);
                                                }
                                                else if (contentEditMode === 'footer') updateCurrentSetting('footer_template', val);
                                                else updateCurrentSetting('titles_template', val);
                                            }}
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
