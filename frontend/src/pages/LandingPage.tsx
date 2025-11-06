import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  return (
    <div className="landing-page">
      <header className="top-menu">
        <nav>
          <Link to="/login">Login</Link>
        </nav>
      </header>
      <main className="main-content">
        <div className="logo-placeholder">
          <img src="https://via.placeholder.com/500x500?text=Logo" alt="Logo Placeholder" />
        </div>
      </main>
    </div>
  );
};

export default LandingPage;