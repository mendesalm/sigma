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
  CircularProgress,
  Snackbar,
  Alert,
  FormControlLabel,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
  Divider
} from '@mui/material';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';



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
            color: null,
            bold: true,
            uppercase: true,
            alignment: 'center',
            line_height: 1.2,
            margin_top: '10px',
            margin_bottom: '20px',
            show: true
        },
        content_config: {
            font_family: null,
            font_size: '12pt',
            line_height: 1.5,
            spacing: '10px', // Paragraph spacing
            alignment: 'justify',
            color: '#000000',
            background_color: '#ffffff',
            background_image: ''
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

const DocumentConfigPage = () => {
    const { user } = useContext(AuthContext) || {};
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
    const [lodgeData, setLodgeData] = useState<any>(null);
    
    const [currentType, setCurrentType] = useState('balaustre');
    const [allSettings, setAllSettings] = useState({
        balaustre: { ...DEFAULT_SETTINGS },
        prancha: { ...DEFAULT_SETTINGS, styles: { ...DEFAULT_SETTINGS.styles, line_height: 2.0 } },
        convite: { ...DEFAULT_SETTINGS, header: 'header_moderno.html', styles: { ...DEFAULT_SETTINGS.styles, font_family: "'Times New Roman', serif", show_border: true, border_style: 'double' } }
    });

    const currentSettings = allSettings[currentType as keyof typeof allSettings];
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    useEffect(() => {
        if (user?.lodge_id) {
            fetchSettings();
        }
    }, [user]);

    const fetchSettings = async () => {
        setLoading(true);
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
                    // Estrutura antiga
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
                        balaustre: { 
                            ...prev.balaustre, 
                            ...data.balaustre, 
                            styles: deepMergeStyles(prev.balaustre.styles, data.balaustre?.styles)
                        },
                        prancha: { 
                            ...prev.prancha, 
                            ...data.prancha, 
                            styles: deepMergeStyles(prev.prancha.styles, data.prancha?.styles)
                        },
                        convite: { 
                            ...prev.convite, 
                            ...data.convite, 
                            styles: deepMergeStyles(prev.convite.styles, data.convite?.styles)
                        }
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

    const updateNestedSetting = (section: string, field: string, value: any) => {
        setAllSettings(prev => {
            const typeSettings = prev[currentType as keyof typeof prev];
            // Deep update for nested style configs
            const currentStyles = typeSettings.styles;
            const currentSectionConfig = (currentStyles as any)[section] || {};
            
            const newStyles = {
                ...currentStyles,
                [section]: {
                    ...currentSectionConfig,
                    [field]: value
                }
            };

            return {
                ...prev,
                [currentType]: {
                    ...typeSettings,
                    styles: newStyles
                }
            };
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
            // Construct absolute URL if needed, or relative. 
            // Using API_URL prefix to ensure it works on frontend.
            const url = response.data.url;
            // Remove leading slash if API_URL has trailing slash (it usually doesn't)
            const fullUrl = `${API_URL}${url}`;
            
            // Determine if 'section' is a nested config or 'styles' root
            if (['header_config', 'content_config', 'footer_config'].includes(section)) {
                updateNestedSetting(section, field, fullUrl);
            } else {
                 // For root styles adjustments if any
                updateCurrentSetting(field, fullUrl, true);
            }
            
            setSnackbar({ open: true, message: 'Upload realizado com sucesso!', severity: 'success' });
        } catch (error) {
            console.error(error);
            setSnackbar({ open: true, message: 'Erro ao fazer upload da imagem.', severity: 'error' });
        } finally {
            setSaving(false);
        }
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

    // Helper to generate logo URL
    const getLogoUrl = () => {
        if (!lodgeData) return undefined;
        // Replica a lógica do backend (lodge_service.py) para gerar o nome da pasta
        const safeNumber = lodgeData.lodge_number
            ? lodgeData.lodge_number.replace(/[^a-zA-Z0-9 \-_]/g, '').trim().replace(/\s+/g, '_')
            : `id_${lodgeData.id}`;
        
        return `${API_URL}/storage/lodges/loja_${safeNumber}/assets/images/logo/logo_jpg.png`;
    };

    const logoUrl = getLogoUrl();

    // Preview State and Logic (Lifted from render)
    const [previewHtml, setPreviewHtml] = useState<string>('');
    const [previewLoading, setPreviewLoading] = useState(false);

    useEffect(() => {
        const fetchPreview = async () => {
            if (currentSettings.header === 'no_header') {
                setPreviewHtml('');
                return;
            }

            setPreviewLoading(true);
            try {
                // Prepare mock context similar to what backend strategies provide
                const context = {
                    lodge_name: lodgeData?.lodge_name || 'NOME DA LOJA',
                    lodge_number: lodgeData?.lodge_number || '0000',
                    lodge_title_formatted: lodgeData?.lodge_title || 'A.R.L.S.',
                    session_number: '_____',
                    exercicio_maconico: '2025/2026',
                    styles: currentSettings.styles,
                    header_image: currentSettings.styles.header_config?.logo_url || logoUrl,
                    // footer_image would be passed here if available
                };

                const response = await api.post('/documents/preview/render', {
                    template_name: currentSettings.header,
                    context: context
                });
                setPreviewHtml(response.data.html);
            } catch (error) {
                console.error("Error fetching preview:", error);
                setPreviewHtml('<div style="color:red">Erro ao carregar preview do cabeçalho.</div>');
            } finally {
                setPreviewLoading(false);
            }
        };

        // Only fetch if data is reasonably ready
        if (lodgeData) {
            fetchPreview();
        }
    }, [currentSettings.header, currentSettings.styles, lodgeData, logoUrl]);

    // Helper para dimensões do papel no preview
    const getPaperDimensions = () => {
        const { page_size, orientation } = currentSettings.styles;
        // Base dimensions in mm
        let width = 210;
        let height = 297;

        if (page_size === 'A5') {
            width = 148;
            height = 210;
        }

        if (orientation === 'landscape') {
            return { width: `${height}mm`, height: `${width}mm` };
        }
        return { width: `${width}mm`, height: `${height}mm` };
    };

    // Renderização do Conteúdo de Preview baseada no tipo
    const renderPreviewContent = () => {
        const styles = currentSettings.styles;
        const contentConfig = styles.content_config || {};
        const textColor = contentConfig.color || '#000000';
        const bgColor = contentConfig.background_color || 'transparent';
        const bgImage = contentConfig.background_image ? `url(${contentConfig.background_image})` : undefined;

        const lodgeTitle = lodgeData?.lodge_title || 'A.R.L.S.';
        const lodgeName = lodgeData?.lodge_name || 'Exemplo de Loja';
        const lodgeNumber = lodgeData?.lodge_number ? `Nº ${lodgeData.lodge_number}` : '';
        const lodgeCity = lodgeData?.city || 'Oriente de ...';

        const commonStyle = {
             color: textColor,
             backgroundColor: bgColor,
             backgroundImage: bgImage,
             backgroundSize: 'cover',
             backgroundRepeat: 'no-repeat',
             fontFamily: styles.font_family,
             lineHeight: contentConfig.line_height || 1.5,
             textAlign: contentConfig.alignment || 'justify',
             padding: '10px' // Visual padding for background
        } as React.CSSProperties;

        if (currentType === 'convite') {
             return (
                <div style={{ ...commonStyle, textAlign: 'center' }}>
                    <Typography variant="h3" sx={{ fontFamily: 'cursive', mb: 4, mt: 4 }}>Convite</Typography>
                    <Typography paragraph sx={{ fontSize: '1.2em' }}>
                        O Venerável Mestre e os Obreiros da<br/>
                        <strong>{lodgeTitle} {lodgeName}</strong><br/>
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
                <div style={{ ...commonStyle }}>
                    <div style={{ textAlign: 'right', marginBottom: '2cm' }}>
                        {lodgeCity}, 11 de Dezembro de 2025.
                    </div>
                    <div style={{ marginBottom: '1cm', textAlign: 'left' }}>
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
        const isCondensed = currentSettings.styles.content_layout === 'condensed';

        return (
             <div style={{ 
                 ...commonStyle,
                 padding: '0.6cm 0.4cm 0.4cm 0.4cm', // Padding do .page-content no template
                 boxSizing: 'border-box',
                 height: '100%',
                 display: 'flex',
                 flexDirection: 'column'
             }}>
                {/* Content (Mimetizando .content) */}
                <div style={{ fontSize: contentConfig.font_size || '12pt', textAlign: contentConfig.alignment as any || 'justify', flexGrow: 1 }}>
                    {/* DUMB DATA FOR PREVIEW */}
                    {(() => {
                        const dumbData = {
                            abertura: `Precisamente às 20:00 horas do dia 20 de Agosto de 2025 da E∴ V∴, reuniram-se os Obreiros da ${lodgeTitle} ${lodgeName} ${lodgeNumber}, em seu Templo situado à ${lodgeData?.street_address || 'Rua Exemplo, 123'}, para realizarem Sessão Ordinária no Grau de Aprendiz Maçom.`,
                            cargos: `Ficando a Loja assim constituída: Venerável Mestre: Ir. João da Silva; 1º Vigilante: Ir. Pedro Santos; 2º Vigilante: Ir. Carlos Oliveira; Orador: Ir. Marcos Souza; Secretário: Ir. Antonio Lima; Tesoureiro: Ir. Bruno Ferreira; Chanceler: Ir. Daniel Costa.`,
                            balaustre: `Foi lido e aprovado, sem emendas, o Balaústre da Sessão anterior de nº ${parseInt(lodgeData?.lodge_number || '0') - 1}.`,
                            expediente_recebido: `1. Ato nº 123/2025 do GOB, tratando de assuntos administrativos. 2. Convite da A∴R∴L∴S∴ Luz e Verdade nº 3456 para Sessão Magna de Iniciação. 3. Boleto da Captação referente ao mês corrente.`,
                            expediente_expedido: `1. Prancha nº 045/2025 enviada ao GOB solicitando Diploma de Mestre Instalado. 2. Prancha nº 046/2025 de agradecimento à Loja Fraternidade nº 1111 pela visita.`,
                            saco_propostas: `O Ir. Hospitaleiro propôs uma campanha de arrecadação de alimentos para o Natal. O Ir. Tesoureiro informou sobre a regularização das mensalidades.`,
                            ordem_dia: `Discussão e votação da proposta de aumento da mensalidade, que foi aprovada por unanimidade. Apresentação do balancete mensal pelo Ir. Tesoureiro, aprovado pela Loja.`,
                            tempo_instrucao: `O Ir. Orador apresentou uma Peça de Arquitetura intitulada "O Simbolismo da Pedra Bruta", discorrendo sobre a importância do autoconhecimento e do trabalho constante de aperfeiçoamento moral.`,
                            tronco: `O Tronco de Beneficência circulou por toda a Loja e colheu a quantia de R$ 350,00 (trezentos e cinquenta reais) em moeda corrente, sem observações.`,
                            palavra: `O Ir. 1º Vigilante parabenizou o Venerável Mestre pela condução dos trabalhos. O Ir. Mestre de Cerimônias agradeceu a presença dos irmãos visitantes. Reinou a paz e a harmonia.`,
                            encerramento: `Nada mais havendo a tratar, o Venerável Mestre encerrou a sessão às 22:15 horas, conforme o Ritual, retirando-se todos em paz e harmonia.`
                        };

                        if (isCondensed) {
                            return (
                                <p style={{ textIndent: 0, margin: 0, marginBottom: contentConfig.spacing }}>
                                    <strong>ABERTURA:</strong> {dumbData.abertura} {dumbData.cargos}
                                    <strong> BALAÚSTRE:</strong> {dumbData.balaustre}
                                    <strong> EXPEDIENTE RECEBIDO:</strong> {dumbData.expediente_recebido}
                                    <strong> EXPEDIENTE EXPEDIDO:</strong> {dumbData.expediente_expedido}
                                    <strong> SACO DE PROPOSTAS E INFORMAÇÕES:</strong> {dumbData.saco_propostas}
                                    <strong> ORDEM DO DIA:</strong> {dumbData.ordem_dia}
                                    <strong> TEMPO DE INSTRUÇÃO:</strong> {dumbData.tempo_instrucao}
                                    <strong> TRONCO DE BENEFICÊNCIA:</strong> {dumbData.tronco}
                                    <strong> PALAVRA A BEM GERAL:</strong> {dumbData.palavra}
                                    <strong> ENCERRAMENTO:</strong> {dumbData.encerramento} E eu, Secretário, tracei o presente Balaústre.
                                </p>
                            );
                        } else {
                            return (
                                <>
                                    <p style={{ marginBottom: contentConfig.spacing, textIndent: 0 }}>
                                        <strong>ABERTURA:</strong> {dumbData.abertura}
                                    </p>
                                    <p style={{ marginBottom: contentConfig.spacing, textIndent: 0 }}>
                                        <strong>CARGOS:</strong> {dumbData.cargos}
                                    </p>
                                    <p style={{ marginBottom: contentConfig.spacing, textIndent: 0 }}>
                                        <strong>BALAÚSTRE:</strong> {dumbData.balaustre}
                                    </p>
                                    <p style={{ marginBottom: contentConfig.spacing, textIndent: 0 }}>
                                        <strong>EXPEDIENTE RECEBIDO:</strong> {dumbData.expediente_recebido}
                                    </p>
                                    <p style={{ marginBottom: contentConfig.spacing, textIndent: 0 }}>
                                        <strong>EXPEDIENTE EXPEDIDO:</strong> {dumbData.expediente_expedido}
                                    </p>
                                    <p style={{ marginBottom: contentConfig.spacing, textIndent: 0 }}>
                                        <strong>SACO DE PROPOSTAS E INFORMAÇÕES:</strong> {dumbData.saco_propostas}
                                    </p>
                                    <p style={{ marginBottom: contentConfig.spacing, textIndent: 0 }}>
                                        <strong>ORDEM DO DIA:</strong> {dumbData.ordem_dia}
                                    </p>
                                    <p style={{ marginBottom: contentConfig.spacing, textIndent: 0 }}>
                                        <strong>TEMPO DE INSTRUÇÃO:</strong> {dumbData.tempo_instrucao}
                                    </p>
                                    <p style={{ marginBottom: contentConfig.spacing, textIndent: 0 }}>
                                        <strong>TRONCO DE BENEFICÊNCIA:</strong> {dumbData.tronco}
                                    </p>
                                    <p style={{ marginBottom: contentConfig.spacing, textIndent: 0 }}>
                                        <strong>PALAVRA A BEM GERAL:</strong> {dumbData.palavra}
                                    </p>
                                    <p style={{ marginBottom: contentConfig.spacing, textIndent: 0 }}>
                                        <strong>ENCERRAMENTO:</strong> {dumbData.encerramento}
                                        <br/>E eu, Secretário, tracei o presente Balaústre que, lido e achado conforme, vai assinado.
                                    </p>
                                </>
                            );
                        }
                    })()}
                </div>

                {/* Footer (Mimetizando .footer) */}
                <div style={{ marginTop: '40px', textAlign: 'center', color: styles.footer_config?.color || textColor }}>
                     <div style={{ textAlign: 'right', marginBottom: styles.footer_config?.spacing_top || '60px' }}>
                        Oriente de {lodgeCity || 'Exemplo'}, 20 de Agosto de 2025 da E∴ V∴
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 1cm' }}>
                        <div style={{ textAlign: 'center', width: '30%' }}>
                            <div style={{ borderTop: `1px solid ${styles.footer_config?.color || textColor}`, marginBottom: '5px' }}></div>
                            <Typography variant="body2">Ir. Antonio Lima</Typography>
                            <Typography variant="caption">Secretário</Typography>
                        </div>
                        <div style={{ textAlign: 'center', width: '30%' }}>
                             <div style={{ borderTop: `1px solid ${styles.footer_config?.color || textColor}`, marginBottom: '5px' }}></div>
                            <Typography variant="body2">Ir. Marcos Souza</Typography>
                             <Typography variant="caption">Orador</Typography>
                        </div>
                        <div style={{ textAlign: 'center', width: '30%' }}>
                             <div style={{ borderTop: `1px solid ${styles.footer_config?.color || textColor}`, marginBottom: '5px' }}></div>
                            <Typography variant="body2">Ir. João da Silva</Typography>
                             <Typography variant="caption">Venerável Mestre</Typography>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Document Types
    const DOC_TYPES = [
        { key: 'balaustre', label: 'Balaústre' },
        { key: 'edital', label: 'Edital' },
        { key: 'prancha_externa', label: 'Prancha Externa' },
        { key: 'prancha_interna', label: 'Prancha Interna' },
        { key: 'certificado', label: 'Certificado de Agradecimento' },
        { key: 'cartao_aniversario', label: 'Cartão de Aniversário' },
        { key: 'cartao_agradecimento', label: 'Cartão de Agradecimento' }
    ];

    const [expandedAccordion, setExpandedAccordion] = useState<string | false>('header_section');
    const handleAccordionChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
        setExpandedAccordion(isExpanded ? panel : false);
    };

    if (loading) return <Box p={3}><CircularProgress /></Box>;

    const paperDims = getPaperDimensions();

    return (
        <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
             <Typography variant="h5" gutterBottom sx={{ color: '#fff', mb: 2 }}>
                Construtor de Documentos
            </Typography>
            
            {/* DOCUMENT TYPE SELECTOR */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <FormControl fullWidth>
                    <InputLabel>Tipo de Documento para Edição</InputLabel>
                    <Select
                        value={currentType}
                        label="Tipo de Documento para Edição"
                        onChange={(e) => setCurrentType(e.target.value)}
                    >
                        {DOC_TYPES.map(type => (
                            <MenuItem key={type.key} value={type.key}>{type.label}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Paper>
            
            <Grid container spacing={3} sx={{ flexGrow: 1 }}>
                {/* Painel de Controles (Esquerda) */}
                <Grid item xs={12} md={4} sx={{ height: '100%' }}>
                    <Paper sx={{ p: 2, height: '100%', overflowY: 'auto', bgcolor: 'background.paper' }}>
                        
                        {/* CABEÇALHO */}
                        <Accordion expanded={expandedAccordion === 'header_section'} onChange={handleAccordionChange('header_section')}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography sx={{ fontWeight: 'bold' }}>Cabeçalho</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <FormControl fullWidth sx={{ mb: 3 }}>
                                    <InputLabel>Modelo</InputLabel>
                                    <Select
                                        value={currentSettings.header}
                                        label="Modelo"
                                        onChange={(e) => updateCurrentSetting('header', e.target.value)}
                                        size="small"
                                    >
                                        <MenuItem value="header_timbre.html">Timbre (Logo Central)</MenuItem>
                                        <MenuItem value="header_classico.html">Clássico (Logo Esquerda)</MenuItem>
                                        <MenuItem value="header_invertido.html">Clássico 2 (Logo Direita)</MenuItem>
                                        <MenuItem value="header_duplo.html">Duplo (Logos Laterais)</MenuItem>
                                        <MenuItem value="header_moderno.html">Moderno (Legado)</MenuItem>
                                        <MenuItem value="header_grid.html">Grid (Legado)</MenuItem>
                                        <MenuItem value="no_header">Nenhum</MenuItem>
                                    </Select>
                                </FormControl>

                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Fonte do Cabeçalho</InputLabel>
                                            <Select
                                                value={currentSettings.styles.header_config?.font_family || ''}
                                                label="Fonte do Cabeçalho"
                                                onChange={(e) => updateNestedSetting('header_config', 'font_family', e.target.value)}
                                            >
                                                <MenuItem value="">Herdar da Página</MenuItem>
                                                <MenuItem value="Arial, sans-serif">Arial</MenuItem>
                                                <MenuItem value="'Times New Roman', serif">Times New Roman</MenuItem>
                                                <MenuItem value="'Roboto', sans-serif">Roboto</MenuItem>
                                                <MenuItem value="'Great Vibes', cursive">Manuscrita</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>

                                    <Grid item xs={6}>
                                        <TextField label="Tam. Fonte Título" size="small" fullWidth
                                            value={currentSettings.styles.header_config?.font_size_title || '16pt'}
                                            onChange={(e) => updateNestedSetting('header_config', 'font_size_title', e.target.value)}
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField label="Tam. Fonte Afiliação" size="small" fullWidth
                                            value={currentSettings.styles.header_config?.font_size_subtitle || '12pt'}
                                            onChange={(e) => updateNestedSetting('header_config', 'font_size_subtitle', e.target.value)}
                                        />
                                    </Grid>

                                    <Grid item xs={6}>
                                        <Typography variant="caption" display="block" gutterBottom>Alinhamento Título</Typography>
                                        <ToggleButtonGroup
                                            value={currentSettings.styles.header_config?.alignment_title || 'center'}
                                            exclusive
                                            onChange={(_, val) => val && updateNestedSetting('header_config', 'alignment_title', val)}
                                            size="small"
                                            fullWidth
                                        >
                                            <ToggleButton value="left"><FormatAlignLeftIcon fontSize="small" /></ToggleButton>
                                            <ToggleButton value="center"><FormatAlignCenterIcon fontSize="small" /></ToggleButton>
                                            <ToggleButton value="right"><FormatAlignRightIcon fontSize="small" /></ToggleButton>
                                        </ToggleButtonGroup>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" display="block" gutterBottom>Alinhamento Afiliação</Typography>
                                        <ToggleButtonGroup
                                            value={currentSettings.styles.header_config?.alignment_subtitle || 'center'}
                                            exclusive
                                            onChange={(_, val) => val && updateNestedSetting('header_config', 'alignment_subtitle', val)}
                                            size="small"
                                            fullWidth
                                        >
                                            <ToggleButton value="left"><FormatAlignLeftIcon fontSize="small" /></ToggleButton>
                                            <ToggleButton value="center"><FormatAlignCenterIcon fontSize="small" /></ToggleButton>
                                            <ToggleButton value="right"><FormatAlignRightIcon fontSize="small" /></ToggleButton>
                                        </ToggleButtonGroup>
                                    </Grid>

                                    <Grid item xs={6}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <TextField label="Cor Fundo" type="color" fullWidth size="small" 
                                                value={currentSettings.styles.header_config?.background_color === 'transparent' ? '#ffffff' : (currentSettings.styles.header_config?.background_color || '#ffffff')}
                                                onChange={(e) => updateNestedSetting('header_config', 'background_color', e.target.value)}
                                                InputLabelProps={{ shrink: true }}
                                            />
                                            <Button 
                                                variant="outlined" 
                                                size="small" 
                                                onClick={() => updateNestedSetting('header_config', 'background_color', 'transparent')}
                                                sx={{ minWidth: '40px', padding: '4px', fontSize: '0.7em', height: '40px', lineHeight: 1 }}
                                                title="Fundo Transparente"
                                            >
                                                Transp.
                                            </Button>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={6}>
                                         <TextField label="Cor Texto" type="color" fullWidth size="small"
                                            value={currentSettings.styles.header_config?.color || '#000000'}
                                            onChange={(e) => updateNestedSetting('header_config', 'color', e.target.value)}
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Typography variant="caption" gutterBottom>Imagem de Fundo</Typography>
                                        {currentSettings.styles.header_config?.background_image ? (
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, p: 1, border: '1px dashed #ccc', borderRadius: 1 }}>
                                                <img 
                                                    src={currentSettings.styles.header_config.background_image} 
                                                    alt="Fundo Cabeçalho" 
                                                    style={{ maxHeight: '100px', maxWidth: '100%', objectFit: 'contain' }} 
                                                />
                                                <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                                                     <Button component="label" variant="outlined" size="small" fullWidth>
                                                        Trocar
                                                        <input type="file" hidden onChange={(e) => handleFileUpload(e, 'header_config', 'background_image')} />
                                                    </Button>
                                                    <Button variant="outlined" color="error" size="small" fullWidth 
                                                        onClick={() => updateNestedSetting('header_config', 'background_image', '')}>
                                                        Remover
                                                    </Button>
                                                </Box>
                                            </Box>
                                        ) : (
                                            <Button component="label" variant="outlined" size="small" fullWidth sx={{ height: '80px', borderStyle: 'dashed', flexDirection: 'column' }}>
                                                Upload Imagem Fundo
                                                <input type="file" hidden onChange={(e) => handleFileUpload(e, 'header_config', 'background_image')} />
                                            </Button>
                                        )}
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField label="Espaço Abaixo" fullWidth size="small"
                                            value={currentSettings.styles.header_config?.spacing_bottom || '20px'}
                                            onChange={(e) => updateNestedSetting('header_config', 'spacing_bottom', e.target.value)}
                                        />
                                    </Grid>

                                    {/* Borda Inferior */}
                                    <Grid item xs={12}><Divider sx={{ my: 1 }}><Typography variant="caption">Borda Inferior</Typography></Divider></Grid>
                                    <Grid item xs={6}>
                                        <FormControlLabel control={
                                            <Switch checked={currentSettings.styles.header_config?.border_bottom_show || false} 
                                                onChange={(e) => updateNestedSetting('header_config', 'border_bottom_show', e.target.checked)} />
                                        } label="Exibir Borda" />
                                    </Grid>
                                    <Grid item xs={6}>
                                            <FormControl fullWidth size="small" disabled={!currentSettings.styles.header_config?.border_bottom_show}>
                                                <InputLabel>Estilo</InputLabel>
                                                <Select
                                                    value={currentSettings.styles.header_config?.border_bottom_style || 'solid'}
                                                    label="Estilo"
                                                    onChange={(e) => updateNestedSetting('header_config', 'border_bottom_style', e.target.value)}
                                                >
                                                    <MenuItem value="solid">Sólida</MenuItem>
                                                    <MenuItem value="dashed">Tracejada</MenuItem>
                                                    <MenuItem value="dotted">Pontilhada</MenuItem>
                                                    <MenuItem value="double">Dupla</MenuItem>
                                                </Select>
                                            </FormControl>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField label="Espessura" size="small" fullWidth
                                            value={currentSettings.styles.header_config?.border_bottom_width || '1px'}
                                            onChange={(e) => updateNestedSetting('header_config', 'border_bottom_width', e.target.value)}
                                            disabled={!currentSettings.styles.header_config?.border_bottom_show}
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                            <TextField label="Cor" type="color" size="small" fullWidth
                                                value={currentSettings.styles.header_config?.border_bottom_color || '#000000'}
                                                onChange={(e) => updateNestedSetting('header_config', 'border_bottom_color', e.target.value)}
                                                InputLabelProps={{ shrink: true }}
                                                disabled={!currentSettings.styles.header_config?.border_bottom_show}
                                            />
                                    </Grid>

                                    
                                     {/* Advanced Logo Controls */}
                                    <Grid item xs={12}><Divider sx={{ my: 1 }}><Typography variant="caption">Logos</Typography></Divider></Grid>
                                    <Grid item xs={12}>
                                        <TextField label="Tam. Logo" size="small" fullWidth
                                            value={currentSettings.styles.header_config?.logo_size || '80px'}
                                            onChange={(e) => updateNestedSetting('header_config', 'logo_size', e.target.value)}
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" gutterBottom>Logo Principal</Typography>
                                        {currentSettings.styles.header_config?.logo_url ? (
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, p: 1, border: '1px dashed #ccc', borderRadius: 1 }}>
                                                <img 
                                                    src={currentSettings.styles.header_config.logo_url} 
                                                    alt="Logo Principal" 
                                                    style={{ maxHeight: '80px', maxWidth: '100%', objectFit: 'contain' }} 
                                                />
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
                                                     <Button component="label" variant="outlined" size="small" fullWidth sx={{ fontSize: '0.7rem' }}>
                                                        Trocar
                                                        <input type="file" hidden onChange={(e) => handleFileUpload(e, 'header_config', 'logo_url')} />
                                                    </Button>
                                                    <Button variant="outlined" color="error" size="small" fullWidth sx={{ fontSize: '0.7rem' }}
                                                        onClick={() => updateNestedSetting('header_config', 'logo_url', null)}>
                                                        Remover
                                                    </Button>
                                                </Box>
                                            </Box>
                                        ) : (
                                            <Button component="label" variant="outlined" size="small" fullWidth sx={{ height: '100px', borderStyle: 'dashed', flexDirection: 'column' }}>
                                                Upload<br/>Principal
                                                <input type="file" hidden onChange={(e) => handleFileUpload(e, 'header_config', 'logo_url')} />
                                            </Button>
                                        )}
                                    </Grid>

                                     <Grid item xs={6}>
                                         <Typography variant="caption" gutterBottom>Logo Obediência</Typography>
                                         {currentSettings.styles.header_config?.logo_obedience ? (
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, p: 1, border: '1px dashed #ccc', borderRadius: 1 }}>
                                                <img 
                                                    src={currentSettings.styles.header_config.logo_obedience} 
                                                    alt="Logo Obediência" 
                                                    style={{ maxHeight: '80px', maxWidth: '100%', objectFit: 'contain' }} 
                                                />
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
                                                     <Button component="label" variant="outlined" size="small" fullWidth sx={{ fontSize: '0.7rem' }}>
                                                        Trocar
                                                        <input type="file" hidden onChange={(e) => handleFileUpload(e, 'header_config', 'logo_obedience')} />
                                                    </Button>
                                                    <Button variant="outlined" color="error" size="small" fullWidth sx={{ fontSize: '0.7rem' }}
                                                        onClick={() => updateNestedSetting('header_config', 'logo_obedience', null)}>
                                                        Remover
                                                    </Button>
                                                </Box>
                                            </Box>
                                        ) : (
                                            <Button component="label" variant="outlined" size="small" fullWidth sx={{ height: '100px', borderStyle: 'dashed', flexDirection: 'column' }}>
                                                Upload<br/>Obediência
                                                <input type="file" hidden onChange={(e) => handleFileUpload(e, 'header_config', 'logo_obedience')} />
                                            </Button>
                                        )}
                                    </Grid>

                                    {/* Spacing & Layout Controls */}
                                    <Grid item xs={12}><Divider sx={{ my: 1 }}><Typography variant="caption">Espaçamento e Layout</Typography></Divider></Grid>
                                    
                                    <Grid item xs={6}>
                                        <TextField label="Padding Interno" fullWidth size="small"
                                            value={currentSettings.styles.header_config?.padding || '0.3cm'}
                                            onChange={(e) => updateNestedSetting('header_config', 'padding', e.target.value)}
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" gutterBottom>Altura da Linha</Typography>
                                        <Slider
                                            value={currentSettings.styles.header_config?.line_height || 1.2}
                                            min={0.8} max={3.0} step={0.1}
                                            onChange={(_, val) => updateNestedSetting('header_config', 'line_height', val)}
                                            size="small"
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Typography variant="caption">Opacidade Fundo ({Math.round((currentSettings.styles.header_config?.background_opacity || 1.0) * 100)}%)</Typography>
                                        <Slider
                                            value={currentSettings.styles.header_config?.background_opacity || 1.0}
                                            min={0} max={1} step={0.1}
                                            onChange={(_, val) => updateNestedSetting('header_config', 'background_opacity', val)}
                                            size="small"
                                        />
                                    </Grid>

                                </Grid>
                            </AccordionDetails>
                        </Accordion>

                         {/* TÍTULOS */}
                        <Accordion expanded={expandedAccordion === 'titles_section'} onChange={handleAccordionChange('titles_section')}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography sx={{ fontWeight: 'bold' }}>Títulos</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Fonte dos Títulos</InputLabel>
                                            <Select
                                                value={currentSettings.styles.titles_config?.font_family || ''}
                                                label="Fonte dos Títulos"
                                                onChange={(e) => updateNestedSetting('titles_config', 'font_family', e.target.value)}
                                            >
                                                <MenuItem value="">Herdar da Página</MenuItem>
                                                <MenuItem value="Arial, sans-serif">Arial</MenuItem>
                                                <MenuItem value="'Times New Roman', serif">Times New Roman</MenuItem>
                                                <MenuItem value="'Roboto', sans-serif">Roboto</MenuItem>
                                                <MenuItem value="'Great Vibes', cursive">Manuscrita</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Tamanho Fonte</InputLabel>
                                            <Select
                                                value={currentSettings.styles.titles_config?.font_size || '14pt'}
                                                label="Tamanho Fonte"
                                                onChange={(e) => updateNestedSetting('titles_config', 'font_size', e.target.value)}
                                            >
                                                <MenuItem value="10pt">10pt</MenuItem>
                                                <MenuItem value="11pt">11pt</MenuItem>
                                                <MenuItem value="12pt">12pt</MenuItem>
                                                <MenuItem value="14pt">14pt</MenuItem>
                                                <MenuItem value="16pt">16pt</MenuItem>
                                                <MenuItem value="18pt">18pt</MenuItem>
                                                <MenuItem value="24pt">24pt</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Alinhamento</InputLabel>
                                            <Select
                                                value={currentSettings.styles.titles_config?.alignment || 'center'}
                                                label="Alinhamento"
                                                onChange={(e) => updateNestedSetting('titles_config', 'alignment', e.target.value)}
                                            >
                                                <MenuItem value="left">Esquerda</MenuItem>
                                                <MenuItem value="center">Centralizado</MenuItem>
                                                <MenuItem value="right">Direita</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField label="Cor Texto" type="color" fullWidth size="small"
                                            value={currentSettings.styles.titles_config?.color || '#000000'}
                                            onChange={(e) => updateNestedSetting('titles_config', 'color', e.target.value)}
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField label="Margem Superior" fullWidth size="small"
                                            value={currentSettings.styles.titles_config?.margin_top || '10px'}
                                            onChange={(e) => updateNestedSetting('titles_config', 'margin_top', e.target.value)}
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField label="Margem Inferior" fullWidth size="small"
                                            value={currentSettings.styles.titles_config?.margin_bottom || '20px'}
                                            onChange={(e) => updateNestedSetting('titles_config', 'margin_bottom', e.target.value)}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <FormControlLabel control={
                                            <Switch checked={currentSettings.styles.titles_config?.show !== false} 
                                                onChange={(e) => updateNestedSetting('titles_config', 'show', e.target.checked)} />
                                        } label="Mostrar Seção de Títulos" />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <FormControlLabel control={
                                            <Switch checked={currentSettings.styles.titles_config?.uppercase !== false} 
                                                onChange={(e) => updateNestedSetting('titles_config', 'uppercase', e.target.checked)} />
                                        } label="Caixa Alta (Uppercase)" />
                                        <FormControlLabel control={
                                            <Switch checked={currentSettings.styles.titles_config?.bold !== false} 
                                                onChange={(e) => updateNestedSetting('titles_config', 'bold', e.target.checked)} />
                                        } label="Negrito" />
                                    </Grid>
                                </Grid>
                            </AccordionDetails>
                        </Accordion>

                        {/* CONTEÚDO */}
                        <Accordion expanded={expandedAccordion === 'content_section'} onChange={handleAccordionChange('content_section')}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography sx={{ fontWeight: 'bold' }}>Conteúdo</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Fonte</InputLabel>
                                            <Select
                                                value={currentSettings.styles.font_family || 'Arial, sans-serif'}
                                                label="Fonte"
                                                onChange={(e) => updateCurrentSetting('font_family', e.target.value, true)}
                                            >
                                                <MenuItem value="Arial, sans-serif">Arial</MenuItem>
                                                <MenuItem value="'Times New Roman', serif">Times New Roman</MenuItem>
                                                <MenuItem value="'Roboto', sans-serif">Roboto</MenuItem>
                                                <MenuItem value="'Great Vibes', cursive">Manuscrita</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField label="Tam. Fonte" size="small" fullWidth
                                            value={currentSettings.styles.content_config?.font_size || '12pt'}
                                            onChange={(e) => updateNestedSetting('content_config', 'font_size', e.target.value)}
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField label="Cor Texto" type="color" size="small" fullWidth
                                            value={currentSettings.styles.content_config?.color || '#000000'}
                                            onChange={(e) => updateNestedSetting('content_config', 'color', e.target.value)}
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <TextField label="Cor Fundo" type="color" size="small" fullWidth
                                                value={currentSettings.styles.content_config?.background_color === 'transparent' ? '#ffffff' : (currentSettings.styles.content_config?.background_color || '#ffffff')}
                                                onChange={(e) => updateNestedSetting('content_config', 'background_color', e.target.value)}
                                                InputLabelProps={{ shrink: true }}
                                            />
                                            <Button 
                                                variant="outlined" 
                                                size="small" 
                                                onClick={() => updateNestedSetting('content_config', 'background_color', 'transparent')}
                                                sx={{ minWidth: '40px', padding: '4px', fontSize: '0.7em', height: '40px', lineHeight: 1 }}
                                                title="Fundo Transparente"
                                            >
                                                Transp.
                                            </Button>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField label="Img Fundo (URL)" fullWidth size="small"
                                            value={currentSettings.styles.content_config?.background_image || ''}
                                            onChange={(e) => updateNestedSetting('content_config', 'background_image', e.target.value)}
                                        />
                                        <Button component="label" variant="outlined" size="small" sx={{ mt: 1, width: '100%' }}>
                                            Upload Imagem
                                            <input type="file" hidden onChange={(e) => handleFileUpload(e, 'content_config', 'background_image')} />
                                        </Button>
                                    </Grid>
                                     <Grid item xs={6}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Esp. Linhas</InputLabel>
                                            <Select
                                                value={currentSettings.styles.content_config?.line_height || 1.5}
                                                label="Esp. Linhas"
                                                onChange={(e) => updateNestedSetting('content_config', 'line_height', e.target.value)}
                                            >
                                                <MenuItem value={1.0}>1.0</MenuItem>
                                                <MenuItem value={1.2}>1.2</MenuItem>
                                                <MenuItem value={1.5}>1.5</MenuItem>
                                                <MenuItem value={2.0}>2.0</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField label="Esp. Parágrafos" size="small" fullWidth
                                            value={currentSettings.styles.content_config?.spacing || '10px'}
                                            onChange={(e) => updateNestedSetting('content_config', 'spacing', e.target.value)}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Alinhamento</InputLabel>
                                            <Select
                                                value={currentSettings.styles.content_config?.alignment || 'justify'}
                                                label="Alinhamento"
                                                onChange={(e) => updateNestedSetting('content_config', 'alignment', e.target.value)}
                                            >
                                                <MenuItem value="left">Esquerda</MenuItem>
                                                <MenuItem value="center">Centralizado</MenuItem>
                                                <MenuItem value="right">Direita</MenuItem>
                                                <MenuItem value="justify">Justificado</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                </Grid>
                            </AccordionDetails>
                        </Accordion>


                        {/* RODAPÉ */}
                        <Accordion expanded={expandedAccordion === 'footer_section'} onChange={handleAccordionChange('footer_section')}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography sx={{ fontWeight: 'bold' }}>Rodapé</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <TextField label="Cor Fundo" type="color" fullWidth size="small" 
                                                value={currentSettings.styles.footer_config?.background_color === 'transparent' ? '#ffffff' : (currentSettings.styles.footer_config?.background_color || '#ffffff')}
                                                onChange={(e) => updateNestedSetting('footer_config', 'background_color', e.target.value)}
                                                InputLabelProps={{ shrink: true }}
                                            />
                                            <Button 
                                                variant="outlined" 
                                                size="small" 
                                                onClick={() => updateNestedSetting('footer_config', 'background_color', 'transparent')}
                                                sx={{ minWidth: '40px', padding: '4px', fontSize: '0.7em', height: '40px', lineHeight: 1 }}
                                                title="Fundo Transparente"
                                            >
                                                Transp.
                                            </Button>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField label="Img Fundo (URL)" fullWidth size="small"
                                            value={currentSettings.styles.footer_config?.background_image || ''}
                                            onChange={(e) => updateNestedSetting('footer_config', 'background_image', e.target.value)}
                                        />
                                        <Button component="label" variant="outlined" size="small" sx={{ mt: 1, width: '100%' }}>
                                            Upload Imagem
                                            <input type="file" hidden onChange={(e) => handleFileUpload(e, 'footer_config', 'background_image')} />
                                        </Button>
                                    </Grid>
                                     <Grid item xs={6}>
                                        <TextField label="Cor Texto" type="color" fullWidth size="small" 
                                            value={currentSettings.styles.footer_config?.color || '#000000'}
                                            onChange={(e) => updateNestedSetting('footer_config', 'color', e.target.value)}
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField label="Margem Superior" fullWidth size="small"
                                            value={currentSettings.styles.footer_config?.spacing_top || '40px'}
                                            onChange={(e) => updateNestedSetting('footer_config', 'spacing_top', e.target.value)}
                                        />
                                    </Grid>
                                     <Grid item xs={6}>
                                        <TextField label="Tam. Fonte" fullWidth size="small"
                                            value={currentSettings.styles.footer_config?.font_size || '10pt'}
                                            onChange={(e) => updateNestedSetting('footer_config', 'font_size', e.target.value)}
                                        />
                                    </Grid>
                                </Grid>
                                <FormControlLabel
                                     control={
                                         <Switch
                                             checked={currentSettings.styles.show_page_numbers !== false}
                                             onChange={(e) => updateCurrentSetting('show_page_numbers', e.target.checked, true)}
                                             size="small"
                                         />
                                     }
                                     label="Exibir Números de Página"
                                />
                            </AccordionDetails>
                        </Accordion>
                        
                         {/* CONFIGS GERAIS */}
                         <Accordion expanded={expandedAccordion === 'page_section'} onChange={handleAccordionChange('page_section')}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography sx={{ fontWeight: 'bold' }}>Página</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Tamanho</InputLabel>
                                            <Select
                                                value={currentSettings.styles.page_size || 'A4'}
                                                label="Tamanho"
                                                onChange={(e) => updateCurrentSetting('page_size', e.target.value, true)}
                                            >
                                                <MenuItem value="A4">A4</MenuItem>
                                                <MenuItem value="A5">A5</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Orientação</InputLabel>
                                            <Select
                                                value={currentSettings.styles.orientation || 'portrait'}
                                                label="Orientação"
                                                onChange={(e) => updateCurrentSetting('orientation', e.target.value, true)}
                                            >
                                                <MenuItem value="portrait">Retrato</MenuItem>
                                                <MenuItem value="landscape">Paisagem</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField label="Margem da Página" size="small" fullWidth
                                            value={currentSettings.styles.page_margin || '1cm'}
                                            onChange={(e) => updateCurrentSetting('page_margin', e.target.value, true)}
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField label="Padding Interno" size="small" fullWidth
                                            value={currentSettings.styles.page_padding || '0cm'}
                                            onChange={(e) => updateCurrentSetting('page_padding', e.target.value, true)}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField label="Cor da Página" type="color" fullWidth size="small"
                                            value={currentSettings.styles.background_color || '#ffffff'}
                                            onChange={(e) => updateCurrentSetting('background_color', e.target.value, true)}
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    </Grid>
                                    
                                    <Grid item xs={12}><Divider sx={{ my: 1 }}><Typography variant="caption">Bordas</Typography></Divider></Grid>
                                    
                                     <Grid item xs={6}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Estilo Borda</InputLabel>
                                            <Select
                                                 value={currentSettings.styles.show_border ? currentSettings.styles.border_style : 'none'}
                                                 label="Estilo Borda"
                                                 onChange={(e) => {
                                                     if (e.target.value === 'none') {
                                                         updateCurrentSetting('show_border', false, true);
                                                     } else {
                                                         updateCurrentSetting('show_border', true, true);
                                                         updateCurrentSetting('border_style', e.target.value, true);
                                                     }
                                                 }}
                                            >
                                                <MenuItem value="none">Sem Borda</MenuItem>
                                                <MenuItem value="solid">Linha Simples</MenuItem>
                                                <MenuItem value="double">Linha Dupla</MenuItem>
                                                <MenuItem value="dashed">Tracejado</MenuItem>
                                                <MenuItem value="dotted">Pontilhado</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                     <Grid item xs={4}>
                                        <TextField label="Espessura" size="small" fullWidth
                                            value={currentSettings.styles.border_width || '3px'}
                                            onChange={(e) => updateCurrentSetting('border_width', e.target.value, true)}
                                            disabled={!currentSettings.styles.show_border}
                                        />
                                    </Grid>
                                    <Grid item xs={2}>
                                        <TextField label="Cor" type="color" size="small" fullWidth
                                            value={currentSettings.styles.border_color || '#000000'}
                                            onChange={(e) => updateCurrentSetting('border_color', e.target.value, true)}
                                            InputLabelProps={{ shrink: true }}
                                            disabled={!currentSettings.styles.show_border}
                                        />
                                    </Grid>

                                    <Grid item xs={12}><Divider sx={{ my: 1 }}><Typography variant="caption">Marca d'Água</Typography></Divider></Grid>

                                    <Grid item xs={12}>
                                        <TextField label="URL Marca d'Água" fullWidth size="small"
                                            value={currentSettings.styles.watermark_image || ''}
                                            onChange={(e) => updateCurrentSetting('watermark_image', e.target.value, true)}
                                        />
                                         <Button component="label" variant="outlined" size="small" sx={{ mt: 1, width: '100%' }}>
                                            Upload Marca d'Água
                                            <input type="file" hidden onChange={(e) => handleFileUpload(e, 'styles', 'watermark_image')} />
                                        </Button>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Typography variant="caption">Opacidade Marca d'Água ({Math.round((currentSettings.styles.watermark_opacity || 0.1) * 100)}%)</Typography>
                                        <Slider
                                            value={currentSettings.styles.watermark_opacity || 0.1}
                                            min={0}
                                            max={1}
                                            step={0.05}
                                            onChange={(_, value) => updateCurrentSetting('watermark_opacity', value, true)}
                                            valueLabelDisplay="auto"
                                            valueLabelFormat={(x) => `${Math.round(x * 100)}%`}
                                        />
                                    </Grid>
                                </Grid>
                            </AccordionDetails>
                        </Accordion>

                        <Box sx={{ mt: 2, p: 1 }}>
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


                {/* VISUALIZAÇÃO (Direita) */}
                <Grid item xs={12} md={8} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                     <Paper sx={{ p: 4, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', bgcolor: '#f5f5f5' }}>
                        <div style={{ 
                            flexGrow: 1, 
                            overflow: 'auto', 
                            display: 'flex', 
                            justifyContent: 'center', 
                            alignItems: 'flex-start',
                            padding: '20px'
                        }}>
                             <Paper elevation={3} sx={{ 
                                width: paperDims.width, 
                                minHeight: paperDims.height, 
                                padding: currentSettings.styles.page_margin || '1cm', 
                                boxSizing: 'border-box',
                                backgroundColor: currentSettings.styles.background_color || '#fff',
                                backgroundImage: currentSettings.styles.background_image !== 'none' ? `url(${currentSettings.styles.background_image})` : 'none',
                                backgroundSize: 'cover',
                                // border removed from here to fix visual overlap
                                position: 'relative',
                                display: 'flex', 
                                flexDirection: 'column'
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
                                        border: `${currentSettings.styles.border_width || '3px'} ${currentSettings.styles.border_style} ${currentSettings.styles.border_color || currentSettings.styles.primary_color}`,
                                        pointerEvents: 'none',
                                        zIndex: 50
                                    }} />
                                )}
                                
                                {/* Conteúdo Central - Com Padding Interno */}
                                <div style={{ 
                                    height: '100%', 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    zIndex: 20,
                                    padding: currentSettings.styles.page_padding || '0cm'
                                }}>
                                    
                                    {/* CABEÇALHO (Server-Side Rendered Preview) */}
                                    {currentSettings.header !== 'no_header' && (
                                        <div style={{ marginBottom: currentSettings.styles.header_config?.spacing_bottom || '20px' }}>
                                            {previewLoading ? (
                                                <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                                                    <CircularProgress size={20} />
                                                </div>
                                            ) : (
                                                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                                            )}
                                        </div>
                                    )}

                                    {/* TÍTULOS (Balaústre/Standard) */}
                                    {currentSettings.styles.titles_config?.show !== false && (
                                        <div style={{
                                            textAlign: (currentSettings.styles.titles_config?.alignment as any) || 'center',
                                            marginTop: currentSettings.styles.titles_config?.margin_top || '10px',
                                            marginBottom: currentSettings.styles.titles_config?.margin_bottom || '20px',
                                            fontFamily: currentSettings.styles.titles_config?.font_family || currentSettings.styles.font_family,
                                            color: currentSettings.styles.titles_config?.color || currentSettings.styles.primary_color,
                                            lineHeight: currentSettings.styles.titles_config?.line_height || 1.2,
                                            textTransform: currentSettings.styles.titles_config?.uppercase ? 'uppercase' : 'none',
                                            fontWeight: currentSettings.styles.titles_config?.bold ? 'bold' : 'normal',
                                            fontSize: currentSettings.styles.titles_config?.font_size || '14pt'
                                        }}>
                                            À GL∴ DO SUPR∴ ARQ∴ DO UNIV'∴ <br/>
                                            {lodgeData?.lodge_title || 'A.R.L.S.'} {lodgeData?.lodge_name || 'NOME DA LOJA'} Nº {lodgeData?.lodge_number || '0000'} <br/>
                                            BALAÚSTRE DA _____ª SESSÃO DO E∴ M∴ 2025/2026
                                        </div>
                                    )}

                                    {/* CORPO DO DOCUMENTO */}
                                    <div style={{ flexGrow: 1, overflow: 'hidden' }}>
                                         {renderPreviewContent()}
                                    </div>
                                </div>
                            </Paper>
                        </div>
                     </Paper>
                </Grid>
            </Grid>

            {/* Snackbar para Feedback */}
            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default DocumentConfigPage;
