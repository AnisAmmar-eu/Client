// src/components/AuthCallback.js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';

const AuthCallback = () => {
    const { isLoading, isAuthenticated, user, getIdTokenClaims } = useAuth0();
    const navigate = useNavigate();

    useEffect(() => {
        const handleRedirect = async () => {
            if (isAuthenticated && user) {
                const claims = await getIdTokenClaims();
                const token = claims.__raw;
                localStorage.setItem('authToken', token);
                window.dispatchEvent(new Event('storage'));
                navigate('/projects');
            }
        };

        handleRedirect();
    }, [isAuthenticated, user, navigate, getIdTokenClaims]);

    return isLoading ? <div>Chargement...</div> : null;
};

export default AuthCallback;
