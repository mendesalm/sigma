import React from 'react';
import { Card, CardContent, Typography, Box, List, ListItem, ListItemButton, ListItemText, IconButton, Button } from '@mui/material';
import { NotificationsActive, Add as AddIcon, Castle } from '@mui/icons-material';
import { DashboardStats } from '@/modules/core/services/dashboardService';

interface LodgeNoticesWidgetProps {
  stats: DashboardStats | null;
  canManageNotices: boolean;
  onOpenAddNotice: () => void;
  onOpenAllNotices: () => void;
  onNoticeClick: (title: string, content: string) => void;
}

const COLORS = {
    cardBg: '#242830',
    gold: '#C49A45',
    textPrimary: '#FFFFFF',
    textSecondary: '#A0AAB4',
    borderColor: 'rgba(255,255,255,0.08)',
    goldGradient: 'linear-gradient(180deg, #DDB96B 0%, #B8862D 100%)',
};

const LodgeNoticesWidget: React.FC<LodgeNoticesWidgetProps> = ({ stats, canManageNotices, onOpenAddNotice, onOpenAllNotices, onNoticeClick }) => {
  return (
    <Card sx={{
      bgcolor: COLORS.cardBg,
      color: '#fff',
      borderRadius: '8px',
      border: `1px solid ${COLORS.borderColor}`,
      boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
      flexGrow: 1,
      display: 'flex',
      flexDirection: 'column',
      minHeight: 300,
      overflow: 'hidden'
    }}>
      <CardContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
        
        <Box sx={{ p: 2.5, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
                <Typography sx={{ fontFamily: '"Inter", sans-serif', color: COLORS.gold, fontSize: '1.2rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1 }}>
                    Mural de Avisos
                    {canManageNotices && (
                        <IconButton size="small" onClick={onOpenAddNotice} sx={{ color: COLORS.textSecondary, '&:hover': { color: COLORS.gold } }}>
                            <AddIcon fontSize="small" />
                        </IconButton>
                    )}
                </Typography>
            </Box>
            
            <Box sx={{ 
                width: 48, 
                height: 48, 
                border: `1px solid rgba(196, 154, 69, 0.3)`, 
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
            }}>
                <NotificationsActive sx={{ color: COLORS.gold, fontSize: 28 }} />
            </Box>
        </Box>

        <List disablePadding sx={{ overflowY: 'auto', flexGrow: 1, px: 2, pb: 2 }}>

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
                border: `1px solid ${COLORS.borderColor}`,
                borderRadius: '8px',
                bgcolor: 'transparent',
                mb: 1.5,
                transition: 'all 0.2s',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
              }}
            >
              <Castle sx={{ color: COLORS.gold, fontSize: 20, mt: 0.5, mr: 1.5 }} />
              <ListItemText
                primary="PRÓXIMA SESSÃO"
                primaryTypographyProps={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: 1, color: COLORS.gold }}
                secondary={
                  <>
                    <Typography component="span" sx={{ color: COLORS.textPrimary, display: 'block', fontSize: '0.85rem', fontWeight: 500, mt: 0.5 }}>
                      {stats.next_session.title}
                    </Typography>
                    <Typography component="span" sx={{ color: COLORS.textSecondary, mt: 0.5, display: 'block', fontSize: '0.75rem', fontStyle: 'italic' }}>
                      {new Date(stats.next_session.session_date).toLocaleDateString('pt-BR')} às {stats.next_session.start_time}
                    </Typography>
                  </>
                }
              />
            </ListItemButton>
          ) : (
            <ListItem sx={{ alignItems: 'flex-start', p: 1.5, mb: 1.5, border: `1px dashed ${COLORS.borderColor}`, borderRadius: '8px' }}>
              <Castle sx={{ color: COLORS.textSecondary, fontSize: 20, mt: 0.5, mr: 1.5 }} />
              <ListItemText 
                primary="Nenhuma sessão agendada" 
                primaryTypographyProps={{ color: COLORS.textSecondary, fontSize: '0.85rem' }} 
              />
            </ListItem>
          )}

          {/* 2. Other Notices */}
          {stats?.active_notices && stats.active_notices.length > 0 ? (
            stats.active_notices.map((notice) => (
              <ListItemButton
                key={notice.id}
                onClick={() => onNoticeClick(notice.title, notice.content)}
                sx={{
                  alignItems: 'flex-start',
                  p: 1.5,
                  mb: 1.5,
                  border: `1px solid ${COLORS.borderColor}`,
                  borderRadius: '8px',
                  bgcolor: 'transparent',
                  transition: 'all 0.2s',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
                }}
              >
                <ListItemText
                  primary={notice.title}
                  primaryTypographyProps={{ color: COLORS.textPrimary, fontWeight: 600, fontSize: '0.85rem' }}
                  secondary={
                    <Typography sx={{ color: COLORS.textSecondary, fontSize: '0.75rem', mt: 0.5, fontStyle: 'italic' }}>
                      Expira em: {notice.expiration_date ? new Date(notice.expiration_date).toLocaleDateString('pt-BR') : 'N/A'}
                    </Typography>
                  }
                />
              </ListItemButton>
            ))
          ) : null}
          
          {stats?.active_notices?.length === 0 && (
             <ListItem sx={{ p: 1.5, textAlign: 'center' }}>
                <ListItemText 
                    primary="Nenhum outro aviso ativo" 
                    primaryTypographyProps={{ color: COLORS.textSecondary, fontSize: '0.85rem' }} 
                />
             </ListItem>
          )}

        </List>

        <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              onClick={onOpenAllNotices}
              sx={{ 
                  flex: 1,
                  color: COLORS.textPrimary, 
                  borderColor: 'rgba(255,255,255,0.2)',
                  textTransform: 'none',
                  fontFamily: '"Inter", sans-serif',
                  '&:hover': { borderColor: COLORS.gold, bgcolor: 'rgba(196,154,69,0.05)' }
              }}
            >
              Ler Todos
            </Button>

            {canManageNotices && (
                <Button
                  variant="contained"
                  onClick={onOpenAddNotice}
                  sx={{ 
                      flex: 1,
                      background: COLORS.goldGradient,
                      color: '#1A1D23',
                      fontWeight: 600,
                      textTransform: 'none',
                      fontFamily: '"Inter", sans-serif',
                      boxShadow: 'none',
                      '&:hover': {
                          background: COLORS.goldGradient,
                          opacity: 0.9,
                          boxShadow: '0 2px 10px rgba(196,154,69,0.3)'
                      }
                  }}
                >
                  Editar
                </Button>
            )}
        </Box>

      </CardContent>
    </Card>
  );
};

export default LodgeNoticesWidget;
