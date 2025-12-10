import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Container, Paper, Typography, CircularProgress, Alert } from '@mui/material';
import { VerifiedUser, ErrorOutline } from '@mui/icons-material';
import api from '../../services/api';

const DocumentValidation: React.FC = () => {
  const { hash } = useParams<{ hash: string }>();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const validate = async () => {
      try {
        const response = await api.get(`/documents/validate/${hash}`);
        setResult(response.data);
      } catch (err: any) {
        setError("Documento não encontrado ou assinatura inválida.");
      } finally {
        setLoading(false);
      }
    };

    if (hash) {
      validate();
    }
  }, [hash]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: { xs: 12, md: 14 } }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        {error ? (
          <Box>
            <ErrorOutline color="error" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h5" color="error" gutterBottom>
              Validação Falhou
            </Typography>
            <Alert severity="error">{error}</Alert>
          </Box>
        ) : (
          <Box>
            <VerifiedUser color="success" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h5" color="success.main" gutterBottom>
              Documento Autêntico
            </Typography>
            <Typography variant="body1" sx={{ mt: 2 }}>
              <strong>Documento:</strong> {result.document_title}
            </Typography>
            <Typography variant="body1">
              <strong>Loja:</strong> {result.lodge_name}
            </Typography>
            <Typography variant="body1">
              <strong>Assinado por:</strong> {result.signed_by}
            </Typography>
            <Typography variant="body1">
              <strong>Data:</strong> {new Date(result.signed_at).toLocaleString()}
            </Typography>
            <Typography variant="caption" display="block" sx={{ mt: 4, color: 'text.secondary' }}>
              Hash: {result.hash}
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default DocumentValidation;
