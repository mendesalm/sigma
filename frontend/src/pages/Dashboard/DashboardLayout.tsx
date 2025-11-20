import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import './DashboardLayout.css';

const DashboardLayout: React.FC = () => {
  return (
    <div className="dashboard-layout">
      <Header />
      <div className="dashboard-main">
        <aside className="dashboard-sidebar">
          {/* Add sidebar navigation links here */}
          <ul>
            <li><a href="/dashboard">Home</a></li>
            <li><a href="/dashboard/management/obediences">Obediences</a></li>
            <li><a href="/dashboard/management/lodges">Lodges</a></li>
            <li><a href="/dashboard/management/members">Members</a></li>
            <li><a href="/dashboard/management/super-admins">Super Admins</a></li>
          </ul>
        </aside>
        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default DashboardLayout;
