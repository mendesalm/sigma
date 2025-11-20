import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; // Adjust path as needed
import './LoginPage.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Placeholder for useAuth - will be implemented later
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Placeholder login logic
      await login(email, password);
      navigate('/dashboard'); // Navigate to dashboard on success
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Login failed. Please check your credentials.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-body-wrapper">
      <div className="container">
        <form onSubmit={handleFormSubmit}>
          <h1>Área Restrita</h1>
          <div className="input-box">
            <input
              type="text"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
            {/* <i className='bx bxs-user'></i> */}
          </div>
          <div className="input-box">
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
            />
            {/* <i className='bx bxs-lock-alt'></i> */}
          </div>
          <div className="remember-forgot">
            <label><input type="checkbox" disabled={isLoading} />Lembrar-me</label>
            <Link to="/forgot-password" style={{color: '#fff', textDecoration: 'none'}}>Esqueci a senha</Link>
          </div>
          <button type="submit" className="btn" disabled={isLoading}>
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
          {error && <div className="login-message login-error-message">{error}</div>}
          <div className="register-link">
            <p>Não tem uma conta? <Link to="/register">Solicitar cadastro</Link></p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;