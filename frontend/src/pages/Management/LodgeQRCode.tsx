import { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Typography, Paper, Box, Button, CircularProgress } from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

const LodgeQRCode = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext) as any;
  const [lodge, setLodge] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLodge = async () => {
      try {
        let lodgeId = id;
        if (!lodgeId && user?.lodge_id) {
          lodgeId = user.lodge_id;
        }

        if (lodgeId) {
          const response = await api.get(`/lodges/${lodgeId}`);
          setLodge(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch lodge', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLodge();
  }, [id, user]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!lodge) {
    return (
      <Container maxWidth="sm">
        <Typography variant="h6" color="error" align="center" sx={{ mt: 4 }}>
          Loja não encontrada.
        </Typography>
      </Container>
    );
  }

  // Data to be encoded in the QR Code
  const qrData = JSON.stringify({
    lodge_id: lodge.id,
    qr_code_id: lodge.qr_code_id,
    name: lodge.lodge_name
  });

  return (
    <Container maxWidth="sm">
      <Paper sx={{ p: 4, mt: 4, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom color="primary">
          QR Code de Presença
        </Typography>
        <Typography variant="h6" gutterBottom>
          {lodge.lodge_name} N. {lodge.lodge_number}
        </Typography>
        
        <Box sx={{ my: 4, p: 2, border: '1px solid #ccc', display: 'inline-block', borderRadius: 2 }}>
          <QRCodeSVG value={qrData} size={256} level="H" includeMargin={true} />
        </Box>

        <Typography variant="body1" color="text.secondary" paragraph>
          Imprima este QR Code e disponibilize-o na entrada da Loja para que os irmãos possam registrar presença via aplicativo.
        </Typography>

        <Button variant="contained" color="primary" size="large" onClick={handlePrint} sx={{ mt: 2, '@media print': { display: 'none' } }}>
          Imprimir QR Code
        </Button>
      </Paper>
    </Container>
  );
};

export default LodgeQRCode;
