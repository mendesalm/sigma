import React from 'react';
import { Card, CardContent, Typography, Box, List, ListItem, ListItemButton, ListItemText, IconButton, Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Add as AddIcon, Castle, Campaign } from '@mui/icons-material';
import { DashboardStats } from '@/modules/core/services/dashboardService';
import { getGlassStyles, ACCENT_COLOR } from '@/modules/core/constants/LodgeDashboardConstants';

interface LodgeNoticesWidgetProps {
  stats: DashboardStats | null;
  canManageNotices: boolean;
  onOpenAddNotice: () => void;
  onOpenAllNotices: () => void;
  onNoticeClick: (title: string, content: string) => void;
}

const LodgeNoticesWidget: React.FC<LodgeNoticesWidgetProps> = ({ stats, canManageNotices, onOpenAddNotice, onOpenAllNotices, onNoticeClick }) => {
  const theme = useTheme();
  const glassStyles = getGlassStyles(theme.palette.mode);

  return (
    <Card sx={{
      ...glassStyles,
      color: theme.palette.text.primary,
      borderRadius: '16px',
      flexGrow: 1,
      display: 'flex',
      flexDirection: 'column',
      minHeight: 300,
      overflow: 'hidden'
    }}>
      <CardContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontFamily: '"Inter", sans-serif', color: ACCENT_COLOR, fontWeight: 600, fontSize: '1rem' }}>
            Mural de Avisos
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {canManageNotices && (
              <IconButton size="small" onClick={onOpenAddNotice} sx={{ color: theme.palette.text.secondary, '&:hover': { color: ACCENT_COLOR } }}>
                <AddIcon fontSize="small" />
              </IconButton>
            )}
            <Button
              size="small"
              onClick={onOpenAllNotices}
              sx={{ fontSize: '0.75rem', color: theme.palette.text.secondary, '&:hover': { color: theme.palette.text.primary } }}
            >
              VER TODOS
            </Button>
          </Box>
        </Box>
        <List disablePadding sx={{ overflowY: 'auto', flexGrow: 1, p: 2 }}>

          {/* 1. Próxima Sessão */}
          {stats?.next_session ? (
            <ListItemButton
              onClick={() => onNoticeClick('Próxima Sessão', `
                  <strong>Título:</strong> ${stats.next_session!.title}<br/>
                  <strong>Data:</strong> ${new Date(stats.next_session!.session_date).toLocaleDateString('pt-BR')}<br/>
                  <strong>Horário:</strong> ${stats.next_session!.start_time || 'A definir'}<br/>
                  <strong>Local:</strong> Templo Principal
              `)}
              sx={{
                alignItems: 'flex-start',
                p: 1.5,
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: 'transparent',
                mb: 1,
                transition: 'all 0.2s',
                '&:hover': { bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }
              }}
            >
              <Castle sx={{ color: ACCENT_COLOR, fontSize: 20, mt: 0.5, mr: 1.5 }} />
              <ListItemText
                primary="PRÓXIMA SESSÃO"
                primaryTypographyProps={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: 1, color: ACCENT_COLOR }}
                secondary={
                  <>
                    <Typography component="span" variant="body2" sx={{ color: theme.palette.text.primary, display: 'block', fontWeight: 400, mt: 0.5 }}>
                      {stats.next_session.title}
                    </Typography>
                    <Typography component="span" variant="caption" sx={{ color: theme.palette.text.secondary, mt: 0.5, display: 'block', fontStyle: 'italic' }}>
                      {new Date(stats.next_session.session_date).toLocaleDateString('pt-BR')} às {stats.next_session.start_time}
                    </Typography>
                  </>
                }
              />
            </ListItemButton>
          ) : (
            <ListItem sx={{ alignItems: 'flex-start', p: 2, border: `1px dashed ${theme.palette.divider}` }}>
              <Castle sx={{ color: theme.palette.text.secondary, fontSize: 20, mt: 0.5, mr: 1.5 }} />
              <ListItemText primary="Nenhuma sessão agendada" secondaryTypographyProps={{ color: theme.palette.text.secondary }} />
            </ListItem>
          )}

          {/* 2. Other Notices */}
          {stats?.active_notices && stats.active_notices.length > 0 ? (
            stats.active_notices.map((notice) => (
              <ListItemButton
                key={notice.id}
                onClick={() => onNoticeClick(notice.title, notice.content)}
                sx={{ alignItems: 'flex-start', p: 1.5, borderBottom: `1px solid ${theme.palette.divider}`, transition: 'all 0.2s', '&:hover': { bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' } }}
              >
                <Campaign sx={{ color: 'info.main', fontSize: 18, mt: 0.5, mr: 1.5 }} />
                <ListItemText
                  primary={notice.title}
                  primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 500, color: theme.palette.text.primary }}
                  secondary="Clique para ver detalhes."
                  secondaryTypographyProps={{ fontSize: '0.7rem', color: theme.palette.text.secondary, mt: 0.5, fontStyle: 'italic' }}
                />
              </ListItemButton>
            ))
          ) : null}
        </List>
      </CardContent>
    </Card>
  );
};

export default LodgeNoticesWidget;
