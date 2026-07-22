import React, { useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '@/modules/access_control/context/AuthContext';
import QuickAccessHub, { HubCardConfig } from '@/shared/components/QuickAccessHub';
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

const AdminPanelPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext) || {};

  const activeRole = user?.active_role_name || '';
  const isSuperAdminOrWebmaster = user?.user_type === 'super_admin' || user?.user_type === 'webmaster';

  const hasPermission = (allowedRoles: string[]) => {
    if (isSuperAdminOrWebmaster) return true;
    return allowedRoles.includes(activeRole);
  };

  const cards = useMemo(() => {
    const adminSections = [
      {
        title: 'Secretaria',
        allowedRoles: ['Venerável Mestre', 'Secretário', 'Secretário Adjunto'],
        items: [
          { id: 'sec-obreiros', title: 'Obreiros', description: 'Cadastro de membros e familiares', icon: <PeopleIcon fontSize="large" />, path: '/dashboard/lodge-dashboard/secretario/cadastro', isComingSoon: false },
          { id: 'sec-docs', title: 'Documentos', description: 'Gestão do acervo documental', icon: <DocumentIcon fontSize="large" />, path: '#', isComingSoon: true },
          { id: 'sec-comms', title: 'Comunicação', description: 'Avisos e comunicados da loja', icon: <CommIcon fontSize="large" />, path: '/dashboard/lodge-dashboard/secretario/publicacoes', isComingSoon: false },
        ]
      },
      {
        title: 'Chancelaria',
        allowedRoles: ['Venerável Mestre', 'Chanceler', 'Chanceler Adjunto', 'Secretário', 'Secretário Adjunto'],
        items: [
          { id: 'chan-presencas', title: 'Presenças', description: 'Gestão de presenças', icon: <PresenceIcon fontSize="large" />, path: '/dashboard/lodge-dashboard/chanceler/presencas', isComingSoon: false },
          { id: 'chan-sessoes', title: 'Sessões', description: 'Agendamento e gestão', icon: <SessionIcon fontSize="large" />, path: '/dashboard/lodge-dashboard/secretario/sessoes', isComingSoon: false },
          { id: 'chan-visitantes', title: 'Visitantes', description: 'Membros de outras oficinas', icon: <VisitorIcon fontSize="large" />, path: '/dashboard/lodge-dashboard/chanceler/visitantes', isComingSoon: false },
          { id: 'chan-visitacoes', title: 'Visitações', description: 'Visitas em outras lojas', icon: <VisitationIcon fontSize="large" />, path: '/dashboard/lodge-dashboard/chanceler/visitacoes', isComingSoon: false },
        ]
      },
      {
        title: 'Tesouraria',
        allowedRoles: ['Venerável Mestre', 'Tesoureiro', 'Tesoureiro Adjunto'],
        items: [
          { id: 'tes-contas', title: 'Contas', description: 'Gestão das contas bancárias', icon: <BankIcon fontSize="large" />, path: '#', isComingSoon: true },
          { id: 'tes-lancamentos', title: 'Lançamentos', description: 'Recebimentos e pagamentos', icon: <TransactionIcon fontSize="large" />, path: '#', isComingSoon: true },
        ]
      },
      {
        title: 'Arquitetura',
        allowedRoles: ['Venerável Mestre', 'Arquiteto', 'Arquiteto Adjunto'],
        items: [
          { id: 'arq-patrimonio', title: 'Patrimônio', description: 'Cadastro e baixas de itens', icon: <PatrimonyIcon fontSize="large" />, path: '#', isComingSoon: true },
          { id: 'arq-emprestimos', title: 'Empréstimos', description: 'Empréstimos de itens', icon: <LoanIcon fontSize="large" />, path: '#', isComingSoon: true },
        ]
      },
      {
        title: 'Biblioteca',
        allowedRoles: ['Venerável Mestre', 'Bibliotecário', 'Bibliotecário Adjunto'],
        items: [
          { id: 'bib-acervo', title: 'Acervo', description: 'Gestão do acervo de livros', icon: <LibraryIcon fontSize="large" />, path: '#', isComingSoon: true },
          { id: 'bib-emprestimos', title: 'Empréstimos', description: 'Empréstimos do acervo', icon: <LoanIcon fontSize="large" />, path: '#', isComingSoon: true },
          { id: 'bib-artigos', title: 'Artigos', description: 'Publicação de artigos', icon: <ArticleIcon fontSize="large" />, path: '#', isComingSoon: true },
        ]
      },
      {
        title: 'Harmonia',
        allowedRoles: ['Venerável Mestre', 'Mestre de Harmonia', 'Mestre de Harmonia Adjunto'],
        items: [
          { id: 'har-musicas', title: 'Músicas', description: 'Upload de áudios', icon: <MusicIcon fontSize="large" />, path: '#', isComingSoon: true },
          { id: 'har-eventos', title: 'Eventos', description: 'Playlists para eventos', icon: <PlaylistIcon fontSize="large" />, path: '#', isComingSoon: true },
          { id: 'har-sessoes', title: 'Sessões', description: 'Sequências ritualísticas', icon: <GavelIcon fontSize="large" />, path: '#', isComingSoon: true },
        ]
      },
      {
        title: 'Banquetes',
        allowedRoles: ['Venerável Mestre', 'Mestre de Banquetes', 'Mestre de Banquetes Adjunto', 'Chanceler', 'Chanceler Adjunto'],
        items: [
          { id: 'ban-agape', title: 'Ágape Geral', description: 'Gestão dos ágapes abertos', icon: <BanquetIcon fontSize="large" />, path: '#', isComingSoon: true },
          { id: 'ban-ritual', title: 'Ágape Ritualístico', description: 'Gestão dos ágapes ritualísticos', icon: <BarIcon fontSize="large" />, path: '#', isComingSoon: true },
        ]
      }
    ];

    const flattenedCards: HubCardConfig[] = [];

    adminSections.forEach(section => {
      if (hasPermission(section.allowedRoles)) {
        section.items.forEach(item => {
          flattenedCards.push({
            id: item.id,
            title: item.title,
            subValue: `[${section.title}] ${item.description}`,
            icon: item.icon,
            buttons: [
              {
                label: item.isComingSoon ? 'Em Breve' : 'Acessar',
                primary: !item.isComingSoon,
                onClick: () => {
                  if (!item.isComingSoon && item.path !== '#') {
                    navigate(item.path);
                  }
                }
              }
            ]
          });
        });
      }
    });

    return flattenedCards;
  }, [activeRole, isSuperAdminOrWebmaster, navigate, hasPermission]);

  return (
    <QuickAccessHub 
      title="Painel Administrativo" 
      cards={cards} 
      showBackButton
    />
  );
};

export default AdminPanelPage;
