import React, { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Box, Button, Typography, CircularProgress, Alert } from '@mui/material';
import { useSnackbar } from 'notistack';
import api from '../services/api';

interface SessionCheckInProps {
    sessionId: number;
    onSuccess: () => void;
}

const SessionCheckIn: React.FC<SessionCheckInProps> = ({ sessionId, onSuccess }) => {
    const [scanning, setScanning] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { enqueueSnackbar } = useSnackbar();

    const handleScan = async (detectedCodes: any[]) => {
        if (loading || detectedCodes.length === 0) return;
        
        const code = detectedCodes[0].rawValue;
        setLoading(true);
        setScanning(false); // Stop scanning while processing
        setError(null);

        if (!navigator.geolocation) {
             setError('Geolocalização não suportada pelo seu navegador.');
             setLoading(false);
             return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    
                    await api.post(`/masonic-sessions/${sessionId}/check-in`, {
                        qr_code_token: code,
                        latitude,
                        longitude
                    });

                    enqueueSnackbar('Check-in realizado com sucesso!', { variant: 'success' });
                    onSuccess();
                } catch (err: any) {
                    console.error(err);
                    setError(err.response?.data?.detail || 'Erro ao realizar check-in.');
                    // Optional: Allow retry
                } finally {
                    setLoading(false);
                }
            },
            (geoError) => {
                console.error(geoError);
                let msg = 'Erro ao obter localização.';
                if (geoError.code === 1) msg = 'Permissão de localização negada.';
                else if (geoError.code === 2) msg = 'Localização indisponível.';
                else if (geoError.code === 3) msg = 'Tempo limite para obter localização.';
                
                setError(msg);
                setLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const startScanning = () => {
        setError(null);
        setScanning(true);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, p: 2, border: '1px solid #ccc', borderRadius: 2, mt: 2 }}>
            <Typography variant="h6">Presença Digital</Typography>
            
            {!scanning && !loading && (
                <Button variant="contained" color="primary" onClick={startScanning} fullWidth>
                    Realizar Check-in (QR Code)
                </Button>
            )}

            {scanning && (
                <Box sx={{ width: '100%', maxWidth: 400 }}>
                    <Typography variant="body2" gutterBottom align="center">
                        Aponte a câmera para o QR Code da Loja
                    </Typography>
                    <Box sx={{ height: 300, position: 'relative' }}>
                         <Scanner 
                            onScan={handleScan} 
                            onError={(error) => console.log(error?.message)}
                            components={{ audio: false, finder: true }}
                            styles={{ container: { height: 300 } }}
                        />
                    </Box>
                    <Button variant="outlined" color="secondary" onClick={() => setScanning(false)} sx={{ mt: 2 }} fullWidth>
                        Cancelar
                    </Button>
                </Box>
            )}

            {loading && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <CircularProgress />
                    <Typography variant="caption" sx={{ mt: 1 }}>Validando localização...</Typography>
                </Box>
            )}

            {error && (
                <Alert severity="error" onClose={() => setError(null)} sx={{ width: '100%' }}>
                    {error}
                </Alert>
            )}
        </Box>
    );
};

export default SessionCheckIn;
