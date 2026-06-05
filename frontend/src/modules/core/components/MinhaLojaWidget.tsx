import React from 'react';
import { Card, CardContent, Typography, Box, Grid } from '@mui/material';
import { Storefront, Event, Business, ContactMail } from '@mui/icons-material';

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

import { useNavigate } from 'react-router-dom';

interface MinhaLojaWidgetProps {
    lodgeInfo: LodgeInfo | undefined;
    canManageLodge?: boolean;
}

const COLORS = {
    cardCheck: '#151B26', // Keep for fallback
    glassBg: 'rgba(21, 27, 38, 0.4)',
    glassBorderUrl: 'rgba(255, 255, 255, 0.08)',
    glassBorderTop: 'rgba(255, 255, 255, 0.12)',
    gold: '#D4AF37', // Metallic Gold
    textSecondary: 'rgba(255, 255, 255, 0.7)',
};


const MinhaLojaWidget: React.FC<MinhaLojaWidgetProps> = ({ lodgeInfo, canManageLodge }) => {
    const navigate = useNavigate();
    if (!lodgeInfo) return null;

    const handleClick = () => {
        if (canManageLodge && lodgeInfo.id) {
            navigate(`/management/lodges/${lodgeInfo.id}`);
        }
    };

    return (
        <Card
            onClick={handleClick}
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
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: canManageLodge ? 'pointer' : 'default',
                '&:hover': canManageLodge ? {
                    transform: 'translateY(-3px)',
                    boxShadow: `0 12px 40px rgba(0,0,0,0.5)`,
                    borderColor: 'rgba(212, 175, 55, 0.4)'
                } : {}
            }}
        >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, pb: 0.5, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <Typography variant="h6" sx={{ fontFamily: '"Playfair Display", serif', color: COLORS.gold, fontWeight: 600, fontSize: '1rem', lineHeight: 1 }}>
                        Minha Loja
                    </Typography>
                    <Storefront sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 18 }} />
                </Box>

                <Box sx={{ mb: 1.5 }}>
                    <Typography variant="h6" sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 500, color: '#fff', fontSize: '1rem', lineHeight: 1.2, mb: 0.2 }}>
                        {lodgeInfo.name}, nº {lodgeInfo.number}
                    </Typography>
                    <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontFamily: '"Inter", sans-serif', display: 'block', fontSize: '0.875rem', fontStyle: 'italic' }}>
                        {lodgeInfo.rite}
                    </Typography>
                </Box>

                <Grid container spacing={0.5}>
                    <Grid size={12}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <Event sx={{ color: COLORS.gold, fontSize: 16, mr: 1 }} />
                            <Typography variant="body2" sx={{ color: '#fff', fontWeight: 400, fontSize: '0.875rem' }}>
                                Sessões às <span style={{ fontStyle: 'italic' }}>{lodgeInfo.session_day}, {lodgeInfo.session_time}</span>
                            </Typography>
                        </Box>
                    </Grid>

                    <Grid size={12}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 0.5 }}>
                            <Business sx={{ color: COLORS.gold, fontSize: 16, mt: 0.2, mr: 1 }} />
                            <Box sx={{ lineHeight: 1.3 }}>
                                {lodgeInfo.subpotencia ? (
                                    <>
                                        <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontFamily: '"Inter", sans-serif', display: 'block', fontSize: '0.75rem' }}>
                                            Federada ao {lodgeInfo.potencia}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontFamily: '"Inter", sans-serif', display: 'block', fontSize: '0.75rem' }}>
                                            Jurisdicionada ao {lodgeInfo.subpotencia}
                                        </Typography>
                                    </>
                                ) : (
                                    <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontFamily: '"Inter", sans-serif', display: 'block', fontSize: '0.75rem' }}>
                                        Confederada à {lodgeInfo.potencia}
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    </Grid>

                    <Grid size={12}>
                        <Box sx={{ ml: 3.5, mb: 0.5 }}>
                            <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontFamily: '"Inter", sans-serif', display: 'block', fontSize: '0.75rem', lineHeight: 1.4 }}>
                                <span style={{ fontStyle: 'italic' }}>Fundação:</span> {lodgeInfo.foundation_date}
                            </Typography>
                            <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontFamily: '"Inter", sans-serif', display: 'block', fontSize: '0.75rem', lineHeight: 1.4 }}>
                                <span style={{ fontStyle: 'italic' }}>Endereço:</span> {lodgeInfo.address}
                            </Typography>
                        </Box>
                    </Grid>

                    <Grid size={12}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <ContactMail sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, mr: 1 }} />
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontFamily: '"Inter", sans-serif', mr: 2, fontSize: '0.75rem', fontStyle: 'italic' }}>
                                {lodgeInfo.email}
                            </Typography>
                        </Box>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontFamily: '"Inter", sans-serif', display: 'block', ml: 3, mt: 0.5, fontSize: '0.75rem' }}>
                            <span style={{ fontStyle: 'italic' }}>CNPJ:</span> {lodgeInfo.cnpj}
                        </Typography>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
};

export default MinhaLojaWidget;
