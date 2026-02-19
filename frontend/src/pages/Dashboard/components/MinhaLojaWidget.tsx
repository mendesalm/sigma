import React from 'react';
import { Card, CardContent, Typography, Box, Grid, Divider } from '@mui/material';
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
  cardCheck: '#151B26', // slightly lighter card bg matching dashboard
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
                bgcolor: COLORS.cardCheck, 
                color: '#fff', 
                borderRadius: 2, 
                border: '1px solid rgba(255,255,255,0.05)', 
                width: '100%',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: canManageLodge ? 'pointer' : 'default',
                '&:hover': canManageLodge ? {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 8px 30px rgba(0,0,0,0.5)`,
                    borderColor: COLORS.gold
                } : {}
            }}
        >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontFamily: '"Playfair Display", serif', color: COLORS.gold, lineHeight: 1 }}>
                        Minha Loja
                    </Typography>
                    <Storefront sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 20 }} />
                </Box>

                <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
                        {lodgeInfo.name}, nº {lodgeInfo.number}
                    </Typography>
                    <Typography variant="caption" sx={{ color: COLORS.textSecondary, display: 'block', mt: 0.5 }}>
                        {lodgeInfo.rite}
                    </Typography>
                </Box>

                <Divider sx={{ my: 1.5, borderColor: 'rgba(255,255,255,0.05)' }} />

                <Grid container spacing={1}>
                    <Grid item xs={12}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                            <Event sx={{ color: COLORS.gold, fontSize: 16, mt: 0.3, mr: 1 }} />
                            <Box>
                                <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>
                                    Sessões às {lodgeInfo.session_day}, {lodgeInfo.session_time}
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>

                    <Grid item xs={12}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                            <Business sx={{ color: COLORS.gold, fontSize: 16, mt: 0.3, mr: 1 }} />
                            <Box>
                                <Typography variant="caption" sx={{ color: COLORS.textSecondary, display: 'block' }}>
                                    Federada ao {lodgeInfo.potencia}
                                </Typography>
                                <Typography variant="caption" sx={{ color: COLORS.textSecondary, display: 'block' }}>
                                    Jurisdicionada ao {lodgeInfo.subpotencia}
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>
                    
                    <Grid item xs={12}>
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary, display: 'block' }}>
                            <strong>Fundação:</strong> {lodgeInfo.foundation_date}
                        </Typography>
                         <Typography variant="caption" sx={{ color: COLORS.textSecondary, display: 'block', mt: 0.5 }}>
                            <strong>Endereço:</strong> {lodgeInfo.address}
                        </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sx={{ mt: 1 }}>
                         <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <ContactMail sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, mr: 1 }} />
                             <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', mr: 2 }}>
                                {lodgeInfo.email}
                            </Typography>
                         </Box>
                         <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', ml: 2.8 }}>
                            CNPJ: {lodgeInfo.cnpj}
                        </Typography>
                    </Grid>

                </Grid>
            </CardContent>
        </Card>
    );
};

export default MinhaLojaWidget;
