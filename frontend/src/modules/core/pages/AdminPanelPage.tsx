import React, { useContext } from 'react';
import { Box, Typography, Card, CardContent, useTheme, Chip, Divider, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '@/modules/access_control/context/AuthContext';
import {
  People as PeopleIcon,
  Folder as DocumentIcon,
  Campaign as CommIcon,
  EventAvailable as PresenceIcon,
  Event as SessionIcon,
  EmojiPeople as VisitorIcon,
  CardTravel as VisitationIcon,
  AccountBalance as BankIcon,
  RequestQuote as TransactionIcon,
  AccountBalanceWallet as PaymentIcon,
  HomeWork as PatrimonyIcon,
  AssignmentReturn as LoanIcon,
  LibraryBooks as LibraryIcon,
  Article as ArticleIcon,
  QueueMusic as MusicIcon,
  PlaylistPlay as PlaylistIcon,
  Restaurant as BanquetIcon,
  LocalBar as BarIcon,
  Gavel as GavelIcon
} from '@mui/icons-material';

interface AdminSection {
  title: string;
  allowedRoles: string[];
  items: AdminItem[];
}

interface AdminItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  isComingSoon: boolean;
}

const AdminPanelPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext) || {};

  const activeRole = user?.active_role_name || '';
  const isSuperAdminOrWebmaster = user?.user_type === 'super_admin' || user?.user_type === 'webmaster';

  const hasPermission = (allowedRoles: string[]) => {
    if (isSuperAdminOrWebmaster) return true;
    return allowedRoles.includes(activeRole);
  };

  const adminSections: AdminSection[] = [
    {
      title: 'Secretaria',
      allowedRoles: ['Venerável Mestre', 'Secretário', 'Secretário Adjunto'],
      items: [
        { title: 'Obreiros', description: 'Cadastro de membros e familiares', icon: <PeopleIcon fontSize="large" />, path: '/dashboard/lodge-dashboard/secretario/cadastro', isComingSoon: false },
        { title: 'Documentos', description: 'Gestão do acervo documental', icon: <DocumentIcon fontSize="large" />, path: '#', isComingSoon: true },
        { title: 'Comunicação', description: 'Avisos e comunicados da loja', icon: <CommIcon fontSize="large" />, path: '/dashboard/lodge-dashboard/secretario/publicacoes', isComingSoon: false },
      ]
    },
    {
      title: 'Chancelaria',
      allowedRoles: ['Venerável Mestre', 'Chanceler', 'Chanceler Adjunto', 'Secretário', 'Secretário Adjunto'],
      items: [
        { title: 'Presenças', description: 'Gestão de presenças em sessões', icon: <PresenceIcon fontSize="large" />, path: '/dashboard/lodge-dashboard/chanceler/presencas', isComingSoon: false },
        { title: 'Sessões', description: 'Agendamento e gestão de sessões', icon: <SessionIcon fontSize="large" />, path: '/dashboard/lodge-dashboard/secretario/sessoes', isComingSoon: false },
        { title: 'Visitantes', description: 'Membros de outras oficinas nas sessões', icon: <VisitorIcon fontSize="large" />, path: '/dashboard/lodge-dashboard/chanceler/visitantes', isComingSoon: false },
        { title: 'Visitações', description: 'Visitas do quadro em outras lojas', icon: <VisitationIcon fontSize="large" />, path: '/dashboard/lodge-dashboard/chanceler/visitacoes', isComingSoon: false },
      ]
    },
    {
      title: 'Tesouraria',
      allowedRoles: ['Venerável Mestre', 'Tesoureiro', 'Tesoureiro Adjunto'],
      items: [
        { title: 'Contas', description: 'Gestão das contas bancárias/caixas', icon: <BankIcon fontSize="large" />, path: '#', isComingSoon: true },
        { title: 'Lançamentos', description: 'Controle de recebimentos e pagamentos', icon: <TransactionIcon fontSize="large" />, path: '#', isComingSoon: true },
      ]
    },
    {
      title: 'Arquitetura',
      allowedRoles: ['Venerável Mestre', 'Arquiteto', 'Arquiteto Adjunto'],
      items: [
        { title: 'Patrimônio', description: 'Cadastro e baixas de itens', icon: <PatrimonyIcon fontSize="large" />, path: '#', isComingSoon: true },
        { title: 'Empréstimos', description: 'Empréstimos de itens do patrimônio', icon: <LoanIcon fontSize="large" />, path: '#', isComingSoon: true },
      ]
    },
    {
      title: 'Biblioteca',
      allowedRoles: ['Venerável Mestre', 'Bibliotecário', 'Bibliotecário Adjunto'],
      items: [
        { title: 'Acervo', description: 'Gestão do acervo de livros', icon: <LibraryIcon fontSize="large" />, path: '#', isComingSoon: true },
        { title: 'Empréstimos', description: 'Empréstimos do acervo de livros', icon: <LoanIcon fontSize="large" />, path: '#', isComingSoon: true },
        { title: 'Artigos', description: 'Publicação de artigos (mediação)', icon: <ArticleIcon fontSize="large" />, path: '#', isComingSoon: true },
      ]
    },
    {
      title: 'Harmonia',
      allowedRoles: ['Venerável Mestre', 'Mestre de Harmonia', 'Mestre de Harmonia Adjunto'],
      items: [
        { title: 'Músicas', description: 'Upload de áudios', icon: <MusicIcon fontSize="large" />, path: '#', isComingSoon: true },
        { title: 'Eventos', description: 'Playlists para eventos específicos', icon: <PlaylistIcon fontSize="large" />, path: '#', isComingSoon: true },
        { title: 'Sessões', description: 'Sequências ritualísticas para sessões', icon: <GavelIcon fontSize="large" />, path: '#', isComingSoon: true },
      ]
    },
    {
      title: 'Banquetes',
      allowedRoles: ['Venerável Mestre', 'Mestre de Banquetes', 'Mestre de Banquetes Adjunto', 'Chanceler', 'Chanceler Adjunto'],
      items: [
        { title: 'Ágape Geral', description: 'Gestão dos ágapes abertos', icon: <BanquetIcon fontSize="large" />, path: '#', isComingSoon: true },
        { title: 'Ágape Ritualístico', description: 'Gestão dos ágapes ritualísticos', icon: <BarIcon fontSize="large" />, path: '#', isComingSoon: true },
      ]
    }
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '100%', overflowY: 'auto' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, color: '#fff', mb: 1 }}>
          Painel Administrativo
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', fontFamily: '"Inter", sans-serif' }}>
          Gestão centralizada da loja. O acesso aos módulos abaixo é restrito conforme o seu cargo.
        </Typography>
      </Box>

      {adminSections.map((section, idx) => {
        if (!hasPermission(section.allowedRoles)) return null;

        return (
          <Box key={idx} sx={{ mb: 6 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ color: theme.palette.primary.main, fontWeight: 600, fontFamily: '"Inter", sans-serif', mr: 2 }}>
                {section.title}
              </Typography>
              <Divider sx={{ flexGrow: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
            </Box>

            <Grid container spacing={3}>
              {section.items.map((item, itemIdx) => (
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={itemIdx}>
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
      })}
    </Box>
  );
};

export default AdminPanelPage;
