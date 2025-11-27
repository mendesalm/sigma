import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import SuperAdminHome from './SuperAdminHome';
import { Navigate } from 'react-router-dom';

const DashboardHome: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (user.user_type === 'super_admin') {
    return <SuperAdminHome />;
  }

  if (user.user_type === 'webmaster') {
    return <Navigate to="/dashboard/lodge-dashboard" />;
  }
  
  if (user.user_type === 'member') {
      return <Navigate to="/dashboard/member-dashboard" />;
  }

  return <div>Bem-vindo! Selecione uma opção no menu.</div>;
};

export default DashboardHome;
