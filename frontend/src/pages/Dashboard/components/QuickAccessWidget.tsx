import React from 'react';
import { Card, CardContent, Typography, Box, Grid, Button } from '@mui/material';
import {
    Restaurant,
    Storefront,
    AccountBalanceWallet,
    EventAvailable,
    Description,
    CardTravel, // for Visitações
    HowToReg,   // for Presenças
    Assignment, // for Solicitações
    LocalLibrary // for Biblioteca
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface QuickAccessWidgetProps {
    onOpenClassifieds: () => void;
    onOpenDiningScale?: () => void;
}

const COLORS = {
    glassBg: 'rgba(21, 27, 38, 0.4)',
    glassBorderUrl: 'rgba(255, 255, 255, 0.08)',
    glassBorderTop: 'rgba(255, 255, 255, 0.12)',
    gold: '#D4AF37',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    iconBg: 'rgba(212, 175, 55, 0.1)',
};

const QuickAccessWidget: React.FC<QuickAccessWidgetProps> = ({ onOpenClassifieds, onOpenDiningScale }) => {
    const navigate = useNavigate();

    // Define the actions array
    const actions = [
        {
            icon: <EventAvailable fontSize="small" />,
            label: 'Check-in Sessão',
            color: '#22c55e', // Greenish for presence
            onClick: () => {
                // For now, this could open a modal saying "Use o APP" or we can implement the manual trigger
                alert("Funcionalidade estará disponível em breve no App Mobile Sigma para QRCode/Geolocalização.");
            }
        },
        {
            icon: <Restaurant fontSize="small" />,
            label: 'Escala do Ágape',
            color: '#f59e0b', // Orange for food
            onClick: onOpenDiningScale || (() => console.log("Agape Modal Required"))
        },
        {
            icon: <Description fontSize="small" />,
            label: 'Pranchas/Docs',
            color: '#0ea5e9', // Blue for docs
            onClick: () => navigate('/dashboard/lodge-dashboard/obreiro/minhas-publicacoes')
        },
        {
            icon: <AccountBalanceWallet fontSize="small" />,
            label: 'Financeiro',
            color: '#8b5cf6', // Purple for finance
            onClick: () => navigate('/dashboard/lodge-dashboard/obreiro/financeiro') // Example route
        },
        {
            icon: <Storefront fontSize="small" />,
            label: 'Classificados',
            color: COLORS.gold, // Gold
            onClick: onOpenClassifieds
        },
        {
            icon: <HowToReg fontSize="small" />,
            label: 'Minhas Presenças',
            color: '#14b8a6', // Teal
            onClick: () => navigate('/dashboard/lodge-dashboard/obreiro/minhas-presencas') // Assuming this route
        },
        {
            icon: <CardTravel fontSize="small" />,
            label: 'Minhas Visitações',
            color: '#f43f5e', // Rose
            onClick: () => navigate('/dashboard/lodge-dashboard/obreiro/minhas-visitacoes') // Assuming this route
        },
        {
            icon: <Assignment fontSize="small" />,
            label: 'Solicitações',
            color: '#64748b', // Slate for future use
            onClick: () => alert('Módulo de solicitações estará disponível em breve.')
        },
        {
            icon: <LocalLibrary fontSize="small" />,
            label: 'Biblioteca',
            color: '#eab308', // Yellow
            onClick: () => navigate('/dashboard/lodge-dashboard/obreiro/biblioteca') // Assuming this route
        }
    ];

    return (
        <Card
            sx={{
                bgcolor: COLORS.glassBg,
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                color: '#fff',
                borderRadius: '16px',
                border: `1px solid ${COLORS.glassBorderUrl}`,
                borderTop: `1px solid ${COLORS.glassBorderTop}`,
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
                width: '100%',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, pb: 0.5, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <Typography variant="h6" sx={{ fontFamily: '"Playfair Display", serif', color: COLORS.gold, fontWeight: 600, fontSize: '1rem', lineHeight: 1 }}>
                        Acesso Rápido
                    </Typography>
                </Box>

                <Grid container spacing={1.5}>
                    {actions.map((action, idx) => (
                        <Grid size={{ xs: 6, sm: 4, md: 6, lg: 4 }} key={idx}>
                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={action.onClick}
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 1,
                                    minHeight: '84px',
                                    borderColor: 'rgba(255,255,255,0.05)',
                                    color: 'rgba(255,255,255,0.85)',
                                    bgcolor: 'rgba(255,255,255,0.02)',
                                    textTransform: 'none',
                                    p: 1.5,
                                    borderRadius: '12px',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    '&:hover': {
                                        borderColor: 'transparent',
                                        bgcolor: `${action.color}15`, // append low opacity hex to color
                                        color: '#fff',
                                        transform: 'translateY(-2px)'
                                    },
                                    '& svg': {
                                        color: action.color,
                                        fontSize: 26,
                                        mb: 0.5,
                                        transition: 'transform 0.3s ease',
                                    },
                                    '&:hover svg': {
                                        transform: 'scale(1.1)'
                                    }
                                }}
                            >
                                {action.icon}
                                <Typography variant="caption" sx={{ fontFamily: '"Inter", sans-serif', fontSize: '0.75rem', fontWeight: 500, lineHeight: 1.2, textAlign: 'center' }}>
                                    {action.label}
                                </Typography>
                            </Button>
                        </Grid>
                    ))}
                </Grid>
            </CardContent>
        </Card>
    );
};

export default QuickAccessWidget;
