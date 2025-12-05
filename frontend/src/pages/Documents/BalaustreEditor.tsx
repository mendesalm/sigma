import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Button, 
  Container, 
  Paper, 
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

  const [styles, setStyles] = useState({
    header_bg_color: 'transparent',
    header_text_color: '#380404',
    page_bg_color: 'white',
    logo_height: '80px',
    border_color: 'black',
    border_style: 'solid',
    border_width: '1px'
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Data Form State
  const [dataDialogOpen, setDataDialogOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        const response = await api.get(`/masonic-sessions/${sessionId}/balaustre-draft`);
        setSessionData(response.data.data);
        setDocumentContent({ text: response.data.text });
        
        // Initialize form data with session data
        setFormData(response.data.data || {});
        
        // Load saved styles if available
        if (response.data.data.styles) {
            setStyles(prev => ({ ...prev, ...response.data.data.styles }));
        }
        
      } catch (error) {
        console.error('Erro ao carregar dados da sessão:', error);
        setSnackbar({ open: true, message: 'Erro ao carregar dados.', severity: 'error' });
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchSessionData();
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
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
      [{ 'align': [] }],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent',
    'align'
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

      <Container maxWidth={false} sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Paper 
          elevation={3}
          sx={{ 
            width: A4_WIDTH, 
            minHeight: A4_HEIGHT, 
            p: '1cm', // Margem externa para a borda
            bgcolor: styles.page_bg_color, // Dynamic Page Background
            boxSizing: 'border-box',
            fontFamily: '"Times New Roman", Times, serif',
            color: 'black'
          }}
        >
          <Box sx={{ 
            borderWidth: styles.border_width,
            borderStyle: styles.border_style,
            borderColor: styles.border_color,
            minHeight: 'calc(297mm - 2cm)', // Altura A4 menos as margens
            pt: '0.5cm', // Margem superior reduzida
            px: '0.5cm', // Margem lateral reduzida
            pb: '0.5cm', // Margem inferior reduzida
            display: 'flex', 
            flexDirection: 'column' 
          }}>
            {/* Cabeçalho Dinâmico (Centralizado) */}
            <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                mb: 4, 
                pb: 2,
                bgcolor: styles.header_bg_color,
                color: styles.header_text_color
            }}>
              <Box sx={{ mb: 2 }}>
                 {sessionData?.header_image ? (
                   <img src={sessionData.header_image} alt="Logo" style={{ maxHeight: styles.logo_height, maxWidth: '100%' }} />
                 ) : (
                   <Box sx={{ width: 80, height: 80, bgcolor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Logo</Box>
                 )}
              </Box>
              
              <Typography variant="body1" sx={{ fontFamily: 'inherit', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12pt', color: 'inherit', m: 0 }}>
                À GL∴ DO SUPR∴ ARQ∴ DO UNIV∴
              </Typography>
              
              <Typography variant="body1" sx={{ fontFamily: 'inherit', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12pt', color: 'inherit', mt: 0.5 }}>
                A∴R∴B∴L∴S {sessionData?.lodge_name || 'NOME DA LOJA'} Nº {sessionData?.lodge_number}
              </Typography>
              
              <Typography variant="body1" sx={{ fontFamily: 'inherit', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12pt', color: 'inherit', mt: 0.5 }}>
                BALAÚSTRE DA _______ª SESSÃO DO EXERCÍCIO MAÇÔNICO
              </Typography>
              
              <Typography variant="body1" sx={{ fontFamily: 'inherit', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12pt', color: 'inherit', mt: 0.5 }}>
                SESSÃO {sessionData?.ClasseSessao || 'ORDINÁRIA'} NO GRAU DE {sessionData?.GrauSessao || 'APRENDIZ'}
              </Typography>
            </Box>

            {/* ReactQuill Editor */}
            <Box sx={{ 
                flexGrow: 1, 
                display: 'flex', 
                flexDirection: 'column',
                '& .ql-toolbar': {
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    backgroundColor: '#f5f5f5',
                    border: '1px solid #ccc',
                    borderBottom: 'none'
                },
                '& .ql-container': {
                    flexGrow: 1,
                    border: 'none',
                    fontFamily: '"Times New Roman", Times, serif',
                    fontSize: '12pt'
                },
                '& .ql-editor': {
                    minHeight: '500px',
                    padding: 0,
                    textAlign: 'justify',
                    fontFamily: '"Times New Roman", Times, serif',
                    fontSize: '12pt'
                }
            }}>
                <ReactQuill 
                    theme="snow"
                    value={documentContent.text}
                    onChange={(value) => setDocumentContent({ ...documentContent, text: value })}
                    modules={modules}
                    formats={formats}
                />
            </Box>

            {/* Rodapé / Assinaturas */}
            <Box sx={{ mt: 'auto', pt: 8, display: 'flex', justifyContent: 'space-between', textAlign: 'center' }}>
              <Box>
                <Typography sx={{ fontFamily: 'inherit', borderTop: '1px solid black', pt: 1, width: 180, fontSize: '12pt', color: 'black' }}>
                  Secretário
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontFamily: 'inherit', borderTop: '1px solid black', pt: 1, width: 180, fontSize: '12pt', color: 'black' }}>
                  Venerável Mestre
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontFamily: 'inherit', borderTop: '1px solid black', pt: 1, width: 180, fontSize: '12pt', color: 'black' }}>
                  Orador
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Container>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 300, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Personalizar Aparência
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Typography variant="subtitle2" gutterBottom>
            Logo da Loja
          </Typography>
          <Button
            variant="outlined"
            component="label"
            fullWidth
            disabled={uploadingLogo}
            sx={{ mb: 2 }}
          >
            {uploadingLogo ? 'Enviando...' : 'Alterar Logo'}
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleLogoUpload}
            />
          </Button>
          <TextField
            label="Altura do Logo"
            value={styles.logo_height}
            onChange={(e) => setStyles({ ...styles, logo_height: e.target.value })}
            fullWidth
            margin="normal"
            size="small"
          />

          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle2" gutterBottom>
            Cores e Estilos
          </Typography>
          
          <TextField
            label="Cor do Texto (Cabeçalho)"
            value={styles.header_text_color}
            onChange={(e) => setStyles({ ...styles, header_text_color: e.target.value })}
            fullWidth
            margin="normal"
            size="small"
            type="color"
          />
          
          <TextField
            label="Cor de Fundo (Cabeçalho)"
            value={styles.header_bg_color}
            onChange={(e) => setStyles({ ...styles, header_bg_color: e.target.value })}
            fullWidth
            margin="normal"
            size="small"
          />

          <TextField
            label="Cor de Fundo (Página)"
            value={styles.page_bg_color}
            onChange={(e) => setStyles({ ...styles, page_bg_color: e.target.value })}
            fullWidth
            margin="normal"
            size="small"
            type="color"
          />

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" gutterBottom>
            Borda da Página
          </Typography>

          <TextField
            label="Largura da Borda"
            value={styles.border_width}
            onChange={(e) => setStyles({ ...styles, border_width: e.target.value })}
            fullWidth
            margin="normal"
            size="small"
          />

          <TextField
            label="Cor da Borda"
            value={styles.border_color}
            onChange={(e) => setStyles({ ...styles, border_color: e.target.value })}
            fullWidth
            margin="normal"
            size="small"
            type="color"
          />
           <TextField
            label="Estilo da Borda"
            value={styles.border_style}
            onChange={(e) => setStyles({ ...styles, border_style: e.target.value })}
            fullWidth
            margin="normal"
            size="small"
            select
            SelectProps={{
              native: true,
            }}
          >
            <option value="solid">Sólida</option>
            <option value="dashed">Tracejada</option>
            <option value="dotted">Pontilhada</option>
            <option value="double">Dupla</option>
            <option value="none">Nenhuma</option>
          </TextField>

          <Box sx={{ mt: 4 }}>
            <Button 
              variant="contained" 
              fullWidth 
              onClick={() => setDrawerOpen(false)}
            >
              Concluir
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
