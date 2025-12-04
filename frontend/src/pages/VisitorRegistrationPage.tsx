import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Container, 
    Typography, 
    TextField, 
    Button, 
    Paper, 
    Autocomplete, 
    CircularProgress, 
    Alert,
    Stepper,
    Step,
    StepLabel,
    Stack
} from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import api from '../services/api';

interface ExternalLodge {
    id: number;
    name: string;
    number: string;
    obedience: string;
    city: string;
    state: string;
}

const VisitorRegistrationPage: React.FC = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form Data
    const [fullName, setFullName] = useState('');
    const [cim, setCim] = useState('');
    const [degree, setDegree] = useState('');
    
    // Lodge Selection
    const [selectedLodge, setSelectedLodge] = useState<ExternalLodge | null>(null);
    const [manualLodge, setManualLodge] = useState(false);
    const [manualLodgeName, setManualLodgeName] = useState('');
    const [manualLodgeNumber, setManualLodgeNumber] = useState('');
    const [manualLodgeObedience, setManualLodgeObedience] = useState('');
    
    // Search State
    const [lodgeOptions, setLodgeOptions] = useState<ExternalLodge[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);

    // Result
    const [visitorToken, setVisitorToken] = useState<string | null>(null);
    const [visitorId, setVisitorId] = useState<string | null>(null);
    
    // Check-in State
    const [locating, setLocating] = useState(false);
    const [nearestSession, setNearestSession] = useState<any>(null);
    const [checkInSuccess, setCheckInSuccess] = useState(false);
    const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null);

    const degreeOptions = ['Aprendiz', 'Companheiro', 'Mestre', 'Mestre Instalado'];

    useEffect(() => {
        if (manualLodge) return; // Don't search if manual mode is on

        const searchLodges = async () => {
            if (searchQuery.length < 2) {
                setLodgeOptions([]);
                return;
            }

            setSearching(true);
            try {
                const response = await api.get(`/external-lodges/search?query=${searchQuery}`);
                setLodgeOptions(response.data);
            } catch (err) {
                console.error("Failed to search lodges", err);
            } finally {
                setSearching(false);
            }
        };

        const timeoutId = setTimeout(searchLodges, 500);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, manualLodge]);

    const handleGenerateToken = async () => {
        // Validation
        if (!fullName || !cim || !degree) {
            setError("Por favor, preencha seus dados pessoais.");
            return;
        }

        if (manualLodge) {
            if (!manualLodgeName || !manualLodgeObedience) {
                setError("Por favor, preencha o Nome e a Potência da sua Loja.");
                return;
            }
        } else {
            if (!selectedLodge) {
                setError("Por favor, selecione sua Loja ou marque a opção 'Minha loja não está na lista'.");
                return;
            }
        }

        setLoading(true);
        setError(null);

        try {
            const payload = {
                full_name: fullName,
                cim: cim,
                degree: degree,
                origin_lodge_id: manualLodge ? null : selectedLodge?.id,
                manual_lodge_name: manualLodge ? manualLodgeName : null,
                manual_lodge_number: manualLodge ? manualLodgeNumber : null,
                manual_lodge_obedience: manualLodge ? manualLodgeObedience : null
            };

            const response = await api.post('/visitors/register', payload);

            const vId = response.data.id;
            setVisitorId(vId);
            
            // O Token agora contém o ID do visitante global
            const tokenData = {
                type: 'VISITOR_CHECKIN',
                id: vId,
                full_name: fullName, 
                degree: degree,
                lodge_name: manualLodge ? `${manualLodgeName} ${manualLodgeNumber}` : selectedLodge?.name
            };

            setVisitorToken(JSON.stringify(tokenData));
            setActiveStep(1);
            
            // Inicia busca por sessão próxima
            findNearestSession();
            
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.detail || "Erro ao registrar visitante. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };
    
    const findNearestSession = () => {
        setLocating(true);
        if (!navigator.geolocation) {
            setError("Geolocalização não suportada pelo navegador.");
            setLocating(false);
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setUserLocation({ lat: latitude, lon: longitude });
                
                try {
                    const response = await api.get(`/masonic-sessions/nearest-active?latitude=${latitude}&longitude=${longitude}`);
                    setNearestSession(response.data);
                } catch (err) {
                    console.log("Nenhuma sessão próxima encontrada.");
                } finally {
                    setLocating(false);
                }
            },
            (err) => {
                console.error(err);
                setError("Erro ao obter localização. Verifique as permissões.");
                setLocating(false);
            }
        );
    };
    
    const handleConfirmPresence = async () => {
        if (!nearestSession || !visitorId || !userLocation) return;
        
        setLoading(true);
        try {
            await api.post(`/masonic-sessions/${nearestSession.id}/visitor-check-in`, {
                visitor_id: visitorId,
                latitude: userLocation.lat,
                longitude: userLocation.lon
            });
            setCheckInSuccess(true);
        } catch (err: any) {
            setError(err.response?.data?.detail || "Erro ao confirmar presença.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 4 }}>
                <Typography variant="h4" gutterBottom align="center" color="primary">
                    Visitante
                </Typography>
                
                <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                    <Step>
                        <StepLabel>Seus Dados</StepLabel>
                    </Step>
                    <Step>
                        <StepLabel>Confirmação</StepLabel>
                    </Step>
                </Stepper>

                {activeStep === 0 && (
                    <Stack spacing={3}>
                        <Typography variant="body1" color="text.secondary">
                            Bem-vindo, Irmão! Preencha seus dados para registrar sua presença.
                        </Typography>

                        <TextField
                            label="Nome Completo"
                            fullWidth
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                        />

                        <TextField
                            label="CIM"
                            fullWidth
                            required
                            value={cim}
                            onChange={(e) => setCim(e.target.value)}
                            helperText="Seu Cadastro Internacional Maçônico"
                        />

                        <Autocomplete
                            options={degreeOptions}
                            value={degree}
                            onChange={(_, newValue) => setDegree(newValue || '')}
                            renderInput={(params) => <TextField {...params} label="Grau" required />}
                        />

                        <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>Sua Loja de Origem</Typography>
                            
                            <Box sx={{ mb: 2 }}>
                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={manualLodge} 
                                        onChange={(e) => setManualLodge(e.target.checked)}
                                        style={{ marginRight: 8 }}
                                    />
                                    Minha loja não está na lista / Sou de outro Oriente
                                </label>
                            </Box>

                            {!manualLodge ? (
                                <Autocomplete
                                    options={lodgeOptions}
                                    getOptionLabel={(option) => `${option.name} N. ${option.number} (${option.obedience})`}
                                    loading={searching}
                                    onInputChange={(_, newInputValue) => setSearchQuery(newInputValue)}
                                    onChange={(_, newValue) => setSelectedLodge(newValue)}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Buscar Loja (Nome ou Número)"
                                            required
                                            InputProps={{
                                                ...params.InputProps,
                                                endAdornment: (
                                                    <React.Fragment>
                                                        {searching ? <CircularProgress color="inherit" size={20} /> : null}
                                                        {params.InputProps.endAdornment}
                                                    </React.Fragment>
                                                ),
                                            }}
                                        />
                                    )}
                                    renderOption={(props, option) => (
                                        <li {...props}>
                                            <Box>
                                                <Typography variant="body1">{option.name} N. {option.number}</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {option.obedience} - {option.city}/{option.state}
                                                </Typography>
                                            </Box>
                                        </li>
                                    )}
                                />
                            ) : (
                                <Stack spacing={2}>
                                    <TextField
                                        label="Nome da Loja"
                                        fullWidth
                                        required
                                        value={manualLodgeName}
                                        onChange={(e) => setManualLodgeName(e.target.value)}
                                    />
                                    <TextField
                                        label="Número"
                                        fullWidth
                                        value={manualLodgeNumber}
                                        onChange={(e) => setManualLodgeNumber(e.target.value)}
                                    />
                                    <TextField
                                        label="Potência (Obediência)"
                                        fullWidth
                                        required
                                        value={manualLodgeObedience}
                                        onChange={(e) => setManualLodgeObedience(e.target.value)}
                                        placeholder="Ex: GOB, GL, COMAB"
                                    />
                                </Stack>
                            )}
                        </Box>

                        {error && <Alert severity="error">{error}</Alert>}

                        <Button 
                            variant="contained" 
                            size="large" 
                            onClick={handleGenerateToken}
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Continuar'}
                        </Button>
                    </Stack>
                )}

                {activeStep === 1 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                        
                        {checkInSuccess ? (
                            <Alert severity="success" sx={{ width: '100%' }}>
                                <Typography variant="h6">Presença Confirmada!</Typography>
                                <Typography variant="body2">
                                    Seu registro foi realizado com sucesso na sessão da Loja {nearestSession?.lodge?.name}.
                                    Bom trabalho, Irmão!
                                </Typography>
                            </Alert>
                        ) : (
                            <>
                                <Typography variant="h6" align="center">
                                    Confirmar Presença
                                </Typography>
                                
                                {locating ? (
                                    <Box sx={{ textAlign: 'center' }}>
                                        <CircularProgress />
                                        <Typography sx={{ mt: 2 }}>Localizando sessão próxima...</Typography>
                                    </Box>
                                ) : nearestSession ? (
                                    <Box sx={{ p: 3, border: '1px solid #ddd', borderRadius: 2, width: '100%', textAlign: 'center', bgcolor: '#f5f5f5' }}>
                                        <Typography variant="subtitle1" color="primary" fontWeight="bold">
                                            Sessão Encontrada
                                        </Typography>
                                        <Typography variant="h5" sx={{ my: 1 }}>
                                            {nearestSession.lodge?.name} N. {nearestSession.lodge?.number}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Data: {new Date(nearestSession.session_date).toLocaleDateString()}
                                        </Typography>
                                        
                                        <Button 
                                            variant="contained" 
                                            color="success" 
                                            size="large" 
                                            sx={{ mt: 3 }}
                                            onClick={handleConfirmPresence}
                                            disabled={loading}
                                        >
                                            {loading ? <CircularProgress size={24} color="inherit" /> : 'CONFIRMAR PRESENÇA AQUI'}
                                        </Button>
                                    </Box>
                                ) : (
                                    <Alert severity="warning">
                                        Nenhuma sessão ativa encontrada nas proximidades. 
                                        Certifique-se de estar na Loja e que a sessão já foi iniciada.
                                        <Button onClick={findNearestSession} sx={{ mt: 1, display: 'block' }}>Tentar Novamente</Button>
                                    </Alert>
                                )}

                                <Box sx={{ mt: 4, pt: 4, borderTop: '1px solid #eee', width: '100%', textAlign: 'center' }}>
                                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                                        Caso não consiga confirmar automaticamente, apresente este código ao Chanceler:
                                    </Typography>
                                    <Box sx={{ p: 2, display: 'inline-block', border: '1px solid #eee', borderRadius: 2 }}>
                                        <QRCodeSVG value={visitorToken || ''} size={150} />
                                    </Box>
                                </Box>
                            </>
                        )}

                        {!checkInSuccess && (
                            <Button variant="outlined" onClick={() => setActiveStep(0)}>
                                Voltar / Corrigir Dados
                            </Button>
                        )}
                        
                        {checkInSuccess && (
                             <Button variant="outlined" onClick={() => window.location.reload()}>
                                Novo Registro
                            </Button>
                        )}
                    </Box>
                )}
            </Paper>
        </Container>
    );
};

export default VisitorRegistrationPage;
