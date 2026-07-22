import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, useTheme, alpha, Tabs, Tab } from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';

interface PhilosophicalHistoryWidgetProps {
  philosophicalDegree?: string | null;
}

export const PhilosophicalHistoryWidget: React.FC<PhilosophicalHistoryWidgetProps> = ({ philosophicalDegree }) => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Mock data for rites to prepare for future backend updates
  const rites = [
    { label: 'REAA', data: philosophicalDegree ? [{ degree: philosophicalDegree, date: 'Atual' }] : [] },
    { label: 'York', data: [] },
    { label: 'Brasileiro', data: [] }
  ];

  return (
    <Card sx={{ height: '260px', bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.4) : 'background.paper', border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, borderRadius: 2 }}>
      <CardContent sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <MenuBookIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Histórico Filosófico
          </Typography>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}>
          <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth" sx={{ minHeight: '32px', '& .MuiTab-root': { minHeight: '32px', py: 0, px: 1 } }}>
            {rites.map((rite, index) => (
              <Tab key={index} label={rite.label} sx={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'none' }} />
            ))}
          </Tabs>
        </Box>

        <Box sx={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', pr: 0.5 }}>
          {rites[tabValue].data.length === 0 ? (
            <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 4, fontSize: '0.9rem' }}>
              Nenhum histórico registrado neste Rito.
            </Typography>
          ) : (
            rites[tabValue].data.map((item, idx) => (
              <Box key={idx} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.25, borderBottom: idx === rites[tabValue].data.length - 1 ? 'none' : `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: theme.palette.primary.main }} />
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    {item.degree}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {item.date}
                </Typography>
              </Box>
            ))
          )}
        </Box>
      </CardContent>
    </Card>
  );
};
