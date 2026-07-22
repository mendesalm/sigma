import React from 'react';
import { Box, Typography, Card, CardContent, useTheme, alpha } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import { formatDegree } from '@/shared/utils/formatters';

interface SymbolicHistoryWidgetProps {
  degree?: number | null;
  isInstalled?: boolean | null;
  initiationDate?: string | null;
  elevationDate?: string | null;
  exaltationDate?: string | null;
  installationDate?: string | null;
}

export const SymbolicHistoryWidget: React.FC<SymbolicHistoryWidgetProps> = ({
  degree, isInstalled, initiationDate, elevationDate, exaltationDate, installationDate
}) => {
  const theme = useTheme();
  const degreeText = formatDegree(degree, isInstalled);

  // Ordenamos da mais recente (teoricamente) para a mais antiga.
  const dates = [
    { label: 'Instalação', date: installationDate, color: theme.palette.info.main },
    { label: 'Exaltação', date: exaltationDate, color: theme.palette.text.primary },
    { label: 'Elevação', date: elevationDate, color: '#facc15' }, // gold
    { label: 'Iniciação', date: initiationDate, color: '#fcd34d' }, // gold light
  ].filter(d => d.date); // apenas as que possuem data

  return (
    <Card sx={{ height: '260px', bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.4) : 'background.paper', border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, borderRadius: 2 }}>
      <CardContent sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StarIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
              Histórico Simbólico
            </Typography>
          </Box>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 0.5, 
            px: 1, 
            py: 0.25, 
            bgcolor: alpha(theme.palette.secondary.main, 0.1), 
            border: `1px solid ${theme.palette.secondary.main}`,
            borderRadius: '12px'
          }}>
            <WorkspacePremiumIcon sx={{ color: theme.palette.secondary.main, fontSize: 14 }} />
            <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.secondary.main }}>
              {degreeText}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mt: 0, flexGrow: 1, overflowY: 'auto', pr: 0.5, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {dates.length === 0 ? (
            <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 2 }}>
              Nenhuma data simbólica registrada.
            </Typography>
          ) : (
            dates.map((item, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === dates.length - 1;
              const formattedDate = item.date ? item.date.split('-').reverse().join('/') : '';
              
              return (
                <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.25, borderBottom: isLast ? 'none' : `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: isFirst ? item.color : alpha(item.color, 0.5) }} />
                    <Typography variant="body2" sx={{ fontWeight: isFirst ? 700 : 600, color: isFirst ? 'text.primary' : 'text.secondary', textTransform: 'uppercase' }}>
                      {item.label}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.primary" sx={{ fontWeight: 700 }}>
                    {formattedDate}
                  </Typography>
                </Box>
              )
            })
          )}
        </Box>
      </CardContent>
    </Card>
  );
};
