import React from 'react';
import { Box, Typography, Card, CardContent, Accordion, AccordionSummary, AccordionDetails, useTheme, alpha } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import WorkHistoryIcon from '@mui/icons-material/WorkHistory';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import { RoleHistoryResponse } from '@/types';
import { formatDegree } from '@/shared/utils/formatters';

interface RoleHistoryWidgetProps {
  roleHistory?: RoleHistoryResponse[];
}

export const RoleHistoryWidget: React.FC<RoleHistoryWidgetProps> = ({ roleHistory = [] }) => {
  const theme = useTheme();
  
  // Ordenar o histórico por data (mais recente primeiro)
  const sortedHistory = [...roleHistory].sort((a, b) => {
    return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
  });

  const recentRoles = sortedHistory.slice(0, 3);
  const olderRoles = sortedHistory.slice(3);

  const renderTimelineItem = (history: RoleHistoryResponse, isLast: boolean, isFirst: boolean, isOlder: boolean = false) => {
    const isActive = isFirst && !history.end_date && !isOlder;
    const dotColor = isActive ? theme.palette.primary.main : alpha(theme.palette.text.disabled, 0.5);

    const formattedStart = history.start_date ? history.start_date.split('-').reverse().join('/') : '';
    const formattedEnd = history.end_date ? history.end_date.split('-').reverse().join('/') : (isActive ? 'Atual' : '');
    const dateRange = formattedStart && formattedEnd ? `${formattedStart} - ${formattedEnd}` : formattedStart || formattedEnd;

    return (
      <Box key={history.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.25, borderBottom: isLast ? 'none' : `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: dotColor }} />
          <Box>
            <Typography variant="body2" sx={{ fontWeight: isActive ? 700 : 600, color: isActive ? 'text.primary' : 'text.secondary' }}>
              {history.role?.name || `Cargo #${history.role_id}`}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Loja #{history.lodge_id}
            </Typography>
          </Box>
        </Box>
        <Typography variant="body2" color="text.primary" sx={{ fontWeight: 600, textAlign: 'right' }}>
          {dateRange}
        </Typography>
      </Box>
    );
  };

  return (
    <Card sx={{ height: '260px', bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.4) : 'background.paper', border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, borderRadius: 2 }}>
      <CardContent sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WorkHistoryIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
              Cargos
            </Typography>
          </Box>
        </Box>

        {sortedHistory.length === 0 ? (
          <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
            Nenhum histórico de cargos registrado.
          </Typography>
        ) : (
          <Box sx={{ mt: 0, flexGrow: 1, overflowY: 'auto', pr: 0.5, display: 'flex', flexDirection: 'column' }}>
            {recentRoles.map((history, idx) => 
              renderTimelineItem(history, idx === recentRoles.length - 1 && olderRoles.length === 0, idx === 0)
            )}

            {olderRoles.length > 0 && (
              <Accordion 
                elevation={0}
                sx={{ 
                  bgcolor: 'transparent',
                  '&:before': { display: 'none' },
                  mt: 2,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  borderRadius: '8px !important'
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: '48px', '& .MuiAccordionSummary-content': { my: 1 } }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    Ver Histórico Completo ({olderRoles.length})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0, pb: 2, px: 2 }}>
                  <Box sx={{ mt: 1 }}>
                    {olderRoles.map((history, idx) => 
                      renderTimelineItem(history, idx === olderRoles.length - 1, false, true)
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
