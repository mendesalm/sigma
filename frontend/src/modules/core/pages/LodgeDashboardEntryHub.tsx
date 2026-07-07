import React, { useContext, useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import QuickAccessHub, { HubCardConfig } from '@/shared/components/QuickAccessHub';
import {
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Code as WebmasterIcon,
  QrCodeScanner as QrCodeScannerIcon,
  Event as EventIcon,
  Business as BusinessIcon,
  ContactMail as ContactMailIcon
} from '@mui/icons-material';
import { SvgIcon, Grid, Avatar } from '@mui/material';
import { AuthContext } from '@/modules/access_control/context/AuthContext';
import api from '@/shared/services/api';
import { Typography, Box, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { formatDegree } from '@/shared/utils/formatters';
import SessionCheckIn from '@/modules/sessions/components/SessionCheckIn';

interface ActiveAdminOfficer {
  role_name: string;
  member_name: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const MasonicIcon = (props: any) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M12,2 L9.5,6.5 L12,11 L14.5,6.5 Z M12,13.5 L4.5,21.5 L6,23 L12,16.5 L18,23 L19.5,21.5 Z M5,10.5 L12,17.5 L19,10.5 L17.5,9 L12,14.5 L6.5,9 Z" fill="currentColor"/>
  </SvgIcon>
);

const getLogoUrl = (lodgeInfo: any) => {
  if (!lodgeInfo || !lodgeInfo.logo_url) return null;
  if (lodgeInfo.logo_url.startsWith('http')) return lodgeInfo.logo_url;
  const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
  const logoPath = lodgeInfo.logo_url.startsWith('/') ? lodgeInfo.logo_url : `/${lodgeInfo.logo_url}`;
  return `${baseUrl}${logoPath}`;
};

const LodgeDashboardEntryHub: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext) || {};

  const [obreiroData, setObreiroData] = useState<{ name: string; degree: number; is_installed: boolean; cim: string; role: string; photoUrl: string | undefined } | null>(null);
  const [adminData, setAdminData] = useState<ActiveAdminOfficer[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [openCheckIn, setOpenCheckIn] = useState(false);
  const [lodgeInfo, setLodgeInfo] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      // 1. Fetch Obreiro Info
      try {
        if (user?.user_id) {
          const memberRes = await api.get(`/members/${user.user_id}`);
          if (memberRes.data) {
            setObreiroData({
              name: memberRes.data.full_name || user.name || 'Obreiro',
              degree: memberRes.data.degree || 1,
              is_installed: memberRes.data.is_installed || false,
              cim: memberRes.data.cim || user?.cim || 'Não informado',
              role: user.active_role_name || 'Sem cargo atual',
              photoUrl: memberRes.data.profile_picture_path ? `${API_URL}${memberRes.data.profile_picture_path}` : undefined
            });
          }
        } else {
          setObreiroData({
            name: user?.name || 'Obreiro',
            degree: 'Mestre Maçom', // Fallback
            cim: user?.cim || 'Não informado',
            role: user?.active_role_name || 'Membro',
            photoUrl: user?.profile_picture_path ? `${API_URL}${user.profile_picture_path}` : undefined
          });
        }
      } catch (e) {
        console.error("Error fetching obreiro info", e);
        setObreiroData({
          name: user?.name || 'Obreiro',
          degree: 'Não informado',
          cim: user?.cim || 'Não informado',
          role: user?.active_role_name || 'Membro',
          photoUrl: user?.profile_picture_path ? `${API_URL}${user.profile_picture_path}` : undefined
        });
      }

      // 2. Fetch Directorate (Administration)
      try {
        const adminRes = await api.get('/administrations');
        if (adminRes.data && Array.isArray(adminRes.data)) {
          const currentAdmin = adminRes.data.find((a: any) => a.is_current) || adminRes.data[0];
          if (currentAdmin && currentAdmin.role_histories) {
            const officers: ActiveAdminOfficer[] = [];
            const desiredRoles = ['Venerável Mestre', 'Primeiro Vigilante', 'Orador', 'Secretário', 'Chanceler', 'Tesoureiro'];
            
            desiredRoles.forEach(roleName => {
              const hist = currentAdmin.role_histories.find((h: any) => h.role?.name?.toLowerCase().includes(roleName.toLowerCase()));
              if (hist) {
                officers.push({
                  role_name: roleName,
                  member_name: hist.member?.full_name || 'Não nomeado'
                });
              } else {
                officers.push({
                  role_name: roleName,
                  member_name: 'Vago'
                });
              }
            });
            setAdminData(officers);
          }
        }
      } catch (e) {
        console.error("Error fetching administration", e);
      }

      // 3. Fetch Active Session
      try {
        const sessionsRes = await api.get('/masonic-sessions');
        if (sessionsRes.data && Array.isArray(sessionsRes.data)) {
          const activeSession = sessionsRes.data.find((s: any) => s.status === 'EM_ANDAMENTO');
          if (activeSession) {
            setActiveSessionId(activeSession.id);
          }
        }
      } catch (e) {
        console.error("Error fetching sessions", e);
      }

      // 4. Fetch Lodge Info
      try {
        const statsRes = await api.get('/dashboard/stats');
        if (statsRes.data?.lodge_info) {
          setLodgeInfo(statsRes.data.lodge_info);
        }
      } catch (e) {
        console.error("Error fetching dashboard stats", e);
      }
    };

    fetchData();
  }, [user]);

  const cards = useMemo(() => {
    const isWebmaster = user?.user_type === 'super_admin' || user?.user_type === 'webmaster';
    
    const adminRoles = [
      'Venerável Mestre', 'Secretário', 'Secretário Adjunto', 'Chanceler', 'Chanceler Adjunto',
      'Tesoureiro', 'Tesoureiro Adjunto', 'Arquiteto', 'Arquiteto Adjunto', 'Bibliotecário',
      'Bibliotecário Adjunto', 'Mestre de Harmonia', 'Mestre de Harmonia Adjunto',
      'Mestre de Banquetes', 'Mestre de Banquetes Adjunto'
    ];
    const isAdmin = isWebmaster || adminRoles.includes(user?.active_role_name || '');

    const availablePanels: HubCardConfig[] = [];

    // Order: Obreiro -> Check-in -> Webmaster -> Admin -> Minha Loja

    // 1. Obreiro
    availablePanels.push({
      id: 'obreiro',
      title: 'Obreiro',
      icon: obreiroData?.photoUrl ? (
        <Box component="img" src={obreiroData.photoUrl} alt={obreiroData.name} sx={{ width: 40, height: 40, objectFit: 'cover', borderRadius: '50%' }} />
      ) : (
        <PersonIcon fontSize="large" />
      ),
      onClick: () => navigate('/dashboard/lodge-dashboard/obreiro'),
      subValue: obreiroData ? (
        <Box sx={{ mt: 1 }}>
          <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 600 }}>{obreiroData.name}</Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>CIM: {obreiroData.cim}</Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Grau: {formatDegree(obreiroData.degree, obreiroData.is_installed)}</Typography>
          <Typography variant="body2" sx={{ color: '#D4AF37' }}>Cargo: {obreiroData.role}</Typography>
        </Box>
      ) : (
        <CircularProgress size={20} sx={{ mt: 2 }} />
      )
    });

    // 2. Check-in
    if (activeSessionId) {
      availablePanels.push({
        id: 'checkin',
        title: 'Check-in Sessão',
        icon: <QrCodeScannerIcon fontSize="large" />,
        onClick: () => setOpenCheckIn(true),
        subValue: (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" sx={{ color: '#4caf50', fontWeight: 600 }}>
              Sessão em Andamento
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Clique para registrar sua presença.
            </Typography>
          </Box>
        )
      });
    }

    // 3. Webmaster
    if (isWebmaster) {
      availablePanels.push({
        id: 'webmaster',
        title: 'Painel do Webmaster',
        icon: <WebmasterIcon fontSize="large" />,
        onClick: () => navigate('/dashboard'),
        subValue: (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Acesso global ao sistema e configurações root.
            </Typography>
          </Box>
        )
      });
    }

    // 4. Admin
    if (isAdmin) {
      availablePanels.push({
        id: 'admin',
        title: 'Painel Administrativo',
        icon: <AdminIcon fontSize="large" />,
        onClick: () => navigate('/dashboard/lodge-dashboard/admin'),
        subValue: adminData.length > 0 ? (
          <Box sx={{ mt: 1 }}>
            {adminData.map((officer, idx) => (
              <Typography key={idx} variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', mb: 0.2 }}>
                <strong style={{ color: '#D4AF37' }}>{officer.role_name}:</strong> {officer.member_name}
              </Typography>
            ))}
          </Box>
        ) : (
          <CircularProgress size={20} sx={{ mt: 2 }} />
        )
      });
    }

    // 5. Minha Loja (Dashboard)
    const lodgeLogoUrl = lodgeInfo ? getLogoUrl(lodgeInfo) : undefined;
    
    availablePanels.push({
      id: 'dashboard',
      title: 'Minha Loja',
      icon: lodgeLogoUrl ? (
        <Box component="img" src={lodgeLogoUrl} alt="Logo da Loja" sx={{ width: 40, height: 40, objectFit: 'contain' }} />
      ) : (
        <MasonicIcon fontSize="large" />
      ),
      onClick: () => navigate('/dashboard/lodge-dashboard/geral'),
      subValue: lodgeInfo ? (
        <Box sx={{ mt: 1 }}>
          <Typography variant="h6" sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 500, color: '#fff', fontSize: '1rem', lineHeight: 1.2, mb: 0.2 }}>
            {lodgeInfo.name}, nº {lodgeInfo.number}
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontFamily: '"Inter", sans-serif', display: 'block', fontSize: '0.875rem', fontStyle: 'italic', mb: 1.5 }}>
            {lodgeInfo.rite}
          </Typography>

          <Grid container spacing={0.5}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <EventIcon sx={{ color: '#D4AF37', fontSize: 16, mr: 1 }} />
                <Typography variant="body2" sx={{ color: '#fff', fontWeight: 400, fontSize: '0.875rem' }}>
                  Sessões às <span style={{ fontStyle: 'italic' }}>{lodgeInfo.session_day}, {lodgeInfo.session_time}</span>
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 0.5 }}>
                <BusinessIcon sx={{ color: '#D4AF37', fontSize: 16, mt: 0.2, mr: 1 }} />
                <Box sx={{ lineHeight: 1.3 }}>
                  {lodgeInfo.subpotencia ? (
                    <>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontFamily: '"Inter", sans-serif', display: 'block', fontSize: '0.75rem' }}>
                        Federada ao {lodgeInfo.potencia}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontFamily: '"Inter", sans-serif', display: 'block', fontSize: '0.75rem' }}>
                        Jurisdicionada ao {lodgeInfo.subpotencia}
                      </Typography>
                    </>
                  ) : (
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontFamily: '"Inter", sans-serif', display: 'block', fontSize: '0.75rem' }}>
                      Confederada à {lodgeInfo.potencia}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ ml: 3.5, mb: 0.5 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontFamily: '"Inter", sans-serif', display: 'block', fontSize: '0.75rem', lineHeight: 1.4 }}>
                  <span style={{ fontStyle: 'italic' }}>Fundação:</span> {lodgeInfo.foundation_date}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontFamily: '"Inter", sans-serif', display: 'block', fontSize: '0.75rem', lineHeight: 1.4 }}>
                  <span style={{ fontStyle: 'italic' }}>Endereço:</span> {lodgeInfo.address}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <ContactMailIcon sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, mr: 1 }} />
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontFamily: '"Inter", sans-serif', mr: 2, fontSize: '0.75rem', fontStyle: 'italic' }}>
                  {lodgeInfo.email}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontFamily: '"Inter", sans-serif', display: 'block', ml: 3, mt: 0.5, fontSize: '0.75rem' }}>
                <span style={{ fontStyle: 'italic' }}>CNPJ:</span> {lodgeInfo.cnpj}
              </Typography>
            </Grid>
          </Grid>
        </Box>
      ) : (
        <CircularProgress size={20} sx={{ mt: 2 }} />
      )
    });

    // 6. Calculate dynamic column span based on visible cards
    const len = availablePanels.length;
    const textHeavyCount = availablePanels.filter(p => ['admin', 'dashboard'].includes(p.id)).length;

    availablePanels.forEach((panel, i) => {
      if (len === 1) {
        panel.colSpan = 12;
      } else if (len === 2) {
        panel.colSpan = 6;
      } else if (len === 3) {
        // Optimize for 3 widgets where 2 are text-heavy (Admin + Dashboard)
        if (textHeavyCount === 2) {
          if (i === 0) panel.colSpan = 12; // Obreiro
          else panel.colSpan = 6; // Admin & Dashboard
        } else {
          panel.colSpan = 4;
        }
      } else if (len === 4) {
        // User requested: se houver 4 widges o quarto usará a segunda linha inteira
        if (i < 3) panel.colSpan = 4;
        else panel.colSpan = 12; // 4th widget (Dashboard) gets full row
      } else if (len === 5) {
        // User requested: se houver 5, o quarto e o quinto dividirão a segunda linha
        if (i < 3) panel.colSpan = 4;
        else panel.colSpan = 6; // 4th and 5th widgets (Admin & Dashboard) divide row
      }
    });

    return availablePanels;
  }, [user, navigate, obreiroData, adminData, activeSessionId, lodgeInfo]);

  return (
    <>
      <QuickAccessHub 
        cards={cards} 
        showBackButton={false} // No back button on the very first layer
      />

      <Dialog open={openCheckIn} onClose={() => setOpenCheckIn(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: '#151B26', color: '#fff' }}}>
        <DialogTitle sx={{ color: '#D4AF37' }}>Registrar Presença</DialogTitle>
        <DialogContent>
          {activeSessionId && (
            <SessionCheckIn 
              sessionId={activeSessionId} 
              onSuccess={() => setOpenCheckIn(false)} 
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCheckIn(false)} sx={{ color: 'rgba(255,255,255,0.7)' }}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default LodgeDashboardEntryHub;
