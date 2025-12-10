import React, { useEffect, useState, useContext } from 'react';
import { 
    Box, 
    Card, 
    CardContent, 
    Typography, 
    Button, 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions, 
    TextField, 
    MenuItem, 
    IconButton, 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    Paper,
    CircularProgress,
    Alert,
    Tooltip
} from '@mui/material';
import { Add, Delete, Visibility, CloudUpload } from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';
import { publicationService, Publication } from '../../services/publicationService';
import IcTempoEstudos from '../../assets/images/Ic_Tempo_de_Estudos.png';

// Ensure API URL is available
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const SecretarioPublicacoes: React.FC = () => {
    const { user } = useContext(AuthContext) || {};
    const [publications, setPublications] = useState<Publication[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [uploading, setUploading] = useState(false);
    
    // Form State
    const [title, setTitle] = useState('');
    const [type, setType] = useState('Aviso');
    const [content, setContent] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);

    const lodgeId = user?.lodge_id || user?.association_id;

    const fetchPublications = async () => {
        if (!lodgeId) return;
        setLoading(true);
        try {
            const data = await publicationService.getAll(lodgeId);
            setPublications(data);
        } catch (err) {
            console.error(err);
            setError('Erro ao carregar publicações.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchPublications();
        }
    }, [user]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.type !== 'application/pdf') {
                setError("Apenas arquivos PDF são permitidos.");
                return;
            }
            if (selectedFile.size > 5 * 1024 * 1024) {
               setError("O arquivo deve ter no máximo 5MB.");
               return;
            }
            setError(null);
            setFile(selectedFile);
        }
    };

    const handleCreate = async () => {
        if (!title || !file || !lodgeId) {
            setError("Preencha o título e selecione um arquivo.");
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('lodge_id', lodgeId.toString());
        formData.append('title', title);
        formData.append('type', type);
        formData.append('content', content);
        formData.append('file', file);
        // Default published_at is handled by backend or we can remove logic if backend expects it? 
        // Backend handles defaults.

        try {
            await publicationService.create(formData);
            setOpenDialog(false);
            resetForm();
            fetchPublications();
        } catch (err) {
            console.error(err);
            setError("Erro ao criar publicação.");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Tem certeza que deseja excluir esta publicação?")) return;
        try {
            await publicationService.delete(id, lodgeId);
            setPublications(publications.filter(p => p.id !== id));
        } catch (err) {
            console.error(err);
            setError("Erro ao excluir publicação.");
        }
    };

    const resetForm = () => {
        setTitle('');
        setType('Aviso');
        setContent('');
        setFile(null);
        setError(null);
    };

    const handleOpenPdf = (filePath: string) => {
        const url = `${API_URL}${filePath}`;
        window.open(url, '_blank');
    };

    return (
        <Box sx={{ p: 3 }}>
             <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <img src={IcTempoEstudos} alt="Publicações" style={{ width: 50, height: 50, objectFit: 'contain' }} />
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff' }}>
                            Gerenciar Publicações
                        </Typography>
                        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                            Faça o upload de documentos e comunicados para a Loja
                        </Typography>
                    </Box>
                </Box>
                <Button 
                    variant="contained" 
                    startIcon={<Add />} 
                    onClick={() => setOpenDialog(true)}
                    sx={{ bgcolor: '#0ea5e9', '&:hover': { bgcolor: '#0284c7' } }}
                >
                    Nova Publicação
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            <TableContainer component={Paper} sx={{ bgcolor: '#1e293b', border: '1px solid rgba(255,255,255,0.05)' }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ color: '#94a3b8' }}>Título</TableCell>
                            <TableCell sx={{ color: '#94a3b8' }}>Tipo</TableCell>
                            <TableCell sx={{ color: '#94a3b8' }}>Data</TableCell>
                            <TableCell sx={{ color: '#94a3b8' }}>Tamanho</TableCell>
                            <TableCell align="right" sx={{ color: '#94a3b8' }}>Ações</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                             <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 3 }}><CircularProgress /></TableCell>
                            </TableRow>
                        ) : publications.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ color: 'rgba(255,255,255,0.5)', py: 3 }}>
                                    Nenhuma publicação encontrada.
                                </TableCell>
                            </TableRow>
                        ) : (
                            publications.map((pub) => (
                                <TableRow key={pub.id} sx={{ '&:last-child td, &:last-child th': { border: 0 }, borderColor: 'rgba(255,255,255,0.05)' }}>
                                    <TableCell sx={{ color: '#fff', fontWeight: 500 }}>{pub.title}</TableCell>
                                    <TableCell>
                                        <Box sx={{ 
                                            bgcolor: 'rgba(14, 165, 233, 0.1)', 
                                            color: '#38bdf8', 
                                            px: 1, py: 0.5, 
                                            borderRadius: 1, 
                                            display: 'inline-block',
                                            fontSize: '0.75rem',
                                            fontWeight: 600
                                        }}>
                                            {pub.type}
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                        {pub.published_at ? new Intl.DateTimeFormat('pt-BR').format(new Date(pub.published_at)) : '-'}
                                    </TableCell>
                                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                        {pub.file_size ? `${(pub.file_size / 1024 / 1024).toFixed(2)} MB` : '-'}
                                    </TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Visualizar">
                                            <IconButton onClick={() => handleOpenPdf(pub.file_path)} sx={{ color: '#38bdf8' }}>
                                                <Visibility />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Excluir">
                                            <IconButton onClick={() => handleDelete(pub.id)} sx={{ color: '#ef4444' }}>
                                                <Delete />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Create Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: '#1e293b', color: '#fff' } }}>
                <DialogTitle>Nova Publicação</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <TextField
                            label="Título"
                            fullWidth
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            sx={{ 
                                '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' } },
                                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' }
                            }}
                        />
                        <TextField
                            select
                            label="Tipo"
                            fullWidth
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            sx={{ 
                                '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' } },
                                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                                '& .MuiSelect-icon': { color: '#fff' }
                            }}
                        >
                            {['Aviso', 'Notícia', 'Artigo', 'Boletim Oficial'].map((opt) => (
                                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            label="Descrição / Observações (Opcional)"
                            fullWidth
                            multiline
                            rows={3}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            sx={{ 
                                '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' } },
                                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' }
                            }}
                        />
                        
                        <Box sx={{ border: '1px dashed rgba(255,255,255,0.2)', p: 3, borderRadius: 2, textAlign: 'center' }}>
                            <Button
                                component="label"
                                startIcon={<CloudUpload />}
                                sx={{ color: '#38bdf8' }}
                            >
                                Selecionar PDF
                                <input type="file" hidden accept="application/pdf" onChange={handleFileChange} />
                            </Button>
                            {file && (
                                <Typography variant="body2" sx={{ mt: 1, color: '#fff' }}>
                                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                </Typography>
                            )}
                            <Typography variant="caption" display="block" sx={{ mt: 1, color: 'rgba(255,255,255,0.5)' }}>
                                Máximo 5MB per arquivo
                            </Typography>
                        </Box>

                        {error && <Alert severity="error">{error}</Alert>}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenDialog(false)} sx={{ color: 'rgba(255,255,255,0.7)' }}>Cancelar</Button>
                    <Button 
                        onClick={handleCreate} 
                        variant="contained" 
                        disabled={uploading}
                        sx={{ bgcolor: '#0ea5e9' }}
                    >
                        {uploading ? 'Enviando...' : 'Publicar'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default SecretarioPublicacoes;
