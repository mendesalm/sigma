import React, { useEffect, useState } from 'react';
import { Typography, Box, CircularProgress } from '@mui/material';
import { getMembers, Member } from '../services/memberService';
import OnboardingGuide from '../components/dashboard/OnboardingGuide';

const WebmasterDashboardPage: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const data = await getMembers(0, 5); // Just need to know if there are any
        setMembers(data);
      } catch (error) {
        console.error('Failed to fetch members', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  // If there are no members (or very few), show the onboarding guide
  if (members.length <= 1) {
    return <OnboardingGuide />;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Painel do Webmaster
      </Typography>
      {/* Future dashboard widgets go here */}
      <Typography variant="body1">
        Bem-vindo ao painel de controle da sua Loja.
      </Typography>
    </Box>
  );
};

export default WebmasterDashboardPage;
