import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Button, 
  Container, 
  Typography, 
  CircularProgress, 
  TextField,
  AppBar,
  Toolbar,
  IconButton,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Drawer,
  Divider
} from '@mui/material';
import { 
  ArrowBack, 
  Save, 
  PictureAsPdf,
  Edit,
  VerifiedUser
} from '@mui/icons-material';
import api, { uploadLodgeLogo } from '../../services/api';
import BalaustreDocumentForm from './components/BalaustreDocumentForm';
// @ts-ignore
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// ... (inside component)

// Estilos para simular folha A4
const A4_WIDTH = '210mm';
const A4_HEIGHT = '297mm';

const BalaustreEditor: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  // inputRef removed as it is not needed for ReactQuill

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);
  const [documentContent, setDocumentContent] = useState({
    text: '',
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const [styles, setStyles] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [editorFocused, setEditorFocused] = useState(false);

  // Data Form State
  const [dataDialogOpen, setDataDialogOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});

  // ... inside component ...
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        const response = await api.get(`/masonic-sessions/${sessionId}/balaustre-draft`);
        setSessionData(response.data.data);
        setDocumentContent({ text: response.data.text });
        
        // Initialize form data with session data
        setFormData(response.data.data || {});
        
        if (response.data.data.styles) {
            setStyles(response.data.data.styles);
        }
        
      } catch (error) {
        console.error('Erro ao carregar dados da sessão:', error);
        setSnackbar({ open: true, message: 'Erro ao carregar dados.', severity: 'error' });
      } finally {
        setLoading(false);
      }
    };

    const fetchMembers = async () => {
        try {
            const response = await api.get('/members?limit=1000');
             // Handle potentially wrapped response
             const membersList = Array.isArray(response.data) ? response.data : (response.data.data || []);
             setMembers(membersList);
        } catch (error) {
            console.error('Erro ao buscar membros', error);
        }
    };

    if (sessionId) {
      fetchSessionData();
      fetchMembers();
    }
  }, [sessionId]);

  const handleRegenerateText = async () => {
    setSaving(true);
    try {
      const response = await api.post(`/masonic-sessions/${sessionId}/regenerate-balaustre-text`, formData);
      setDocumentContent({ text: response.data.text });
      setSessionData({ ...sessionData, ...formData }); // Update local session data
      setDataDialogOpen(false);
      setSnackbar({ open: true, message: 'Texto regenerado com sucesso!', severity: 'success' });
    } catch (error) {
      console.error('Erro ao regenerar texto:', error);
      setSnackbar({ open: true, message: 'Erro ao regenerar texto.', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSignAndFinalize = async () => {
    if (!window.confirm("Atenção: Ao assinar, o documento será finalizado e não poderá mais ser editado. Deseja continuar?")) {
        return;
    }
    setSaving(true);
    try {
      await api.post(`/masonic-sessions/${sessionId}/sign-balaustre`, { 
        text: documentContent.text,
        styles: styles
      });
      setSnackbar({ open: true, message: 'Balaústre assinado e finalizado com sucesso!', severity: 'success' });
    } catch (error) {
      console.error('Erro ao assinar documento:', error);
      setSnackbar({ open: true, message: 'Erro ao assinar balaústre.', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post(`/masonic-sessions/${sessionId}/generate-balaustre-custom`, { 
        text: documentContent.text,
        styles: styles
      });
      setSnackbar({ open: true, message: 'Balaústre salvo com sucesso!', severity: 'success' });
    } catch (error) {
      console.error('Erro ao salvar documento:', error);
      setSnackbar({ open: true, message: 'Erro ao salvar balaústre.', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleGeneratePDF = async () => {
    setSaving(true);
    try {
      const response = await api.post(`/masonic-sessions/${sessionId}/preview-balaustre`, { 
        text: documentContent.text,
        styles: styles
      }, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `balaustre_sessao_${sessionId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setSnackbar({ open: true, message: 'PDF gerado com sucesso!', severity: 'success' });
    } catch (error: any) {
      console.error('Erro ao gerar PDF:', error);
      let errorMessage = 'Erro ao gerar PDF.';
      
      if (error.response && error.response.data) {
          // Se o backend retornou uma mensagem de erro (string ou objeto)
          if (typeof error.response.data === 'string') {
             errorMessage = `Erro: ${error.response.data}`;
          } else if (error.response.data.detail) {
             errorMessage = `Erro: ${error.response.data.detail}`;
          }
      }
      
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0] && sessionData?.lodge_id) {
      const file = event.target.files[0];
      const formData = new FormData();
      formData.append('file', file);
      
      setUploadingLogo(true);
      try {
        await uploadLodgeLogo(sessionData.lodge_id, formData);
        
        setSnackbar({ open: true, message: 'Logo atualizado com sucesso!', severity: 'success' });
        
        // Atualizar o estado local da imagem imediatamente
        const reader = new FileReader();
        reader.onload = (e) => {
            setSessionData((prev: any) => ({ ...prev, header_image: e.target?.result as string }));
        };
        reader.readAsDataURL(file);

      } catch (error) {
        console.error('Erro ao fazer upload do logo:', error);
        setSnackbar({ open: true, message: 'Erro ao atualizar logo.', severity: 'error' });
      } finally {
        setUploadingLogo(false);
      }
    }
  };

  const modules = {
    toolbar: [
      [{ 'font': [] }, { 'size': [] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'header': 1 }, { 'header': 2 }, 'blockquote', 'code-block'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }, { 'align': [] }],
      ['link', 'clean']
    ],
  };

  const formats = [
    'font', 'size',
    'header', 'bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block',
    'list', 'bullet', 'indent',
    'color', 'background',
    'script', 'align', 'direction',
    'link'
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', pb: 4 }}>
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar>
          <IconButton edge="start" onClick={() => navigate(-1)} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Editor de Balaústre
          </Typography>
          <Button 
            variant="outlined" 
            startIcon={<Edit />}
            onClick={() => setDataDialogOpen(true)}
            sx={{ mr: 2 }}
          >
            Dados do Balaústre
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => setDrawerOpen(true)}
            sx={{ mr: 2 }}
          >
            Personalizar
          </Button>
          <Button 
            variant="contained" 
            color="secondary"
            startIcon={<VerifiedUser />} 
            onClick={handleSignAndFinalize}
            disabled={saving}
            sx={{ mr: 2 }}
          >
            Assinar
          </Button>
          <Button 
            variant="contained" 
            startIcon={<Save />} 
            onClick={handleSave}
            disabled={saving}
            sx={{ mr: 2 }}
          >
            Salvar
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<PictureAsPdf />} 
            disabled={saving}
            onClick={handleGeneratePDF}
          >
            Gerar PDF
          </Button>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 300, p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>Personalização</Typography>
          
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Cor do Fundo da Página</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <input 
              type="color" 
              value={styles.page_bg_color} 
              onChange={(e) => setStyles({...styles, page_bg_color: e.target.value})} 
              style={{ marginRight: '10px' }}
            />
            <Typography variant="body2">{styles.page_bg_color}</Typography>
          </Box>

          <Typography variant="subtitle2" sx={{ mb: 1 }}>Cor do Fundo do Cabeçalho</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <input 
              type="color" 
              value={styles.header_bg_color} 
              onChange={(e) => setStyles({...styles, header_bg_color: e.target.value})} 
              style={{ marginRight: '10px' }}
            />
            <Typography variant="body2">{styles.header_bg_color}</Typography>
          </Box>

          <Typography variant="subtitle2" sx={{ mb: 1 }}>Cor do Texto do Cabeçalho</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <input 
              type="color" 
              value={styles.header_text_color} 
              onChange={(e) => setStyles({...styles, header_text_color: e.target.value})} 
              style={{ marginRight: '10px' }}
            />
            <Typography variant="body2">{styles.header_text_color}</Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle2" sx={{ mb: 1 }}>Tamanho do Logo (px)</Typography>
          <TextField
            fullWidth
            type="text"
            value={styles.logo_height}
            onChange={(e) => setStyles({...styles, logo_height: e.target.value})}
            sx={{ mb: 3 }}
            helperText="Ex: 80px, 2cm"
          />

          <Typography variant="subtitle2" sx={{ mb: 1 }}>Estilo da Borda</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
             <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ width: 100 }}>Cor:</Typography>
                <input 
                  type="color" 
                  value={styles.border_color} 
                  onChange={(e) => setStyles({...styles, border_color: e.target.value})} 
                />
             </Box>
             <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ width: 100 }}>Espessura:</Typography>
                <TextField
                  size="small"
                  value={styles.border_width}
                  onChange={(e) => setStyles({...styles, border_width: e.target.value})}
                />
             </Box>
             <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ width: 100 }}>Tipo:</Typography>
                <select 
                  value={styles.border_style}
                  onChange={(e) => setStyles({...styles, border_style: e.target.value})}
                  style={{ padding: '8px', width: '100%' }}
                >
                  <option value="solid">Sólida</option>
                  <option value="dashed">Tracejada</option>
                  <option value="dotted">Pontilhada</option>
                  <option value="double">Dupla</option>
                  <option value="none">Sem Borda</option>
                </select>
             </Box>
          </Box>

          <Divider sx={{ my: 3 }} />
          
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Logo da Loja</Typography>
          <Button
            variant="contained"
            component="label"
            fullWidth
            disabled={uploadingLogo}
          >
            {uploadingLogo ? 'Enviando...' : 'Alterar Logo'}
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleLogoUpload}
            />
          </Button>
        </Box>
      </Drawer>

      <Container maxWidth={false} sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 8 }}>
        {/* PAGE CONTAINER - mimics @page size */}
        <Box sx={{
          width: A4_WIDTH,
          minHeight: A4_HEIGHT, // Although in Web min-height is better, real PDF is fixed height per page. 
          // For Editor, we default to minHeight A4 but let it grow (scroll) as we edit.
          bgcolor: styles?.background_color || '#ffffff',
          position: 'relative', // Context for absolute positioning of border/content
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', // Elevation replacement
          // Background Image
          backgroundImage: styles?.background_image && styles.background_image !== 'none' ? `url(${styles.background_image})` : 'none',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          overflow: 'hidden' // Clip content to page
        }}>

            {/* LAYER 1: BORDER (Fixed Position relative to Page) */}
            {styles?.show_border !== false && (
                <Box sx={{
                    position: 'absolute',
                    top: styles?.page_margin || '1cm',
                    left: styles?.page_margin || '1cm',
                    right: styles?.page_margin || '1cm',
                    bottom: styles?.page_margin || '1cm',
                    borderWidth: styles?.border_width || '1px',
                    borderStyle: styles?.border_style || 'solid',
                    borderColor: styles?.border_color || '#000',
                    zIndex: 1, // Above background, below content? No, PDF border is usually on top or around. 
                    // In PDF template, .page-border has z-index: big and pointer-events: none.
                    pointerEvents: 'none'
                }} />
            )}

            {/* LAYER 2: CONTENT CONTAINER (Absolute/Relative positioning matching PDF .page-content) */}
            <Box sx={{
                position: 'absolute', // mimics .page-content { position: absolute }
                top: styles?.page_margin || '1cm',
                left: styles?.page_margin || '1cm',
                right: styles?.page_margin || '1cm',
                bottom: styles?.page_margin || '1cm',
                padding: styles?.page_padding || '0cm',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 2,
                overflowY: 'auto' // Allow scrolling if content overflows A4 in Editor
            }}>

                {/* HEADER SECTION (Top of Content) */}
                {(() => {
                    const headerTemplate = sessionData?.header_template || 'header_classico.html';
                    
                    const logo = (
                         <Box sx={{ mb: 1 }}>
                            {sessionData?.header_image ? (
                            <img src={sessionData.header_image} alt="Logo" style={{ maxHeight: styles?.header_config?.logo_size || '80px', maxWidth: '100%' }} />
                            ) : (
                            <Box sx={{ width: 80, height: 80, bgcolor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Logo</Box>
                            )}
                        </Box>
                    );

                    // Note: Header Text is DIFFERENT from Title Section.
                    // Header text usually contains "À GL..." and Lodge Name.
                    // HEADER TEXT (Matches header_classico.html: Lodge Name + Obedience)
                    const headerText = (
                        <Box sx={{ 
                            textAlign: styles?.header_config?.alignment_title || 'center',
                            color: styles?.header_config?.color || '#000',
                            flexGrow: 1
                        }}>
                             <Typography variant="body1" sx={{ fontFamily: 'inherit', fontWeight: 'bold', textTransform: 'uppercase', fontSize: styles?.header_config?.font_size_title || '12pt', color: 'inherit', m: 0, lineHeight: 1.2 }}>
                                {sessionData?.lodge_title_formatted} {sessionData?.lodge_name || 'NOME DA LOJA'} Nº {sessionData?.lodge_number}
                            </Typography>
                             <Typography variant="body1" sx={{ 
                                 fontFamily: 'inherit', 
                                 fontWeight: 'normal', 
                                 fontSize: styles?.header_config?.font_size_subtitle || '12pt', 
                                 color: 'inherit', 
                                 mt: 0.5, 
                                 lineHeight: 1.2,
                                 textAlign: styles?.header_config?.alignment_subtitle || 'center' // Explicit Subtitle Alignment
                             }}>
                                Federada ao {sessionData?.obedience_name || 'Grande Oriente do Brasil'} <br/>
                                Jurisdicionada ao {sessionData?.subobedience_name || 'GOB-SP'}
                            </Typography>
                        </Box>
                    );

                    // CSS for Header Container needs to match header_classico wrapper logic
                    const headerContainerSx = {
                        mb: styles?.header_config?.spacing_bottom || '20px', 
                        bgcolor: styles?.header_config?.background_color || 'transparent',
                        p: styles?.header_config?.padding || '0',
                        // Border Bottom Logic to match header_classico.html
                        borderBottomWidth: styles?.header_config?.border_bottom_show ? (styles?.header_config?.border_bottom_width || '1px') : 0,
                        borderBottomStyle: styles?.header_config?.border_bottom_show ? (styles?.header_config?.border_bottom_style || 'solid') : 'none',
                        borderBottomColor: styles?.header_config?.border_bottom_show ? (styles?.header_config?.border_bottom_color || styles?.primary_color || '#000') : 'transparent',
                    };

                    if (headerTemplate.includes('timbre')) {
                        return (
                            <Box sx={{ ...headerContainerSx, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                {logo}
                                {headerText}
                            </Box>
                        );
                    } else if (headerTemplate.includes('invertido')) {
                        return (
                            <Box sx={{ ...headerContainerSx, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box sx={{ flex: 1 }}>{headerText}</Box>
                                <Box sx={{ ml: 2 }}>{logo}</Box>
                            </Box>
                        );
                    } else if (headerTemplate.includes('duplo')) {
                         return (
                            <Box sx={{ ...headerContainerSx, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box sx={{ mr: 2 }}>{logo}</Box>
                                <Box sx={{ flex: 1 }}>{headerText}</Box>
                                <Box sx={{ ml: 2, opacity: 0.5 }}>{logo}</Box> 
                            </Box>
                        );
                    } else {
                         return (
                            <Box sx={{ ...headerContainerSx, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: '20px' }}>
                                <Box>{logo}</Box>
                                <Box sx={{ flex: 1 }}>{headerText}</Box>
                            </Box>
                        );
                    }
                })()}

                {/* TITLE SECTION (Document Title - Matches balaustre_template.html logic) */}
                {styles?.titles_config?.show !== false && (
                <Box sx={{
                    textAlign: styles?.titles_config?.alignment || 'center',
                    mt: styles?.titles_config?.margin_top || '10px',
                    mb: styles?.titles_config?.margin_bottom || '20px',
                    bgcolor: styles?.titles_config?.background_color || 'transparent',
                    p: styles?.titles_config?.padding || '0',
                    border: '1px solid transparent', // Prevent margin collapse
                    flexShrink: 0,
                    // Apply Font Styles from TitlesConfig
                    fontFamily: styles?.titles_config?.font_family || 'inherit', 
                    color: styles?.titles_config?.color || '#000000',
                    lineHeight: styles?.titles_config?.line_height || 1.2
                }}>
                     <Typography variant="body1" component="div" sx={{ 
                        fontFamily: 'inherit',
                        fontWeight: styles?.titles_config?.bold ? 'bold' : 'normal', 
                        textTransform: styles?.titles_config?.uppercase ? 'uppercase' : 'none', 
                        fontSize: styles?.titles_config?.font_size || '14pt', 
                        color: styles?.titles_config?.color || '#000000'
                    }}>
                        À GL∴ DO SUPR∴ ARQ∴ DO UNIV∴ <br/>
                        {sessionData?.lodge_title_formatted} {sessionData?.lodge_name || 'NOME DA LOJA'} Nº {sessionData?.lodge_number} <br/>
                        BALAÚSTRE DA {sessionData?.session_number || '_______'}ª SESSÃO DO E∴ M∴ {sessionData?.exercicio_maconico || '_______'}
                    </Typography>
                </Box>
                )}

                {/* EDITOR CONTENT AREA */}
                {/* This mimics .content { ...styles.content_config } */}
                <Box sx={{ 
                    flexGrow: 1, 
                    display: 'flex', 
                    flexDirection: 'column',
                    position: 'relative',
                    
                    // Content Config Application
                    textAlign: styles?.content_config?.alignment || 'justify',
                    fontFamily: styles?.content_config?.font_family || styles?.font_family || 'inherit',
                    fontSize: styles?.content_config?.font_size || '12pt',
                    lineHeight: styles?.content_config?.line_height || 1.5,
                    color: styles?.content_config?.color || '#000',
                    paddingTop: styles?.content_config?.padding_top || '0px',
                    paddingLeft: '0.3cm',
                    paddingRight: '0.3cm',
                    
                    // ReactQuill Internals Override
                    '& .ql-container': {
                        flexGrow: 1,
                        border: 'none',
                        fontFamily: 'inherit',
                        fontSize: 'inherit'
                    },
                    '& .ql-editor': {
                        padding: 0,
                        textAlign: 'inherit', // Inherit from parent Box
                        fontFamily: 'inherit',
                        fontSize: 'inherit',
                        lineHeight: 'inherit'
                    },
                    
                    // Spacing Override for Paragraphs
                    '& p': {
                        marginBottom: styles?.content_config?.spacing || '10px',
                        marginTop: 0,
                        textIndent: 0 // Reset default indent
                    },

                     /* Toolbar Flutuante Horizontal (Topo Centralizado) com Glassmorphism */
                    '& .ql-toolbar': {
                        position: 'fixed',
                        left: '58%',
                        top: '160px', /* Logo abaixo da AppBar */
                        transform: 'translateX(-50%)',
                        width: 'fit-content',
                        maxWidth: '95vw',
                        
                        /* Glassmorphism */
                        background: 'rgba(255, 255, 255, 0.85)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255, 255, 255, 0.5)',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                        borderRadius: '12px',
                        
                        padding: '8px 16px',
                        zIndex: 1200,
                        display: editorFocused ? 'flex' : 'none',
                        opacity: editorFocused ? 1 : 0,
                        visibility: editorFocused ? 'visible' : 'hidden',
                        transition: 'all 0.3s ease-in-out',
                        
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        gap: '12px',
                        
                        maxHeight: 'none',
                        overflow: 'visible'
                    },
                    // ... (keep previous ql-toolbar styles if possible, omitting for brevity in diff but assuming user wants them)
                    '& .ql-toolbar .ql-formats': { marginRight: 0, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '4px', borderBottom: 'none', borderRight: '1px solid rgba(0,0,0,0.1)', paddingBottom: 0, paddingRight: '12px' },
                    '& .ql-toolbar button': { width: '28px', height: '28px', padding: '4px', borderRadius: '4px', color: '#444' },
                    '& .ql-toolbar button:hover': { background: 'rgba(0,0,0,0.05)', color: '#000' },
                    '& .ql-toolbar button.ql-active': { background: 'rgba(25, 118, 210, 0.1)', color: '#1976d2' },
                    '& .ql-toolbar .ql-picker-label': { padding: '0 4px', color: '#555', fontWeight: 500 },
                    '& .ql-toolbar button svg': { width: '18px', height: '18px' },
                    '& .ql-toolbar .ql-stroke': { strokeWidth: '1.5px !important' }

                }}>
                    <ReactQuill 
                        theme="snow"
                        value={documentContent.text}
                        onChange={(value) => setDocumentContent({ ...documentContent, text: value })}
                        modules={modules}
                        formats={formats}
                        onFocus={() => setEditorFocused(true)}
                        onBlur={() => {
                            setTimeout(() => {
                                const toolbar = document.querySelector('.ql-toolbar');
                                if (toolbar && toolbar.matches(':hover')) return;
                                setEditorFocused(false);
                            }, 200);
                        }}
                    />
                </Box>

                {/* FOOTER SECTION: SIGNATURES MOCKUP */}
                 <Box sx={{ mt: 'auto', pt: 8, display: 'flex', justifyContent: 'space-between', textAlign: 'center', flexShrink: 0 }}>
                  <Box>
                    <Typography sx={{ fontFamily: 'inherit', borderTop: '1px solid black', pt: 1, width: 180, fontSize: '12pt', color: 'black' }}>
                      Secretário
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontFamily: 'inherit', borderTop: '1px solid black', pt: 1, width: 180, fontSize: '12pt', color: 'black' }}>
                      Orador
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontFamily: 'inherit', borderTop: '1px solid black', pt: 1, width: 180, fontSize: '12pt', color: 'black' }}>
                      Venerável Mestre
                    </Typography>
                  </Box>
                </Box>

            </Box> {/* End Layer 2 Content */}
        </Box> {/* End Page Container */}
      </Container>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 300, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Personalizar
          </Typography>
          <Box sx={{ mt: 2, mb: 2 }}>
            <Alert severity="info">
                A personalização de estilos foi movida para o <strong>Construtor de Documentos</strong>.
                Utilize o menu "Configurar Documentos" no painel administrativo para alterar cores, bordas e cabeçalhos.
            </Alert>
          </Box>
          
          <Box sx={{ mt: 4 }}>
            <Button 
              variant="contained" 
              fullWidth 
              onClick={() => setDrawerOpen(false)}
            >
              Fechar
            </Button>
          </Box>
        </Box>
      </Drawer>

      <Dialog open={dataDialogOpen} onClose={() => setDataDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Dados do Balaústre</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Atenção: Ao aplicar as alterações, o texto do editor será regenerado e quaisquer edições manuais diretas no texto serão perdidas.
            </Alert>
            
            <BalaustreDocumentForm 
                formData={formData} 
                onChange={setFormData} 
                members={members}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDataDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleRegenerateText} variant="contained" color="primary">
            Aplicar e Regenerar Texto
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BalaustreEditor;
