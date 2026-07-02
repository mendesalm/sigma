import React from 'react';
import { Box, keyframes } from '@mui/material';

const pulseAura = keyframes`
  0% { transform: scale(1) translate(0, 0); opacity: 0.5; }
  33% { transform: scale(1.1) translate(2%, -2%); opacity: 0.7; }
  66% { transform: scale(0.9) translate(-2%, 2%); opacity: 0.6; }
  100% { transform: scale(1) translate(0, 0); opacity: 0.5; }
`;

const pulseAura2 = keyframes`
  0% { transform: scale(1) translate(0, 0); opacity: 0.4; }
  33% { transform: scale(0.9) translate(-2%, 2%); opacity: 0.6; }
  66% { transform: scale(1.1) translate(2%, -2%); opacity: 0.7; }
  100% { transform: scale(1) translate(0, 0); opacity: 0.4; }
`;

const PlansBackground: React.FC = () => {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none',
        overflow: 'hidden',
        backgroundColor: '#0B0F19',
      }}
    >
      {/* Blue Aura */}
      <Box
        sx={{
          position: 'absolute',
          top: '10%',
          left: '0%',
          width: '70vw',
          height: '70vw',
          background: 'radial-gradient(circle, rgba(0, 176, 255, 0.35) 0%, rgba(0, 176, 255, 0) 60%)',
          borderRadius: '50%',
          animation: `${pulseAura} 15s infinite ease-in-out`,
          filter: 'blur(50px)',
        }}
      />
      
      {/* Gold Aura */}
      <Box
        sx={{
          position: 'absolute',
          bottom: '0%',
          right: '-10%',
          width: '80vw',
          height: '80vw',
          background: 'radial-gradient(circle, rgba(255, 215, 0, 0.25) 0%, rgba(255, 215, 0, 0) 60%)',
          borderRadius: '50%',
          animation: `${pulseAura2} 18s infinite ease-in-out`,
          filter: 'blur(60px)',
        }}
      />
    </Box>
  );
};

export default PlansBackground;
