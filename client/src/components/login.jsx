import React, { useState } from 'react';
import './Login.css';
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // Initialize useNavigate

  const handleUsernameChange = (event) => {
    setUsername(event.target.value);
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  const handleRememberMeChange = (event) => {
    setRememberMe(event.target.checked);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('https://localhost:7212/api/Auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Login successful! API response data:', data); // See what API returns
        if (data && data.token) { // Ensure 'data' and 'data.token' exist
          localStorage.setItem('authToken', data.token);
          console.log('authToken stored in localStorage:', localStorage.getItem('authToken')); // Verify storage
          navigate('/project');
        } else {
          console.error('API response missing token:', data);
          setError('Login successful, but token not received.');
        }
      } else if (response.status === 401) {
        setError('Nom d\'utilisateur ou mot de passe incorrect.');
      } else {
        setError('Une erreur s\'est produite lors de la connexion.');
        console.error('Erreur de connexion:', await response.text());
      }
    } catch (error) {
      setError('Impossible de se connecter au serveur.');
      console.error('Erreur de requête:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>Se connecter</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">
              <svg viewBox="0 0 24 24" fill="currentColor" className="icon">
                <path d="M12 4a4 4 0 100 8 4 4 0 000-8zm0 10c4.42 0 8 1.79 8 4v2H4v-2c0-2.21 3.58-4 8-4z" />
              </svg>
              Nom d'utilisateur
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={handleUsernameChange}
              placeholder="Votre nom d'utilisateur"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">
              <svg viewBox="0 0 24 24" fill="currentColor" className="icon">
                <path d="M12 17a2 2 0 01-2-2 2 2 0 012-2 2 2 0 012 2 2 2 0 01-2 2zm6-9c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2h-4zm-8 0c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2H6z" />
              </svg>
              Mot de passe
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="Votre mot de passe"
              required
            />
          </div>
          <div className="form-options">
            <label>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={handleRememberMeChange}
              />
              Se souvenir de moi
            </label>
            <a href="/forgot-password">Mot de passe oublié?</a>
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
        <div className="register-redirect">
          <p>Pas encore de compte ?</p>
          <Link to="/register" className="register-button">S'inscrire ici</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;