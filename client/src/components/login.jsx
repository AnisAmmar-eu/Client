import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode as jwt_decode } from 'jwt-decode';
import '../App.css';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleUser, setGoogleUser] = useState(null); // État pour l'utilisateur Google
    const navigate = useNavigate();

    // Connexion classique
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('https://localhost:7212/api/Auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('authToken', data.token);
                window.dispatchEvent(new Event('storage'));
                navigate('/projects');
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Échec de la connexion. Vérifiez vos identifiants.');
            }
        } catch (err) {
            setError('Erreur réseau ou serveur. Veuillez réessayer.');
            console.error('Login error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Connexion Google
    const handleGoogleSuccess = async (credentialResponse) => {
        setLoading(true);
        setError('');
        try {
            const decoded = jwt_decode(credentialResponse.credential);
            console.log('Utilisateur Google décodé :', decoded);

            setGoogleUser({
                name: decoded.name || decoded.email.split('@')[0],
                email: decoded.email,
                picture: decoded.picture || null,
            });

            // Envoyer le token Google au backend
            const response = await fetch('https://localhost:7212/api/Auth/google-login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: credentialResponse.credential,
                    email: decoded.email,
                    name: decoded.name || decoded.email.split('@')[0],
                }),
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Token JWT reçu :', data.token);
                localStorage.setItem('authToken', data.token);
                window.dispatchEvent(new Event('storage'));
                navigate('/projects');
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Échec de la validation du token Google.');
            }
        } catch (err) {
            setError('Erreur lors de la connexion avec Google. Veuillez réessayer.');
            console.error('Google login error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleError = () => {
        setLoading(false);
        setError("Échec de la connexion avec Google.");
        console.error('Google login failed');
    };

    return (
        <div className="login-container">
            <div className="login-panel glass-effect">
                <h2 className="login-title">Bienvenue de Retour</h2>
                <p className="login-subtitle">Connectez-vous pour accéder à votre espace.</p>

                {error && <div className="error-message">{error}</div>}

                {/* Formulaire Email/Password */}
                <form onSubmit={handleLogin} className="login-form">
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
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
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="********"
                            required
                        />
                    </div>
                    <button type="submit" disabled={loading} className="glass-button login-button">
                        {loading ? 'Connexion en cours...' : 'Se connecter'}
                    </button>
                </form>

                <p className="forgot-password-link">
                    <a href="#" onClick={(e) => e.preventDefault()}>Mot de passe oublié ?</a>
                </p>

                {/* Google Login */}
                <div className="social-login">
                    <p className="or-text">ou connectez-vous avec</p>
                    <div className="google-login-custom">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={handleGoogleError}
                            theme="outline"
                            shape="rectangular"
                            width="100%"
                        />
                        {googleUser && (
                            <div className="google-user-preview">
                                {googleUser.picture ? (
                                    <img src={googleUser.picture} alt="Profile" className="google-avatar" />
                                ) : (
                                    <div className="google-avatar">{googleUser.name.charAt(0)}</div>
                                )}
                                <span>Se connecter en tant que {googleUser.name}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="register-redirect mt-20">
                    <p>Pas encore de compte ?</p>
                    <br />
                    <button
                        className="glass-button register-button-secondary"
                        onClick={() => navigate('/register')}
                    >
                        S'inscrire
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;