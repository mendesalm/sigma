import React, { useEffect, useState } from 'react';
import {
  Container, Typography, Box, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Checkbox, FormControlLabel,
  Snackbar, Alert
} from '@mui/material';
import ImportTemplateService, { ImportTemplate } from '../services/importTemplateService';

const ImportTemplates = () => {
  const [templates, setTemplates] = useState<ImportTemplate[]>([]);
  const [open, setOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<ImportTemplate | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const loadTemplates = async () => {
    try {
      const data = await ImportTemplateService.getTemplates();
      setTemplates(data);
    } catch (error) {
      setSnackbar({ open: true, message: 'Erro ao carregar templates', severity: 'error' });
    }
  };

  useEffect(() => {
    const load = async () => {
      await loadTemplates();
    };
    void load();
  }, []);

  const handleOpen = (template?: ImportTemplate) => {
    if (template) {
      setCurrentTemplate(template);
    } else {
      setCurrentTemplate({
        name: '',
        potency: '',
        file_type: 'PDF',
        cim_regex: '',
        name_regex: '',
        email_regex: '',
        degree_regex: '',
        is_active: true
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setCurrentTemplate(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentTemplate) return;
    const { name, value, checked, type } = e.target;
    setCurrentTemplate({
      ...currentTemplate,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSave = async () => {
    if (!currentTemplate) return;
    try {
      if (currentTemplate.id) {
        await ImportTemplateService.updateTemplate(currentTemplate.id, currentTemplate);
        setSnackbar({ open: true, message: 'Template atualizado com sucesso', severity: 'success' });
      } else {
        await ImportTemplateService.createTemplate(currentTemplate);
        setSnackbar({ open: true, message: 'Template criado com sucesso', severity: 'success' });
      }
      handleClose();
      loadTemplates();
    } catch (error) {
      setSnackbar({ open: true, message: 'Erro ao salvar template', severity: 'error' });
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir?')) {
      try {
        await ImportTemplateService.deleteTemplate(id);
        setSnackbar({ open: true, message: 'Template excluído com sucesso', severity: 'success' });
        loadTemplates();
      } catch (error) {
        setSnackbar({ open: true, message: 'Erro ao excluir template', severity: 'error' });
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" component="h1">
          Templates de Importação (Regex)
        </Typography>
        <Button variant="contained" color="primary" onClick={() => handleOpen()}>
          Novo Template
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Tipo de Arquivo</TableCell>
              <TableCell>Potência</TableCell>
              <TableCell>Ativo</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {templates.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.file_type}</TableCell>
                <TableCell>{row.potency}</TableCell>
                <TableCell>{row.is_active ? 'Sim' : 'Não'}</TableCell>
                <TableCell>
                  <Button size="small" color="primary" onClick={() => handleOpen(row)}>Editar</Button>
                  <Button size="small" color="error" onClick={() => row.id && handleDelete(row.id)}>Excluir</Button>
                </TableCell>
              </TableRow>
            ))}
            {templates.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">Nenhum template encontrado.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{currentTemplate?.id ? 'Editar Template' : 'Novo Template'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={2}>
            <TextField
              label="Nome do Template"
              name="name"
              value={currentTemplate?.name || ''}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Potência (Opcional)"
              name="potency"
              value={currentTemplate?.potency || ''}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Tipo de Arquivo"
              name="file_type"
              value={currentTemplate?.file_type || ''}
              onChange={handleChange}
              fullWidth
            />
            <Typography variant="subtitle2" mt={2}>Expressões Regulares (Python regex format)</Typography>
            <TextField
              label="Regex CIM (capturar em grupo 1)"
              name="cim_regex"
              value={currentTemplate?.cim_regex || ''}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Regex Nome"
              name="name_regex"
              value={currentTemplate?.name_regex || ''}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Regex E-mail"
              name="email_regex"
              value={currentTemplate?.email_regex || ''}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Regex Grau"
              name="degree_regex"
              value={currentTemplate?.degree_regex || ''}
              onChange={handleChange}
              fullWidth
            />
            <FormControlLabel
              control={<Checkbox checked={currentTemplate?.is_active || false} onChange={handleChange} name="is_active" />}
              label="Ativo"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained" color="primary">Salvar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ImportTemplates;
