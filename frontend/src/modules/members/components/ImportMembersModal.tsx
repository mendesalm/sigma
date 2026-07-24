import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Typography, Box, CircularProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import api from '../../../shared/services/api';

interface ImportMemberRow {
  cim?: string;
  name?: string;
  email?: string;
  cpf?: string;
  rg?: string;
  degree?: string;
  marital_status?: string;
  father_name?: string;
  mother_name?: string;
  blood_type?: string;
  mother_lodge?: string;
  collecting_lodge?: string;
  initiation_certificate?: string;
  birth_date?: string;
  place_of_birth?: string;
  education_level?: string;
  occupation?: string;
  phone?: string;
  zip_code?: string;
  street_address?: string;
  neighborhood?: string;
  city?: string;
  masonic_history?: any[];
  family_members?: any[];
  decorations?: any[];
  is_valid: boolean;
  errors: string[];
  warnings?: string[];
}

interface ImportPreviewResponse {
  rows: ImportMemberRow[];
  total_valid: number;
  total_errors: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ImportMembersModal: React.FC<Props> = ({ open, onClose, onSuccess }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<ImportPreviewResponse | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles(Array.from(event.target.files));
    }
  };

  const handlePreview = async () => {
    if (files.length === 0) return;
    setLoading(true);
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await api.post('/members/import/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPreviewData(response.data);
    } catch (error) {
      console.error("Preview error", error);
      alert('Erro ao pré-visualizar a importação. Verifique se os arquivos são válidos.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!previewData) return;
    setLoading(true);
    try {
      await api.post('/members/import/confirm', {
        rows: previewData.rows
      });
      alert('Membros importados com sucesso!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Confirm error", error);
      alert('Erro ao confirmar a importação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Importar Membros em Massa
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {!previewData ? (
          <Box display="flex" flexDirection="column" alignItems="center" gap={2} p={4}>
            <Typography variant="body1" align="center">
              Selecione arquivos PDF (Ficha de Obreiro) ou Planilhas (Excel/CSV) para extrair os dados.
            </Typography>
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
            >
              Selecionar Arquivos
              <input
                type="file"
                hidden
                multiple
                accept=".pdf,.xlsx,.csv"
                onChange={handleFileChange}
              />
            </Button>
            {files.length > 0 && (
              <Box mt={2}>
                <Typography variant="subtitle2">Arquivos selecionados:</Typography>
                <ul>
                  {files.map((f, i) => (
                    <li key={i}>{f.name}</li>
                  ))}
                </ul>
              </Box>
            )}
          </Box>
        ) : (
          <Box>
            <Box display="flex" justifyContent="space-between" mb={2}>
              <Typography variant="subtitle1">
                Total Válidos: <b>{previewData.total_valid}</b>
              </Typography>
              <Typography variant="subtitle1" color="error">
                Com Erros: <b>{previewData.total_errors}</b>
              </Typography>
            </Box>
            <TableContainer component={Paper} style={{ maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>CIM</TableCell>
                    <TableCell>Nome</TableCell>
                    <TableCell>E-mail</TableCell>
                    <TableCell>Grau</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previewData.rows.map((row, index) => (
                    <TableRow key={index} sx={{ backgroundColor: row.is_valid ? 'inherit' : '#ffebee' }}>
                      <TableCell>{row.cim || '-'}</TableCell>
                      <TableCell>{row.name || '-'}</TableCell>
                      <TableCell>{row.email || '-'}</TableCell>
                      <TableCell>{row.degree || '-'}</TableCell>
                      <TableCell>
                        {row.is_valid ? (
                          <Typography variant="body2" color="success.main">OK</Typography>
                        ) : (
                          <Typography variant="body2" color="error">{row.errors.join(', ')}</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancelar</Button>
        {!previewData ? (
          <Button
            onClick={handlePreview}
            variant="contained"
            color="primary"
            disabled={files.length === 0 || loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Pré-visualizar Importação'}
          </Button>
        ) : (
          <Button
            onClick={handleConfirm}
            variant="contained"
            color="primary"
            disabled={loading || previewData.total_valid === 0}
          >
             {loading ? <CircularProgress size={24} /> : 'Confirmar Importação'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ImportMembersModal;
