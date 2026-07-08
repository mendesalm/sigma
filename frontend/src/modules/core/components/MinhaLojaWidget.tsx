import React from 'react';
import { Card, CardContent, Typography, Box, Grid, Button } from '@mui/material';
import { AccountBalance } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface LodgeInfo {
    id: number;
    name: string;
    number: string;
    rite: string;
    session_day: string;
    session_time: string;
    potencia: string;
    subpotencia: string;
    foundation_date: string;
    address: string;
    email: string;
    cnpj: string;
}

interface MinhaLojaWidgetProps {
    lodgeInfo: LodgeInfo | undefined;
    canManageLodge?: boolean;
}

const COLORS = {
    cardBg: '#242830',
    gold: '#C49A45',
    goldGradient: 'linear-gradient(180deg, #DDB96B 0%, #B8862D 100%)',
    textPrimary: '#FFFFFF',
    textSecondary: '#A0AAB4',
    borderColor: 'rgba(255,255,255,0.08)'
};

const MinhaLojaWidget: React.FC<MinhaLojaWidgetProps> = ({ lodgeInfo, canManageLodge }) => {
    const navigate = useNavigate();
    if (!lodgeInfo) return null;

    return (
        <Card
            sx={{
                bgcolor: COLORS.cardBg,
                color: '#fff',
                borderRadius: '8px',
                border: `1px solid ${COLORS.borderColor}`,
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                width: '100%',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '220px'
            }}
        >
            <CardContent sx={{ p: 2.5, pb: 1, flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography sx={{ fontFamily: '"Inter", sans-serif', color: COLORS.gold, fontSize: '1.2rem', fontWeight: 500 }}>
                        Minha Loja
                    </Typography>
                    
                    <Box sx={{ 
                        width: 48, 
                        height: 48, 
                        border: `1px solid rgba(196, 154, 69, 0.3)`, 
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <AccountBalance sx={{ color: COLORS.gold, fontSize: 28 }} />
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Box sx={{ display: 'flex' }}>
                        <Typography sx={{ color: COLORS.textPrimary, fontSize: '0.85rem', width: '60px' }}>Nome:</Typography>
                        <Typography sx={{ color: COLORS.textPrimary, fontSize: '0.85rem', fontWeight: 600 }}>{lodgeInfo.name}, nº {lodgeInfo.number}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex' }}>
                        <Typography sx={{ color: COLORS.textPrimary, fontSize: '0.85rem', width: '60px' }}>Rito:</Typography>
                        <Typography sx={{ color: COLORS.textPrimary, fontSize: '0.85rem' }}>{lodgeInfo.rite}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex' }}>
                        <Typography sx={{ color: COLORS.textPrimary, fontSize: '0.85rem', width: '60px' }}>Sessão:</Typography>
                        <Typography sx={{ color: COLORS.textPrimary, fontSize: '0.85rem' }}>{lodgeInfo.session_day}, {lodgeInfo.session_time}</Typography>
                    </Box>
                </Box>
            </CardContent>

            {/* Buttons area */}
            <Box sx={{ display: 'flex', gap: 1.5, p: 2.5, pt: 1 }}>
                <Button 
                    variant="outlined" 
                    onClick={() => {}}
                    sx={{ 
                        flex: 1, 
                        color: COLORS.textPrimary, 
                        borderColor: 'rgba(255,255,255,0.2)',
                        textTransform: 'none',
                        fontFamily: '"Inter", sans-serif',
                        '&:hover': { borderColor: COLORS.gold, bgcolor: 'rgba(196,154,69,0.05)' }
                    }}
                >
                    Ver Detalhes
                </Button>
                {canManageLodge && (
                    <Button 
                        variant="contained" 
                        onClick={() => navigate(`/dashboard/management/lodges/${lodgeInfo.id}`)}
                        sx={{ 
                            flex: 1, 
                            background: COLORS.goldGradient,
                            color: '#1A1D23',
                            fontWeight: 600,
                            textTransform: 'none',
                            fontFamily: '"Inter", sans-serif',
                            boxShadow: 'none',
                            '&:hover': {
                                background: COLORS.goldGradient,
                                opacity: 0.9,
                                boxShadow: '0 2px 10px rgba(196,154,69,0.3)'
                            }
                        }}
                    >
                        Editar
                    </Button>
                )}
            </Box>
        </Card>
    );
};

export default MinhaLojaWidget;
