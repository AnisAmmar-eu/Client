import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css'; 
import './Login.css'; 

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  const handleConfirmPasswordChange = (event) => {
    setConfirmPassword(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('https://localhost:7212/api/Auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        setSuccess('Inscription réussie ! Vous pouvez maintenant vous connecter.');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          navigate('/login'); 
        }, 2000);
      } else {
        const errorData = await response.json(); 
        setError(errorData.message || 'Une erreur s\'est produite lors de l\'inscription.');
      }
    } catch (error) {
      setError('Impossible de se connecter au serveur pour l\'inscription.');
      console.error('Erreur d\'inscription:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-panel glass-effect"> 
        <h2 className="login-title">Créer un compte</h2>
        <p className="login-subtitle">Rejoignez-nous et commencez à gérer vos projets !</p> 
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        <form onSubmit={handleSubmit} className="login-form"> 
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="votre.email@example.com"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Mot de passe</label> 
            <input
              type="password"
              id="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="Choisissez un mot de passe"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmer le mot de passe</label> 
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              placeholder="Confirmez votre mot de passe"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="glass-button login-button"> 
            {loading ? 'Inscription...' : 'S\'inscrire'}
          </button>
        </form>
        <p className="forgot-password-link" style={{ whiteSpace: 'nowrap' }}>
          Déjà un compte?{' '}
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>
            Se connecter
          </a>
        </p>

      </div>
    </div>
  );
};

export default Register;