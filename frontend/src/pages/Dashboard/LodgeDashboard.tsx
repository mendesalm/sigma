import React from 'react';
import { Grid, Card, CardActionArea, CardContent, Typography, CardMedia, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

// Import images
import SecretarioIcon from '../../assets/images/icones/Secretario-D.png';
import TesoureiroIcon from '../../assets/images/icones/Tesoureiro-D.png';
import ChancelerIcon from '../../assets/images/icones/Chanceler-D.png';
import BibliotecaIcon from '../../assets/images/icones/Biblioteca-D.png';
import HarmoniaIcon from '../../assets/images/icones/Harmonia-D.png';
import OradorIcon from '../../assets/images/icones/Orador-D.png';
import ArquitetoIcon from '../../assets/images/icones/Arquiteto-D.png';

const menuItems = [
  { title: 'Secretaria', icon: SecretarioIcon, path: '/dashboard/management/members' },
  { title: 'Tesouraria', icon: TesoureiroIcon, path: '/dashboard/financial' },
  { title: 'Chancelaria', icon: ChancelerIcon, path: '/dashboard/attendance' },
  { title: 'Biblioteca', icon: BibliotecaIcon, path: '/dashboard/library' },
  { title: 'Harmonia', icon: HarmoniaIcon, path: '/dashboard/harmony' },
  { title: 'Oratória', icon: OradorIcon, path: '/dashboard/oratory' },
  { title: 'Arquitetura', icon: ArquitetoIcon, path: '/dashboard/architecture' },
];

const LodgeDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, color: 'text.primary', fontWeight: 'bold' }}>
        Painel da Loja
      </Typography>
      <Grid container spacing={4}>
        {menuItems.map((item) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={item.title}>
            <Card sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: 6,
              },
              bgcolor: 'background.paper',
              borderRadius: 2
            }}>
              <CardActionArea onClick={() => navigate(item.path)} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
                <CardMedia
                  component="img"
                  image={item.icon}
                  alt={item.title}
                  sx={{ width: 120, height: 120, objectFit: 'contain', mb: 2 }}
                />
                <CardContent>
                  <Typography gutterBottom variant="h5" component="div" align="center" sx={{ fontWeight: 'medium' }}>
                    {item.title}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default LodgeDashboard;
