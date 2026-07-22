import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, useTheme, alpha, Button, Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import CloseIcon from '@mui/icons-material/Close';
import StoreIcon from '@mui/icons-material/Store';
import { MemberLodgeAssociationResponse } from '@/types';

interface RegistryWidgetProps {
  affiliationDate?: string | null;
  regularizationDate?: string | null;
  initiationDate?: string | null;
  lodgeAssociations?: MemberLodgeAssociationResponse[];
  currentLodgeId?: number; // fallback se não tiver nome
}

export const RegistryWidget: React.FC<RegistryWidgetProps> = ({ 
  affiliationDate, regularizationDate, initiationDate, lodgeAssociations = [], currentLodgeId 
}) => {
  const theme = useTheme();
  const [modalOpen, setModalOpen] = useState(false);

  // Ordenar associações por data mais recente
  const sortedAssoc = [...lodgeAssociations].sort((a, b) => {
    const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
    const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
    return dateB - dateA; // mais recentes primeiro
  });

  // "Loja Atual": a que não tem data de saída, ou a mais recente
  const activeLodgeAssoc = sortedAssoc.find(l => !l.end_date) || sortedAssoc[0];

  let lodgeText = 'Não informada';
  if (activeLodgeAssoc?.lodge) {
    lodgeText = `${activeLodgeAssoc.lodge.lodge_name} nº ${activeLodgeAssoc.lodge.lodge_number || 'S/N'}`;
  } else if (activeLodgeAssoc) {
    lodgeText = `Loja #${activeLodgeAssoc.lodge_id}`;
  } else if (currentLodgeId) {
    lodgeText = `Loja #${currentLodgeId}`;
  }

  // Determinar forma e data de ingresso na loja atual
  let entryType = 'Não informada';
  const entryDate = activeLodgeAssoc?.start_date || initiationDate || affiliationDate || regularizationDate;

  if (activeLodgeAssoc) {
    // Tenta deduzir pela data
    if (activeLodgeAssoc.start_date === initiationDate) {
      entryType = 'Iniciação';
    } else if (activeLodgeAssoc.start_date === regularizationDate) {
      entryType = 'Regularização';
    } else if (activeLodgeAssoc.start_date === affiliationDate || sortedAssoc.length > 1) {
      entryType = 'Filiação';
    } else {
      entryType = 'Iniciação'; // fallback padrao se for a unica loja e bater a data
    }
  } else {
    // Fallback se não tiver associações no array
    if (initiationDate) entryType = 'Iniciação';
    if (affiliationDate) entryType = 'Filiação';
    if (regularizationDate) entryType = 'Regularização';
  }

  const formattedDate = entryDate ? entryDate.split('-').reverse().join('/') : 'Não informada';

  return (
    <>
      <Card sx={{ height: '260px', bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.4) : 'background.paper', border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, borderRadius: 2 }}>
        <CardContent sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <FingerprintIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
              Registro
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 0, justifyContent: 'center' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`, py: 1.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>LOJA ATUAL</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <StoreIcon sx={{ fontSize: 16, color: 'primary.main' }} /> {lodgeText}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`, py: 1.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>FORMA DE INGRESSO</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                {entryType}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>DATA DO INGRESSO</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                {formattedDate}
              </Typography>
            </Box>
          </Box>

          <Button 
            variant="outlined" 
            size="small"
            color="primary" 
            fullWidth 
            sx={{ mt: 'auto', borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            onClick={() => setModalOpen(true)}
          >
            Ver Histórico Completo
          </Button>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, bgcolor: 'background.paper', backgroundImage: 'none' } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, pb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Histórico de Vínculos</Typography>
          <IconButton onClick={() => setModalOpen(false)} size="small" sx={{ color: 'text.secondary' }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {lodgeAssociations.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={4}>Nenhum histórico encontrado.</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {sortedAssoc.map((assoc, idx) => (
                <Box key={idx} sx={{ p: 2, border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, borderRadius: 2, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                    {assoc.lodge ? `${assoc.lodge.lodge_name} nº ${assoc.lodge.lodge_number || 'S/N'}` : `Loja #${assoc.lodge_id}`} {assoc.status ? `(${assoc.status})` : ''}
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Entrada:</strong> {assoc.start_date ? new Date(assoc.start_date).toLocaleDateString('pt-BR') : '-'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Saída:</strong> {assoc.end_date ? new Date(assoc.end_date).toLocaleDateString('pt-BR') : 'Atual'}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
