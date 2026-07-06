import React from 'react';
import { Box, Typography, Card, CardContent, useTheme, Chip, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Person as PersonIcon,
  EventAvailable as PresenceIcon,
  CardTravel as VisitationIcon,
  AttachMoney as FinanceIcon,
  WorkHistory as RolesIcon,
  QrCodeScanner as QrCodeIcon,
  Storefront as ClassifiedsIcon,
  Build as PatrimonyIcon,
  LibraryBooks as LibraryIcon
} from '@mui/icons-material';

const ObreiroPanelPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const menuItems = [
    {
      title: 'Cadastro',
      description: 'Ficha individual e atualização',
      icon: <PersonIcon fontSize="large" />,
      path: '/dashboard/lodge-dashboard/obreiro/meu-cadastro',
      isComingSoon: false,
    },
    {
      title: 'Presenças',
      description: 'Relatório de presença individual',
      icon: <PresenceIcon fontSize="large" />,
      path: '/dashboard/lodge-dashboard/obreiro/minhas-presencas',
      isComingSoon: false,
    },
    {
      title: 'Visitas',
      description: 'Relatório de visitações',
      icon: <VisitationIcon fontSize="large" />,
      path: '/dashboard/lodge-dashboard/obreiro/minhas-visitacoes',
      isComingSoon: false,
    },
    {
      title: 'Finanças',
      description: 'Relatório de pagamentos',
      icon: <FinanceIcon fontSize="large" />,
      path: '#',
      isComingSoon: true,
    },
    {
      title: 'Histórico de Cargos',
      description: 'Cargos exercidos e comissões',
      icon: <RolesIcon fontSize="large" />,
      path: '#',
      isComingSoon: true,
    },
    {
      title: 'Check-in Sessão',
      description: 'Registro de presença por QR Code',
      icon: <QrCodeIcon fontSize="large" />,
      path: '#',
      isComingSoon: true,
    },
    {
      title: 'Classificados',
      description: 'Consulta e anúncios',
      icon: <ClassifiedsIcon fontSize="large" />,
      path: '/dashboard/lodge-dashboard/obreiro/classificados',
      isComingSoon: false,
    },
    {
      title: 'Empréstimos',
      description: 'Itens do patrimônio',
      icon: <PatrimonyIcon fontSize="large" />,
      path: '/dashboard/lodge-dashboard/obreiro/meus-emprestimos',
      isComingSoon: false,
    },
    {
      title: 'Biblioteca',
      description: 'Acervo e empréstimos de livros',
      icon: <LibraryIcon fontSize="large" />,
      path: '#',
      isComingSoon: true,
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '100%', overflowY: 'auto' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, color: '#fff', mb: 1 }}>
          Painel do Obreiro
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', fontFamily: '"Inter", sans-serif' }}>
          Acesso rápido às suas funções e relatórios individuais.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {menuItems.map((item, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={index}>
            <Card
              onClick={() => {
                if (!item.isComingSoon && item.path !== '#') {
                  navigate(item.path);
                }
              }}
              sx={{
                height: '100%',
                bgcolor: 'rgba(21, 27, 38, 0.4)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderTop: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
                cursor: item.isComingSoon ? 'default' : 'pointer',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': item.isComingSoon ? {} : {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                  borderColor: theme.palette.primary.main,
                  '& .MuiSvgIcon-root': {
                    color: theme.palette.primary.light,
                  }
                },
              }}
            >
              <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
                {item.isComingSoon && (
                  <Chip
                    label="Em Breve"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      bgcolor: 'rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.7)',
                      fontWeight: 600,
                      fontSize: '0.65rem'
                    }}
                  />
                )}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 60,
                    height: 60,
                    borderRadius: '12px',
                    bgcolor: 'rgba(255,255,255,0.05)',
                    color: theme.palette.primary.main,
                    mb: 2,
                    transition: 'all 0.3s ease'
                  }}
                >
                  {item.icon}
                </Box>
                <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: 1, fontFamily: '"Inter", sans-serif', fontSize: '1.1rem' }}>
                  {item.title}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', fontFamily: '"Inter", sans-serif', lineHeight: 1.5 }}>
                  {item.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ObreiroPanelPage;
