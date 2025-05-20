import React, { useState } from 'react';
import './Login.css'; // On réutilise le même fichier CSS pour le design général

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

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
      const response = await fetch('https://localhost:7212/api/Auth/register', { // Adaptez l'URL de votre API d'enregistrement
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }), // Votre API attend un objet User avec Email et Password
      });

      if (response.ok) {
        setSuccess('Inscription réussie ! Vous pouvez maintenant vous connecter.');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        // Optionnel: Rediriger l'utilisateur vers la page de connexion après un délai
        setTimeout(() => {
          window.location.href = '/login'; // Assurez-vous que cette route existe
        }, 2000);
      } else {
        const errorData = await response.text(); // Utilisez text() pour un message d'erreur simple, ou json() si l'API retourne un objet
        setError(errorData || 'Une erreur s\'est produite lors de l\'inscription.');
      }
    } catch (error) {
      setError('Impossible de se connecter au serveur pour l\'inscription.');
      console.error('Erreur d\'inscription:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container"> {/* On réutilise le conteneur de style */}
      <div className="login-form"> {/* On réutilise la classe de formulaire */}
        <h2>Créer un compte</h2>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>} {/* Message de succès */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">
              <svg viewBox="0 0 24 24" fill="currentColor" className="icon">
                <path d="M12 12c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-10c-5.52 0-10 4.48-10 10s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
              </svg>
              Email
            </label>
            <input
              type="email" // <--- C'est important !
              id="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="Votre email"
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
              placeholder="Choisissez un mot de passe"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">
              <svg viewBox="0 0 24 24" fill="currentColor" className="icon">
                <path d="M12 17a2 2 0 01-2-2 2 2 0 012-2 2 2 0 012 2 2 2 0 01-2 2zm6-9c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2h-4zm-8 0c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2H6z" />
              </svg>
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              placeholder="Confirmez votre mot de passe"
              required
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Inscription...' : 'S\'inscrire'}
          </button>
        </form>
        <div className="register-redirect">
          <p>Déjà un compte? </p>
          <button
            className="register-button"
            onClick={() => window.location.href = '/login'}
          >
            Se connecter
          </button>

        </div>
      </div>
    </div>
  );
};

export default Register;