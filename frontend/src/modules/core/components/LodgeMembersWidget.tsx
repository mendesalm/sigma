import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { DashboardStats } from '@/modules/core/services/dashboardService';
import { getGlassStyles, ACCENT_COLOR } from '@/modules/core/constants/LodgeDashboardConstants';
interface LodgeMembersWidgetProps {
  stats: DashboardStats | null;
  onClick: () => void;
}

const LodgeMembersWidget: React.FC<LodgeMembersWidgetProps> = ({ stats, onClick }) => {
  const theme = useTheme();
  const glassStyles = getGlassStyles(theme.palette.mode);

  return (
    <Card
      sx={{
        ...glassStyles,
        color: theme.palette.text.primary,
        borderRadius: '16px',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        flexGrow: 0,
        flexShrink: 0,
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: `0 12px 40px rgba(0,0,0,0.5)`,
          borderColor: ACCENT_COLOR,
        },
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.palette.divider}`, pb: 0.5, mb: 1 }}>
          <Typography variant="h6" sx={{ color: ACCENT_COLOR, fontFamily: '"Inter", sans-serif', fontWeight: 600, fontSize: '1rem', lineHeight: 1 }}>
            Membros da Loja
          </Typography>
          <Typography variant="h4" sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 700, color: theme.palette.text.primary, lineHeight: 1 }}>
            {stats?.lodge_members_stats?.total || 0}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>Mestres</Typography>
            <Typography variant="body2" sx={{ color: ACCENT_COLOR, fontStyle: 'italic', fontWeight: 500 }}>
              {stats?.lodge_members_stats?.masters || 0}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>Companheiros</Typography>
            <Typography variant="body2" sx={{ color: 'info.main', fontStyle: 'italic', fontWeight: 500 }}>
              {stats?.lodge_members_stats?.fellows || 0}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>Aprendizes</Typography>
            <Typography variant="body2" sx={{ color: 'success.main', fontStyle: 'italic', fontWeight: 500 }}>
              {stats?.lodge_members_stats?.apprentices || 0}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default LodgeMembersWidget;
