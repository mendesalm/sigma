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
    ToggleButton,
    ToggleButtonGroup,
    Chip,
    Stepper,
    Step,
    StepButton
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
import TiptapEditor, { TiptapEditorRef } from '../../components/DocumentBuilder/TiptapEditor';




const DEFAULT_SETTINGS = {
    header: 'header_master.html', // Corrected filename
    body: 'template_padrao.html',
    footer: 'footer_padrao.html',
    content_template: '',
    titles_template: '',
    header_template: '',
    footer_template: '',
    preamble_template: '',
    signatures_template: '',
    date_place_template: '',
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
        },
        signatures_config: {
            spacing_top: '2cm'
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

interface DocumentBuilderProps {
    mode?: 'lodge' | 'admin';
    lodgeId?: number; // Optional, used in lodge mode if passed, or from context
}

const DocumentBuilder: React.FC<DocumentBuilderProps> = ({ mode = 'lodge', lodgeId: propLodgeId }) => {
    const { user } = useContext(AuthContext) || {};
    const effectiveLodgeId = propLodgeId || (mode === 'lodge' ? user?.lodge_id : undefined);

    const [saving, setSaving] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
    const [lodgeData, setLodgeData] = useState<any>(null);

    // State
    const [currentType, setCurrentType] = useState('balaustre');
    const [activeStep, setActiveStep] = useState(0);
    const steps = ['Tipo de Documento', 'Papel e Bordas', 'Cabeçalho e Rodapé', 'Conteúdo e Estrutura'];
    const [viewMode, setViewMode] = useState<'preview' | 'editor'>('preview');
    const [contentEditMode, setContentEditMode] = useState<'content' | 'titles' | 'header' | 'footer' | 'preamble' | 'signatures' | 'date_place'>('content');
    const [expandedAccordion, setExpandedAccordion] = useState<string | false>('page_section');

    const editorRef = useRef<TiptapEditorRef>(null);

    const [allSettings, setAllSettings] = useState({
        balaustre: {
            ...DEFAULT_SETTINGS,
            content_template: '',
            signatures_template: ''
        },
        prancha: {
            ...DEFAULT_SETTINGS,
            preamble_template: '',
            signatures_template: '',
            styles: { ...DEFAULT_SETTINGS.styles, line_height: 2.0 }
        },
        edital: {
            ...DEFAULT_SETTINGS,
            signatures_template: '',
            styles: { ...DEFAULT_SETTINGS.styles, line_height: 1.5, show_border: true }
        },
        convite: { ...DEFAULT_SETTINGS, header: 'header_moderno.html', styles: { ...DEFAULT_SETTINGS.styles, font_family: "'Times New Roman', serif", show_border: true, border_style: 'double' } },
        certificado: { ...DEFAULT_SETTINGS, header: 'header_timbre.html', styles: { ...DEFAULT_SETTINGS.styles, orientation: 'landscape', show_border: true, border_style: 'solid', border_width: '5px' } }
    });

    const currentSettings = allSettings[currentType as keyof typeof allSettings];
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    // --- Effects & Data Loading ---

    const loadDefaults = async (type: string) => {
        try {
            if (!['balaustre', 'prancha', 'edital'].includes(type) && mode === 'lodge') return;

            // In admin mode, we might want to load 'true' defaults or current master
            const response = await api.get(`/documents/defaults/${type}`);
            if (response.data) {
                const { content_template, signatures_template, preamble_template } = response.data;
                setAllSettings(prev => {
                    const current = prev[type as keyof typeof prev];
                    return {
                        ...prev,
                        [type]: {
                            ...current,
                            content_template: (!current.content_template && content_template) ? content_template : current.content_template,
                            signatures_template: (!current.signatures_template && signatures_template) ? signatures_template : current.signatures_template,
                            preamble_template: (!current.preamble_template && preamble_template) ? preamble_template : current.preamble_template
                        }
                    };
                });
            }
        } catch (error) {
            console.error("Erro ao carregar defaults:", error);
        }
    };

    useEffect(() => {
        const current = allSettings[currentType as keyof typeof allSettings];
        if (currentType === 'balaustre' || currentType === 'prancha' || currentType === 'edital') {
            if (!current?.content_template && !current?.signatures_template) {
                loadDefaults(currentType);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentType]);

    useEffect(() => {
        if (mode === 'lodge' && effectiveLodgeId) {
            fetchSettings();
            fetchRecentSessions();
        } else if (mode === 'admin') {
            fetchAdminSettings();
            // Admins might want sessions to see preview? 
            // Maybe fetch from a demo lodge or generic endpoint?
            // For now, empty recent sessions
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, effectiveLodgeId]);

    const [recentSessions, setRecentSessions] = useState<any[]>([]);
    const [previewSessionId, setPreviewSessionId] = useState<number | ''>('');

    const fetchRecentSessions = async () => {
        try {
            if (!effectiveLodgeId) return;
            // We can filter sessions by lodge if needed, but endpoint implementation varies
            const response = await api.get('/sessions', { params: { skip: 0, limit: 5 } });
            setRecentSessions(response.data.slice(0, 5));
        } catch (error) {
            console.error("Failed to load sessions", error);
        }
    };

    // Helper to merge deep styles
    const deepMergeStyles = (defaultStyles: any, remoteStyles: any) => ({
        ...defaultStyles,
        ...remoteStyles,
        header_config: { ...defaultStyles.header_config, ...(remoteStyles?.header_config || {}) },
        titles_config: { ...defaultStyles.titles_config, ...(remoteStyles?.titles_config || {}) },
        content_config: { ...defaultStyles.content_config, ...(remoteStyles?.content_config || {}) },
        footer_config: { ...defaultStyles.footer_config, ...(remoteStyles?.footer_config || {}) },
        signatures_config: { ...defaultStyles.signatures_config, ...(remoteStyles?.signatures_config || {}) },
    });

    // Format utility
    const fetchSettings = async () => {
        try {
            const response = await api.get(`/lodges/${effectiveLodgeId}`);
            setLodgeData(response.data);
            const data = response.data.document_settings;

            if (data && Object.keys(data).length > 0) {
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

    const fetchAdminSettings = async () => {
        // Fetch GLOBAL Master settings
        try {
            // We need a new endpoint GET /admin/templates/settings which returns the JSON for the master configs
            // For now, we reuse the defaults endpoint or reading from global storage
            // IF backend doesn't support reading JSON for master yet, we might start with DEFAULT_SETTINGS 
            // and only fetch HTML content for the templates

            // Step 1: Get HTML Content (Universal)
            const htmlResponse = await api.get(`/admin/templates/universal/${currentType}`);
            // If successful, update the content_template of current settings
            if (htmlResponse.data.content) {
                setAllSettings(prev => ({
                    ...prev,
                    [currentType]: {
                        ...prev[currentType as keyof typeof prev],
                        content_template: htmlResponse.data.content
                    }
                }));
            }

            // TODO: Fetch GLOBAL JSON settings (styles) if implemented
            // const jsonResponse = await api.get('/admin/templates/settings');
        } catch (error) {
            console.error('Erro ao buscar configurações globais', error);
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
            const response = await api.post(`/lodges/${effectiveLodgeId}/upload_asset`, formData, {
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

    /**
     * Transforms the flat allSettings into the V2 schema with page_settings and content_settings.
     * Keeps the original `styles` for backwards compatibility.
     */
    const buildPayloadV2 = (settings: typeof allSettings) => {
        const result: Record<string, any> = {};

        for (const [docType, docSettings] of Object.entries(settings)) {
            const s = docSettings.styles;

            // Extract page-level fields into PageSettings
            const page_settings = {
                format: s.page_size || 'A4',
                orientation: s.orientation || 'portrait',
                margin_top: s.page_margin || '1cm',
                margin_bottom: s.page_margin || '1cm',
                margin_left: s.page_margin || '1cm',
                margin_right: s.page_margin || '1cm',
                background_color: s.background_color || '#ffffff',
                background_image: (s.background_image && s.background_image !== 'none') ? s.background_image : null,
                show_border: s.show_border ?? false,
                border_style: s.border_style || 'solid',
                border_color: s.border_color || '#000000',
                border_width: s.border_width || '1px',
                watermark_image: s.watermark_image || null,
                watermark_opacity: s.watermark_opacity ?? 0.1,
            };

            // Extract content-level configs into ContentSettings
            const content_settings = {
                header_template: docSettings.header_template || null,
                body_template: docSettings.content_template || null,
                footer_template: docSettings.footer_template || null,
                signatures_template: docSettings.signatures_template || null,
                titles_template: docSettings.titles_template || null,
                preamble_template: docSettings.preamble_template || null,
                date_place_template: docSettings.date_place_template || null,
                header_config: s.header_config || {},
                titles_config: s.titles_config || {},
                content_config: s.content_config || {},
                signatures_config: s.signatures_config || {},
                footer_config: s.footer_config || {},
            };

            result[docType] = {
                ...docSettings,
                page_settings,
                content_settings,
            };
        }

        return result;
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (mode === 'lodge') {
                if (!effectiveLodgeId) return;
                const enrichedSettings = buildPayloadV2(allSettings);
                const payload = { document_settings: enrichedSettings };
                await api.put(`/lodges/${effectiveLodgeId}`, payload);
                showSnackbar('Configurações salvas com sucesso!', 'success');
            } else {
                // Admin Mode - Save Global
                if (!window.confirm("ATENÇÃO: Você está alterando o Modelo Universal. Isso afetará todas as lojas. Deseja continuar?")) {
                    setSaving(false);
                    return;
                }

                // 1. Save HTML Content
                await api.put(`/admin/templates/universal/${currentType}`, {
                    content: currentSettings.content_template
                });

                // 2. Save JSON Settings (Styles) - Creating new endpoint if needed
                // await api.put(`/admin/templates/settings`, { settings: allSettings });

                showSnackbar('Modelo Universal atualizado com sucesso!', 'success');
            }
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
                const payload = {
                    settings: currentSettings,
                    lodge_id: effectiveLodgeId, // Use effective ID directly
                    session_id: previewSessionId || undefined
                };
                const response = await api.post(`/documents/preview/${currentType}`, payload);
                setPreviewHtml(response.data.html);
            } catch (error) {
                console.error("Error preview", error);
                setPreviewHtml(`<div style="color:red;padding:20px;text-align:center">Erro ao carregar preview</div>`);
            } finally {
                setPreviewLoading(false);
            }
        };

        // Delay fetch to avoid rapid requests (debounce)
        const timer = setTimeout(fetchPreview, 800);
        return () => clearTimeout(timer);

    }, [currentSettings, currentType, effectiveLodgeId, viewMode, previewSessionId]);

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
                        if (section === 'styles') {
                            updateCurrentSetting(field, newValue, true);
                        } else {
                            updateNestedSetting(section as any, field, newValue);
                        }
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



    
    const renderSidebarControls = () => (
        <Box sx={{ p: 2, overflowY: 'auto', height: '100%' }}>
            {activeStep === 1 && (
                <>
                    <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary', fontWeight: 'bold' }}>CONFIGURAÇÕES DA PÁGINA</Typography>
                    <Accordion expanded={expandedAccordion === 'page_section'} onChange={handleAccordionChange('page_section')}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Página e Fundo</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid container spacing={2}>
                        <Grid
                            size={{
                                xs: 6
                            }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Tamanho</InputLabel>
                                <Select value={currentSettings.styles.page_size || 'A4'} label="Tamanho" onChange={(e) => updateCurrentSetting('page_size', e.target.value, true)}>
                                    <MenuItem value="A4">A4</MenuItem>
                                    <MenuItem value="A5">A5</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid
                            size={{
                                xs: 6
                            }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Orientação</InputLabel>
                                <Select value={currentSettings.styles.orientation || 'portrait'} label="Orientação" onChange={(e) => updateCurrentSetting('orientation', e.target.value, true)}>
                                    <MenuItem value="portrait">Retrato</MenuItem>
                                    <MenuItem value="landscape">Paisagem</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid
                            size={{
                                xs: 6
                            }}>
                            <TextField label="Margens" size="small" fullWidth value={currentSettings.styles.page_margin || '1cm'} onChange={(e) => updateCurrentSetting('page_margin', e.target.value, true)} />
                        </Grid>
                        <Grid
                            size={{
                                xs: 6
                            }}>
                            {renderColorControl("Cor Fundo", "styles", "background_color", currentSettings.styles.background_color)}
                        </Grid>
                        <Grid
                            size={{
                                xs: 12
                            }}>
                            {renderFileUploadControl("Imagem de Fundo (Página)", "styles", "background_image", currentSettings.styles.background_image && currentSettings.styles.background_image !== 'none' ? currentSettings.styles.background_image : null, undefined, "image_opacity", currentSettings.styles.image_opacity)}
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
                        <Grid
                            size={{
                                xs: 12
                            }}>
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
                        <Grid
                            size={{
                                xs: 12
                            }}>
                            {renderFileUploadControl("Marca d'Água", "styles", "watermark_image", currentSettings.styles.watermark_image)}
                        </Grid>
                        <Grid
                            size={{
                                xs: 12
                            }}>
                            <Typography variant="caption">Opacidade: {Math.round((currentSettings.styles.watermark_opacity || 0.1) * 100)}%</Typography>
                            <Slider size="small" value={currentSettings.styles.watermark_opacity || 0.1} min={0} max={1} step={0.05} onChange={(_, v) => updateCurrentSetting('watermark_opacity', v, true)} />
                        </Grid>
                    </Grid>
                </AccordionDetails>
            </Accordion>
                </>
            )}
            {activeStep === 2 && (
                <>
                    <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary', fontWeight: 'bold' }}>CABEÇALHO E RODAPÉ</Typography>
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
                        <Grid
                            size={{
                                xs: 6
                            }}>
                            <TextField label="Tamanho (px ou %)" size="small" fullWidth value={currentSettings.styles.header_config?.logo_size || '80px'} onChange={(e) => updateNestedSetting('header_config', 'logo_size', e.target.value)} />
                        </Grid>
                    </Grid>
                    <Box sx={{ mt: 1 }}>
                        {currentSettings.styles.header_config?.layout_mode === 'double' ? (
                            <Grid container spacing={2}>
                                <Grid
                                    size={{
                                        xs: 12
                                    }}>{renderFileUploadControl("Logo Esq", "header_config", "logo_url", currentSettings.styles.header_config?.logo_url)}</Grid>
                                <Grid
                                    size={{
                                        xs: 12
                                    }}>{renderFileUploadControl("Logo Dir (Secundário)", "header_config", "logo_obedience", currentSettings.styles.header_config?.logo_obedience)}</Grid>
                            </Grid>
                        ) : (
                            renderFileUploadControl("Arquivo de Logo", "header_config", "logo_url", currentSettings.styles.header_config?.logo_url)
                        )}
                    </Box>


                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold', mt: 3, mb: 1, display: 'block' }}>NOME DA LOJA (TÍTULO)</Typography>
                    <Grid container spacing={2}>
                        <Grid
                            size={{
                                xs: 6
                            }}>
                            <TextField label="Tamanho Fonte" size="small" fullWidth value={currentSettings.styles.header_config?.font_size_title || '16pt'} onChange={(e) => updateNestedSetting('header_config', 'font_size_title', e.target.value)} />
                        </Grid>
                        <Grid
                            size={{
                                xs: 6
                            }}>
                            {renderColorControl("Cor Título", "header_config", "color_title", currentSettings.styles.header_config?.color_title)}
                        </Grid>
                        <Grid
                            size={{
                                xs: 12
                            }}>
                            <TextField label="Margem (ex: 0 0 5px 0)" size="small" fullWidth value={currentSettings.styles.header_config?.margin_title || ''} onChange={(e) => updateNestedSetting('header_config', 'margin_title', e.target.value)} placeholder="Top Right Bottom Left" helperText="Espaçamento CSS (ex: 0px 0px 10px 0px)" />
                        </Grid>
                        <Grid
                            size={{
                                xs: 12
                            }}>
                            <TextField label="Texto Fixo (Opcional)" size="small" fullWidth value={currentSettings.styles.header_config?.custom_title_text || ''} onChange={(e) => updateNestedSetting('header_config', 'custom_title_text', e.target.value)} placeholder="Sobrescreve o nome da loja padrão" helperText="Deixe vazio para usar o automático" />
                        </Grid>
                    </Grid>

                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold', mt: 3, mb: 1, display: 'block' }}>AFILIAÇÕES (SUBTÍTULO)</Typography>
                    <Grid container spacing={2}>
                        <Grid
                            size={{
                                xs: 6
                            }}>
                            <TextField label="Tamanho Fonte" size="small" fullWidth value={currentSettings.styles.header_config?.font_size_subtitle || '12pt'} onChange={(e) => updateNestedSetting('header_config', 'font_size_subtitle', e.target.value)} />
                        </Grid>
                        <Grid
                            size={{
                                xs: 6
                            }}>
                            {renderColorControl("Cor Subtítulo", "header_config", "color_subtitle", currentSettings.styles.header_config?.color_subtitle)}
                        </Grid>
                        <Grid
                            size={{
                                xs: 12
                            }}>
                            <TextField label="Margem" size="small" fullWidth value={currentSettings.styles.header_config?.margin_subtitle || ''} onChange={(e) => updateNestedSetting('header_config', 'margin_subtitle', e.target.value)} />
                        </Grid>
                        <Grid
                            size={{
                                xs: 12
                            }}>
                            <TextField label="Texto Fixo (Opcional)" size="small" fullWidth value={currentSettings.styles.header_config?.custom_subtitle_text || ''} onChange={(e) => updateNestedSetting('header_config', 'custom_subtitle_text', e.target.value)} placeholder="Sobrescreve as afiliações padrão" helperText="Deixe vazio para usar o automático" />
                        </Grid>
                    </Grid>

                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold', mt: 3, mb: 1, display: 'block' }}>GERAL</Typography>
                    <Grid container spacing={2}>
                        <Grid
                            size={{
                                xs: 6
                            }}>
                            <TextField label="Espaço Abaixo Cabeçalho" size="small" fullWidth value={currentSettings.styles.header_config?.spacing_bottom || '20px'} onChange={(e) => updateNestedSetting('header_config', 'spacing_bottom', e.target.value)} />
                        </Grid>
                        <Grid
                            size={{
                                xs: 12
                            }}>
                            {renderColorControl("Fundo Cabeçalho", "header_config", "background_color", currentSettings.styles.header_config?.background_color)}
                        </Grid>
                        <Grid
                            size={{
                                xs: 12
                            }}>
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
                        <Grid
                            size={{
                                xs: 6
                            }}>
                            <TextField label="Espaço Acima" size="small" fullWidth value={currentSettings.styles.footer_config?.spacing_top || '40px'} onChange={(e) => updateNestedSetting('footer_config', 'spacing_top', e.target.value)} />
                        </Grid>
                        <Grid
                            size={{
                                xs: 6
                            }}>
                            <FormControlLabel control={<Switch size="small" checked={currentSettings.styles.show_page_numbers} onChange={(e) => updateCurrentSetting('show_page_numbers', e.target.checked, true)} />} label="Num. Pág." />
                        </Grid>
                        <Grid
                            size={{
                                xs: 12
                            }}>
                            {renderColorControl("Cor Fundo Rodapé", "footer_config", "background_color", currentSettings.styles.footer_config?.background_color)}
                        </Grid>
                        <Grid
                            size={{
                                xs: 12
                            }}>
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
                    <Accordion expanded={expandedAccordion === 'signatures_layout_section'} onChange={handleAccordionChange('signatures_layout_section')}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Assinaturas (Layout)</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid container spacing={2}>
                        <Grid
                            size={{
                                xs: 6
                            }}>
                            <TextField label="Espaço Superior" size="small" fullWidth value={currentSettings.styles.signatures_config?.spacing_top || '2cm'} onChange={(e) => updateNestedSetting('signatures_config', 'spacing_top', e.target.value)} />
                        </Grid>
                    </Grid>
                </AccordionDetails>
            </Accordion>
                </>
            )}
            {activeStep === 3 && (
                <>
                    <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary', fontWeight: 'bold' }}>ESTRUTURA DE CONTEÚDO</Typography>
                    <Accordion expanded={expandedAccordion === 'titles_section'} onChange={handleAccordionChange('titles_section')}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Títulos do Documento</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <FormControlLabel sx={{ mb: 2 }} control={<Switch checked={currentSettings.styles.titles_config?.show !== false} onChange={(e) => updateNestedSetting('titles_config', 'show', e.target.checked)} />} label="Exibir Títulos" />

                    <Grid container spacing={2}>
                        <Grid
                            size={{
                                xs: 6
                            }}>
                            <TextField label="Padding Superior" size="small" fullWidth value={currentSettings.styles.titles_config?.margin_top || '10px'} onChange={(e) => updateNestedSetting('titles_config', 'margin_top', e.target.value)} />
                        </Grid>
                        <Grid
                            size={{
                                xs: 6
                            }}>
                            <TextField label="Padding Inferior" size="small" fullWidth value={currentSettings.styles.titles_config?.margin_bottom || '20px'} onChange={(e) => updateNestedSetting('titles_config', 'margin_bottom', e.target.value)} />
                        </Grid>
                        <Grid
                            size={{
                                xs: 12
                            }}>
                            <TextField label="Fonte (Padrão)" size="small" fullWidth value={currentSettings.styles.titles_config?.font_size || '14pt'} onChange={(e) => updateNestedSetting('titles_config', 'font_size', e.target.value)} />
                        </Grid>
                        <Grid
                            size={{
                                xs: 12
                            }}>
                            {renderColorControl("Cor Fundo Títulos", "titles_config", "background_color", currentSettings.styles.titles_config?.background_color)}
                        </Grid>
                        <Grid
                            size={{
                                xs: 12
                            }}>
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
                        <Grid
                            size={{
                                xs: 6
                            }}>
                            <TextField label="Padding Superior" size="small" fullWidth value={currentSettings.styles.content_config?.padding_top || '0px'} onChange={(e) => updateNestedSetting('content_config', 'padding_top', e.target.value)} />
                        </Grid>
                        <Grid
                            size={{
                                xs: 6
                            }}>
                            {renderColorControl("Cor Fundo Conteúdo", "content_config", "background_color", currentSettings.styles.content_config?.background_color)}
                        </Grid>
                        <Grid
                            size={{
                                xs: 12
                            }}>
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
                    <Accordion expanded={expandedAccordion === 'preamble_section'} onChange={handleAccordionChange('preamble_section')}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Preâmbulo</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Box sx={{ p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                        <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>Edite o modelo do Preâmbulo:</Typography>
                        <Button
                            variant="outlined"
                            startIcon={<EditIcon />}
                            fullWidth
                            size="small"
                            onClick={() => {
                                setContentEditMode('preamble');
                                setViewMode('editor');
                            }}
                        >
                            Editar Modelo de Preâmbulo
                        </Button>
                    </Box>
                </AccordionDetails>
            </Accordion>
                    <Accordion expanded={expandedAccordion === 'signatures_section'} onChange={handleAccordionChange('signatures_section')}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Assinaturas da Prancha</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Box sx={{ p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                        <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>Edite o modelo de Assinaturas:</Typography>
                        <Button
                            variant="outlined"
                            startIcon={<EditIcon />}
                            fullWidth
                            size="small"
                            onClick={() => {
                                setContentEditMode('signatures');
                                setViewMode('editor');
                            }}
                        >
                            Editar Modelo de Assinaturas
                        </Button>
                    </Box>
                </AccordionDetails>
            </Accordion>
                    <Accordion expanded={expandedAccordion === 'date_place_section'} onChange={handleAccordionChange('date_place_section')}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Data e Local</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Box sx={{ p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                        <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>Edite o modelo de Data e Local:</Typography>
                        <Button
                            variant="outlined"
                            startIcon={<EditIcon />}
                            fullWidth
                            size="small"
                            onClick={() => {
                                setContentEditMode('date_place');
                                setViewMode('editor');
                            }}
                        >
                            Editar Modelo de Data e Local
                        </Button>
                    </Box>
                </AccordionDetails>
            </Accordion>
                </>
            )}
        </Box>
    );

    const renderStep0DocumentType = () => (
        <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', bgcolor: '#0f172a' }}>
            <Typography variant="h5" color="white" gutterBottom>Selecione o Tipo de Documento</Typography>
            <Typography variant="body1" sx={{ color: '#94a3b8', mb: 4 }}>Escolha qual documento deseja configurar ou personalizar.</Typography>
            <Grid container spacing={{ xs: 2, md: 3 }} justifyContent="center" sx={{ maxWidth: '800px' }}>
                {DOC_TYPES.map(t => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={t.key}>
                        <Paper 
                            sx={{ 
                                p: 3, 
                                textAlign: 'center', 
                                cursor: 'pointer', 
                                bgcolor: currentType === t.key ? '#3b82f6' : '#1e293b',
                                color: 'white',
                                transition: 'all 0.2s',
                                '&:hover': { bgcolor: currentType === t.key ? '#2563eb' : '#334155' },
                                border: currentType === t.key ? '2px solid #60a5fa' : '2px solid transparent'
                            }}
                            onClick={() => {
                                setCurrentType(t.key);
                                setTimeout(() => setActiveStep(1), 150); // Auto advance slightly delayed
                            }}
                        >
                            <DescriptionIcon sx={{ fontSize: 48, mb: 1, opacity: currentType === t.key ? 1 : 0.7 }} />
                            <Typography variant="h6">{t.label}</Typography>
                        </Paper>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );

    const handleReset = async () => {
        if (!user?.lodge_id) return;
        if (!window.confirm("ATENÇÃO: Isso irá excluir todas as personalizações deste documento e restaurar o modelo padrão do sistema. Esta ação não pode ser desfeita. Deseja continuar?")) {
            return;
        }

        setSaving(true);
        try {
            await api.delete(`/lodges/${user.lodge_id}/document-settings/${currentType}/reset`);
            showSnackbar('Configurações restauradas com sucesso!', 'success');
            await fetchSettings(); // Reload defaults
        } catch (error) {
            console.error('Erro ao restaurar:', error);
            showSnackbar('Erro ao restaurar padrão.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const isCustom = !!(lodgeData?.document_settings?.[currentType]);

    
    return (
        <Box sx={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
            <Paper elevation={2} sx={{ p: 0, mb: 2, display: 'flex', flexDirection: 'column', borderRadius: 0 }}>
                {/* Header Toolbar */}
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <DescriptionIcon color="primary" />
                        <Box>
                            <Typography variant="h6" component="h1" sx={{ lineHeight: 1.2 }}>
                                Construtor de Documentos
                            </Typography>
                            <Chip
                                label={isCustom ? "Modelo Personalizado" : "Padrão Sigma"}
                                size="small"
                                color={isCustom ? "info" : "success"}
                                variant={isCustom ? "filled" : "outlined"}
                                sx={{ mt: 0.5, fontWeight: 'bold' }}
                            />
                        </Box>
                        {activeStep > 0 && (
                            <>
                                <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" color="textSecondary">Editando:</Typography>
                                    <Chip label={DOC_TYPES.find(d => d.key === currentType)?.label || currentType} color="primary" variant="outlined" size="small" />
                                </Box>
                            </>
                        )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            variant="outlined"
                            color="warning"
                            onClick={handleReset}
                            disabled={saving}
                            sx={{ borderColor: '#f59e0b', color: '#f59e0b', '&:hover': { borderColor: '#d97706', bgcolor: 'rgba(245, 158, 11, 0.1)' } }}
                        >
                            Restaurar Padrão Sigma
                        </Button>
                        <Button variant="contained" color="primary" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving}>
                            {saving ? 'Salvando...' : 'Salvar Alterações'}
                        </Button>
                    </Box>
                </Box>
                {/* Stepper */}
                <Box sx={{ width: '100%', py: 1.5, px: 4, bgcolor: '#f8fafc' }}>
                    <Stepper nonLinear activeStep={activeStep}>
                        {steps.map((label, index) => (
                            <Step key={label} completed={activeStep > index}>
                                <StepButton color="inherit" onClick={() => setActiveStep(index)}>
                                    {label}
                                </StepButton>
                            </Step>
                        ))}
                    </Stepper>
                </Box>
            </Paper>

            <Grid container sx={{ flexGrow: 1, overflow: 'hidden' }}>
                {activeStep === 0 ? (
                    <Grid size={{ xs: 12 }}>
                        {renderStep0DocumentType()}
                    </Grid>
                ) : (
                    <>
                        {/* LEFT SIDEBAR (Controls) */}
                        <Grid
                            sx={{ height: '100%', borderRight: '1px solid #1e293b', display: 'flex', flexDirection: 'column', bgcolor: '#0f172a' }}
                            size={{ xs: 12, md: 3, lg: 3 }}>
                            {renderSidebarControls()}
                        </Grid>

                {/* RIGHT MAIN AREA (Preview / Editor) */}
                <Grid
                    sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#0a101f' }}
                    size={{
                        xs: 12,
                        md: 9,
                        lg: 9
                    }}>

                    {/* View Switcher Toolbar (Visible in Content Tab OR when in Editor Mode) */}
                    {(activeStep === 3 || viewMode === 'editor') && (
                        <Box sx={{ p: 1, bgcolor: '#fff', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
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

                            {/* Session Selector for Preview */}
                            {viewMode === 'preview' && (
                                <FormControl size="small" sx={{ minWidth: 220 }}>
                                    <Select
                                        value={previewSessionId}
                                        onChange={(e) => setPreviewSessionId(e.target.value as number)}
                                        displayEmpty
                                        variant="outlined"
                                        sx={{ height: 40 }}
                                    >
                                        <MenuItem value="">
                                            <em>Dados de Exemplo (Mock)</em>
                                        </MenuItem>
                                        {recentSessions.map(session => (
                                            <MenuItem key={session.id} value={session.id}>
                                                Sessão {new Date(session.session_date).toLocaleDateString()}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}
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
                                            zIndex: 50,
                                            boxSizing: 'border-box'
                                        }} />
                                    )}

                                    {/* CSS Reset for Preview Content to match Editor */}
                                    {previewLoading ? (
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '800px' }}>
                                            <CircularProgress />
                                        </Box>
                                    ) : (
                                        <iframe
                                            srcDoc={previewHtml}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                minHeight: '800px',
                                                border: 'none',
                                                background: 'transparent',
                                                position: 'relative',
                                                zIndex: 10
                                            }}
                                            title="Pré-visualização do Documento"
                                        />
                                    )}
                                </Paper>
                            </Box>
                        ) : (
                            // EDITOR VIEW
                            (<Grid container sx={{ height: '100%' }}>
                                <Grid
                                    sx={{ height: '100%', borderRight: '1px solid #334155', bgcolor: '#1e293b', overflowY: 'auto' }}
                                    size={{
                                        xs: 3
                                    }}>
                                    <Box sx={{ p: 2 }}>
                                        <Typography variant="subtitle2" gutterBottom sx={{ color: '#e2e8f0' }}>Variáveis Dinâmicas</Typography>
                                        <VariablePalette
                                            documentType={currentType}
                                            onInsertVariable={(key, label) => {
                                                if (editorRef.current) {
                                                    editorRef.current.insertVariable(key, label);
                                                }
                                            }}
                                        />
                                    </Box>
                                </Grid>
                                <Grid
                                    sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                                    size={{
                                        xs: 9
                                    }}>
                                    <Box sx={{ p: 2, bgcolor: '#1e293b', borderBottom: '1px solid #334155' }}>
                                        <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                                            Editando: <strong style={{ color: '#e2e8f0' }}>{
                                                contentEditMode === 'content' ? 'Modelo do Corpo do Texto' :
                                                    contentEditMode === 'titles' ? 'Modelo dos Títulos' :
                                                        contentEditMode === 'header' ? 'Modelo de Cabeçalho' :
                                                            contentEditMode === 'preamble' ? 'Modelo de Preâmbulo' :
                                                                contentEditMode === 'signatures' ? 'Modelo de Assinaturas' :
                                                                    contentEditMode === 'date_place' ? 'Modelo de Data e Local' :
                                                                        'Modelo de Rodapé'
                                            }</strong>
                                        </Typography>
                                    </Box>
                                    <Box sx={{
                                        flexGrow: 1, overflowY: 'auto', p: 2,
                                        '& .ql-editor': contentEditMode === 'titles' ? { textTransform: 'uppercase' } : {}
                                    }}>
                                        <TiptapEditor
                                            ref={editorRef}
                                            value={
                                                contentEditMode === 'content' ? (currentSettings.content_template || (DEFAULT_SETTINGS as any)[currentType]?.content_template || '') :
                                                    contentEditMode === 'header' ? (currentSettings.header_template || (DEFAULT_SETTINGS as any)[currentType]?.header_template || '') :
                                                        contentEditMode === 'footer' ? (currentSettings.footer_template || (DEFAULT_SETTINGS as any)[currentType]?.footer_template || '') :
                                                            contentEditMode === 'preamble' ? (currentSettings.preamble_template || (DEFAULT_SETTINGS as any)[currentType]?.preamble_template || '') :
                                                                contentEditMode === 'signatures' ? (currentSettings.signatures_template || (DEFAULT_SETTINGS as any)[currentType]?.signatures_template || '') :
                                                                    contentEditMode === 'date_place' ? (currentSettings.date_place_template || (DEFAULT_SETTINGS as any)[currentType]?.date_place_template || '') :
                                                                        (currentSettings.titles_template || (DEFAULT_SETTINGS as any)[currentType]?.titles_template || '')
                                            }
                                            onChange={(val) => {
                                                if (contentEditMode === 'content') updateCurrentSetting('content_template', val);
                                                else if (contentEditMode === 'header') updateCurrentSetting('header_template', val);
                                                else if (contentEditMode === 'footer') updateCurrentSetting('footer_template', val);
                                                else if (contentEditMode === 'preamble') updateCurrentSetting('preamble_template', val);
                                                else if (contentEditMode === 'signatures') updateCurrentSetting('signatures_template', val);
                                                else if (contentEditMode === 'date_place') updateCurrentSetting('date_place_template', val);
                                                else updateCurrentSetting('titles_template', val);
                                            }}
                                        />
                                    </Box>
                                </Grid>
                            </Grid>)
                        )}
                    </Box>
                </Grid>
                    </>
                )}
            </Grid>
            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
};

export default DocumentBuilder;
