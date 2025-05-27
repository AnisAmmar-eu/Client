// src/components/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css'; // For global glassy styles
import './Login.css'; // For login-specific styles

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

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
                localStorage.setItem('authToken', data.token); // Store the token
                window.dispatchEvent(new Event('storage')); // Trigger storage event
                navigate('/projects'); // Redirect to dashboard
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Échec de la connexion. Veuillez vérifier vos identifiants.');
            }
        } catch (err) {
            setError('Erreur réseau ou du serveur. Veuillez réessayer.');
            console.error('Login error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-panel glass-effect">
                <h2 className="login-title">Bienvenue de Retour</h2>
                <p className="login-subtitle">Connectez-vous pour accéder à votre espace.</p>
                {error && <div className="error-message">{error}</div>}
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
                    <a href="#" onClick={(e) => { e.preventDefault(); }}>Mot de passe oublié ?</a>
                </p>

                <div className="register-redirect mt-20"> 
                    <p>Pas encore de compte ?</p>
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