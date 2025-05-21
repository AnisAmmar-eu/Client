// src/components/MainLayout.js
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import './MainLayout.css'; // Specific CSS for the layout
import '../App.css'; // Import global glassy theme CSS

const getAuthToken = () => localStorage.getItem('authToken');

const MainLayout = () => {
    const navigate = useNavigate();
    const location = useLocation(); // Hook to get current path for active tab
    const [isLoggedIn, setIsLoggedIn] = useState(!!getAuthToken());

    // Effect to check authentication status on load and on storage changes
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

    // Redirect if not logged in
    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/login');
        }
    }, [isLoggedIn, navigate]);


    const handleLogout = () => {
        localStorage.removeItem('authToken');
        setIsLoggedIn(false); // Update state to trigger redirect
        // navigate('/login'); // This will be handled by the useEffect above
    };

    // If not logged in, don't render the layout (the useEffect will redirect)
    if (!isLoggedIn) {
        return null;
    }

    return (
        <div className="app-container">
            {/* Left Fixed Navbar - Apply glassy effect */}
            <nav className="left-navbar glass-effect">
                <div className="navbar-header">
                    {/* Placeholder for your actual logo */}
                    <img src="/logo.png" alt="App Logo" className="app-logo" />
                    {/* Make sure you place your logo file in the 'public' folder, e.g., 'public/logo.png' */}
                    <h2>Meeting Planner</h2>
                </div>
                <ul className="nav-list">
                    {/* Navigation Items */}
                    <li className={`nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}>
                        <button onClick={() => navigate('/dashboard')}>
                            <i className="fas fa-chart-line"></i> {/* Example icon */}
                            <span>Dashboard</span>
                        </button>
                    </li>
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
                    {/* Add more navigation items as needed */}
                    <li className="nav-item-divider"></li> {/* Visual separator */}
                     <li className={`nav-item ${location.pathname === '/archive' ? 'active' : ''}`}>
                        <button onClick={() => navigate('/archive')}>
                            <i className="fas fa-archive"></i>
                            <span>Archive</span>
                        </button>
                    </li>
                </ul>

                <div className="navbar-footer">
                    <button className="nav-item" onClick={handleLogout}>
                        <i className="fas fa-sign-out-alt"></i>
                        <span>Déconnexion</span>
                    </button>
                </div>
            </nav>

            {/* Main Content Area - This is where specific dashboard components will render */}
            <main className="main-content-area">
                {/* <Outlet> renders the child route component defined in App.js */}
                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;