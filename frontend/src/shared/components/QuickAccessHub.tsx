import React from 'react';
import { Box, Typography, Grid, Card, CardContent, Button, useTheme, Avatar } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';

export interface HubButton {
  label: string;
  primary?: boolean;
  onClick: () => void;
  fullWidth?: boolean;
}

export interface HubCardConfig {
  id: string;
  title: string;
  mainValue?: React.ReactNode;
  subValue?: React.ReactNode;
  icon?: React.ReactNode;
  buttons?: HubButton[];
  colSpan?: 3 | 4 | 6 | 12; // mapping to md: 3=25%, 4=33%, 6=50%, 12=100%
  chart?: React.ReactNode; // Optional place for a chart component
  onClick?: () => void;
}

interface QuickAccessHubProps {
  title?: string;
  cards: HubCardConfig[];
  bottomNav?: { label: string; icon?: React.ReactNode; onClick: () => void }[];
  showBackButton?: boolean;
  onBack?: () => void;
}

const QuickAccessHub: React.FC<QuickAccessHubProps> = ({ title, cards, bottomNav, showBackButton, onBack }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, width: '100%', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Title Area */}
      {(title || showBackButton) && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          {showBackButton && (
            <Button 
              startIcon={<ArrowBackIcon />} 
              onClick={handleBack}
              sx={{ 
                mr: 2, 
                color: 'rgba(255,255,255,0.7)',
                '&:hover': { color: '#fff', backgroundColor: 'rgba(255,255,255,0.1)' }
              }}
            >
              Voltar
            </Button>
          )}
          {title && (
            <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.text.primary, fontFamily: '"Inter", sans-serif', m: 0 }}>
              {title}
            </Typography>
          )}
        </Box>
      )}

      {/* Grid of Cards */}
      <Grid container spacing={2}>
        {cards.map((card) => (
          <Grid size={{ xs: 12, sm: card.colSpan === 3 ? 6 : 12, md: card.colSpan || 6 }} key={card.id}>
            <Card
              onClick={card.onClick}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                p: 1,
                cursor: card.onClick ? 'pointer' : 'default',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': card.onClick ? {
                  transform: 'translateY(-3px)',
                  boxShadow: `0 12px 40px rgba(0,0,0,0.5)`,
                  borderColor: 'rgba(212, 175, 55, 0.4)'
                } : {}
              }}
            >
              <CardContent sx={{ pb: '16px !important', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: theme.palette.text.primary, fontFamily: '"Inter", sans-serif' }}>
                    {card.title}
                  </Typography>
                  {card.icon && (
                    <Avatar sx={{ bgcolor: 'transparent', color: theme.palette.primary.main, width: 44, height: 44, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                      {card.icon}
                    </Avatar>
                  )}
                </Box>
                
                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  {card.mainValue && (
                    <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.secondary.main, mb: 0.5, fontFamily: '"Inter", sans-serif' }}>
                      {card.mainValue}
                    </Typography>
                  )}
                  {card.subValue && (
                    <Box sx={{ color: theme.palette.text.secondary, fontFamily: '"Inter", sans-serif' }}>
                      {card.subValue}
                    </Box>
                  )}
                  {card.chart && (
                    <Box sx={{ mt: 1, width: '100%', height: 60 }}>
                      {card.chart}
                    </Box>
                  )}
                </Box>

                {card.buttons && card.buttons.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 1.5, mt: 3, flexWrap: 'nowrap' }}>
                    {card.buttons.map((btn, idx) => (
                      <Button
                        key={idx}
                        variant={btn.primary ? 'contained' : 'outlined'}
                        color={btn.primary ? 'primary' : 'secondary'}
                        onClick={(e) => {
                          e.stopPropagation();
                          btn.onClick();
                        }}
                        fullWidth={btn.fullWidth !== false}
                        sx={{ 
                          flex: 1,
                          whiteSpace: 'nowrap',
                          px: 1,
                          fontSize: '0.85rem'
                        }}
                      >
                        {btn.label}
                      </Button>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Bottom Navigation */}
      {bottomNav && (
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
          {bottomNav.map((nav, idx) => (
            <Button
              key={idx}
              variant="outlined"
              color="secondary"
              onClick={nav.onClick}
              startIcon={nav.icon}
              sx={{ 
                bgcolor: theme.palette.background.paper, 
                color: theme.palette.text.primary, 
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                px: 3,
                py: 1
              }}
            >
              {nav.label}
            </Button>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default QuickAccessHub;
