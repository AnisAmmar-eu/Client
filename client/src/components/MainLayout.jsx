import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import './MainLayout.css'; 
import '../App.css'; 
import '@fortawesome/fontawesome-free/css/all.min.css';


const getAuthToken = () => localStorage.getItem('authToken');

const MainLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isLoggedIn, setIsLoggedIn] = useState(!!getAuthToken());
    const [showSettings, setShowSettings] = useState(false);


    useEffect(() => {
        const token = getAuthToken();
        if (!token) {
            setIsLoggedIn(false);
            navigate('/login');
        } else {
            setIsLoggedIn(true);
        }

        const handleStorageChange = () => {
            setIsLoggedIn(!!getAuthToken());
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [navigate]);

    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/login');
        }
    }, [isLoggedIn, navigate]);


    const handleLogout = () => {
        localStorage.removeItem('authToken');
        setIsLoggedIn(false);
        navigate('/login');
    };

    if (!isLoggedIn) {
        return null;
    }

    return (
        <div className="app-container">
            <nav className="left-navbar glass-effect">
                <div className="navbar-header">
                    <img src="https://th.bing.com/th/id/OIP.a6fOu0HwF7O5YLpBlnG_awAAAA?cb=iwc2&rs=1&pid=ImgDetMain" alt="App Logo" className="app-logo" />
                </div>
                <ul className="nav-list">
                    <li className={`nav-item ${location.pathname === '/projects' ? 'active' : ''}`}>
                        <button onClick={() => navigate('/projects')}>
                            <i className="fas fa-project-diagram"></i>
                            <span>Projets</span>
                        </button>
                    </li>
                    <li className={`nav-item ${location.pathname === '/meetings' ? 'active' : ''}`}>
                        <button onClick={() => navigate('/meetings')}>
                            <i className="fas fa-handshake"></i>
                            <span>Réunions</span>
                        </button>
                    </li>
                    <li className={`nav-item ${location.pathname === '/tasks' ? 'active' : ''}`}>
                        <button onClick={() => navigate('/tasks')}>
                            <i className="fas fa-tasks"></i>
                            <span>Tâches</span>
                        </button>
                    </li>
                    <li className={`nav-item ${location.pathname === '/calendar' ? 'active' : ''}`}>
                        <button onClick={() => navigate('/calendar')}>
                            <i className="fas fa-calendar-alt"></i>
                            <span>Calendrier</span>
                        </button>
                    </li>
                    <li className="nav-item-divider"></li>
                    <li className={`nav-item ${location.pathname === '/archive' ? 'active' : ''}`}>
                        <button onClick={() => navigate('/archive')}>
                            <i className="fas fa-archive"></i>
                            <span>Archive</span>
                        </button>
                    </li>

                </ul>

<div className="navbar-footer">
    <div className="nav-footer-buttons">
                {/* Bouton de déconnexion */}
        <button className="nav-item" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i>
        </button>
        {/* Bouton paramètres avec menu déroulant */}
        <div className="settings-wrapper">
            <button className="nav-item" onClick={() => setShowSettings(prev => !prev)}>
                <i className="fas fa-cog"></i>
            </button>
            {showSettings && (
                <ul className="settings-menu">
                    <li onClick={() => { navigate('/profile'); setShowSettings(false); }}>Modifier le profil</li>
                    <li onClick={() => { navigate('/participants'); setShowSettings(false); }}>Gestion des participants</li>
                </ul>
            )}
        </div>


    </div>
</div>


            </nav>

            <main className="main-content-area">
                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;