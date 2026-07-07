import React from 'react';
import { useNavigate } from 'react-router-dom';
import QuickAccessHub, { HubCardConfig } from '@/shared/components/QuickAccessHub';
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
  const navigate = useNavigate();

  const cards: HubCardConfig[] = [
    {
      id: 'cadastro',
      title: 'Cadastro',
      subValue: 'Ficha individual e atualização',
      icon: <PersonIcon fontSize="large" />,
      colSpan: 6,
      buttons: [
        { label: 'Acessar', primary: true, onClick: () => navigate('/dashboard/lodge-dashboard/obreiro/meu-cadastro') }
      ]
    },
    {
      id: 'presencas',
      title: 'Presenças',
      subValue: 'Relatório de presença individual',
      icon: <PresenceIcon fontSize="large" />,
      colSpan: 6,
      buttons: [
        { label: 'Visualizar', primary: true, onClick: () => navigate('/dashboard/lodge-dashboard/obreiro/minhas-presencas') }
      ]
    },
    {
      id: 'visitas',
      title: 'Visitas',
      subValue: 'Relatório de visitações',
      icon: <VisitationIcon fontSize="large" />,
      colSpan: 6,
      buttons: [
        { label: 'Visualizar', primary: true, onClick: () => navigate('/dashboard/lodge-dashboard/obreiro/minhas-visitacoes') }
      ]
    },
    {
      id: 'financas',
      title: 'Finanças',
      subValue: 'Em Breve',
      icon: <FinanceIcon fontSize="large" />,
      colSpan: 6,
      buttons: [
        { label: 'Indisponível', onClick: () => {} }
      ]
    },
    {
      id: 'classificados',
      title: 'Classificados',
      subValue: 'Consulta e anúncios',
      icon: <ClassifiedsIcon fontSize="large" />,
      colSpan: 4,
      buttons: [
        { label: 'Acessar', primary: true, onClick: () => navigate('/dashboard/lodge-dashboard/obreiro/classificados') }
      ]
    },
    {
      id: 'emprestimos',
      title: 'Empréstimos',
      subValue: 'Itens do patrimônio',
      icon: <PatrimonyIcon fontSize="large" />,
      colSpan: 4,
      buttons: [
        { label: 'Acessar', primary: true, onClick: () => navigate('/dashboard/lodge-dashboard/obreiro/meus-emprestimos') }
      ]
    },
    {
      id: 'biblioteca',
      title: 'Biblioteca',
      subValue: 'Em Breve',
      icon: <LibraryIcon fontSize="large" />,
      colSpan: 4,
      buttons: [
        { label: 'Indisponível', onClick: () => {} }
      ]
    },
  ];

  return (
    <QuickAccessHub 
      title="Painel do Obreiro" 
      cards={cards} 
      showBackButton
    />
  );
};

export default ObreiroPanelPage;
