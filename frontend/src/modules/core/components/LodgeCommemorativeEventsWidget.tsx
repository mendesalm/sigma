import React from 'react';
import { Card, CardContent, Typography, Box, List, ListItem, ListItemText, Divider } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Cake as CakeIcon, Gavel as GavelIcon, Event as EventIcon, AllInclusive as WeddingIcon, Architecture as ArchitectureIcon } from '@mui/icons-material';
import { CalendarEvent } from '@/modules/core/services/dashboardService';
import { getGlassStyles, EVENT_COLORS, normalizeEventType, ACCENT_COLOR } from '@/modules/core/constants/LodgeDashboardConstants';

interface LodgeCommemorativeEventsWidgetProps {
  commemorativeEvents: CalendarEvent[];
  currentDate: Date;
}

const LodgeCommemorativeEventsWidget: React.FC<LodgeCommemorativeEventsWidgetProps> = ({ commemorativeEvents, currentDate }) => {
  const theme = useTheme();
  const glassStyles = getGlassStyles(theme.palette.mode);
  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long' });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  return (
    <Card sx={{
      ...glassStyles,
      color: theme.palette.text.primary,
      borderRadius: '16px',
      flexGrow: 1,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0
    }}>
      <CardContent sx={{ p: 0, display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0 }}>
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="h6" sx={{ fontFamily: '"Inter", sans-serif', color: ACCENT_COLOR, fontWeight: 600, fontSize: '1rem', lineHeight: 1.2 }}>
            Datas Comemorativas de {capitalizedMonth}
          </Typography>
        </Box>
        <List disablePadding sx={{ overflowY: 'auto', flexGrow: 1, p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {commemorativeEvents && commemorativeEvents.length > 0 ? (
            commemorativeEvents.map((event, idx) => {
              const dateParts = event.full_date.split('-'); // YYYY-MM-DD
              const formattedDate = `${dateParts[2]}/${dateParts[1]}`;
              const today = new Date();
              const isToday = parseInt(dateParts[1], 10) === (today.getMonth() + 1) && parseInt(dateParts[2], 10) === today.getDate();
              const displayType = normalizeEventType(event.type);

              let IconComponent = EventIcon;
              let typeColor = EVENT_COLORS[event.type] || ACCENT_COLOR;

              if (['Elevação', 'Iniciação', 'Exaltação'].includes(displayType)) {
                IconComponent = ArchitectureIcon;
              } else if (displayType === 'Aniversário') {
                IconComponent = CakeIcon;
              } else if (displayType === 'Casamento') {
                IconComponent = WeddingIcon;
                typeColor = 'secondary.main'; // Or any specific color mapping
              } else if (displayType === 'Instalação') {
                IconComponent = GavelIcon;
              }

              let personName = event.title;

              return (
                <Box key={idx} sx={{ width: '100%' }}>
                  <ListItem disablePadding sx={{
                    alignItems: 'flex-start',
                    px: 1,
                    py: 1.5,
                    ...(isToday && {
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(163, 177, 198, 0.05)' : 'rgba(163, 177, 198, 0.1)',
                      borderRadius: '8px',
                      mb: 1
                    })
                  }}>
                    <Box sx={{ width: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="body2" sx={{ color: typeColor, fontWeight: 700, minWidth: '40px', letterSpacing: 0.5 }}>
                          {formattedDate}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20 }}>
                          <IconComponent sx={{ fontSize: 18, color: typeColor }} />
                        </Box>
                        <Typography variant="body2" sx={{ color: typeColor, fontWeight: 600 }}>
                          {displayType}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontFamily: '"Inter", sans-serif', color: theme.palette.text.primary, fontWeight: 400, fontSize: '0.9rem', lineHeight: 1.4, pl: 0 }}>
                        {personName}
                      </Typography>
                    </Box>
                  </ListItem>
                  <Divider sx={{ borderColor: theme.palette.divider, mx: 2 }} />
                </Box>
              );
            })
          ) : (
            <ListItem sx={{ p: 2 }}>
              <ListItemText primary="Nenhuma data próxima" secondaryTypographyProps={{ color: theme.palette.text.secondary }} />
            </ListItem>
          )}
        </List>
      </CardContent>
    </Card>
  );
};

export default LodgeCommemorativeEventsWidget;
