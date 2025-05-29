import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { FaTachometerAlt, FaTasks, FaCalendarAlt, FaArchive, FaSignOutAlt, FaProjectDiagram, FaCog } from 'react-icons/fa';
import './MainLayout.css';

const getAuthToken = () => localStorage.getItem('authToken');

const MainLayout = () => {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(!!getAuthToken());

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
        <div className="project-dashboard-container">
            <div className="project-dashboard-wrapper">
                <nav className="project-dashboard-sidebar glass-effect">
                    <div className="sidebar-header">
                        <img
                            src="https://th.bing.com/th/id/OIP.a6fOu0HwF7O5YLpBlnG_awAAAA?cb=iwc2&rs=1&pid=ImgDetMain"
                            alt="App Logo"
                            className="app-logo"
                        />
                    </div>
                    <ul className="sidebar-nav">
                        <li>
                            <NavLink
                                to="/projects"
                                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                            >
                                <FaProjectDiagram className="nav-icon" />
                                Projets
                            </NavLink>
                        </li>
                        <li>
                            <NavLink
                                to="/meetings"
                                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                            >
                                <FaTasks className="nav-icon" />
                                Réunions
                            </NavLink>
                        </li>
                        <li>
                            <NavLink
                                to="/tasks"
                                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                            >
                                <FaTasks className="nav-icon" />
                                Tâches
                            </NavLink>
                        </li>
                        <li>
                            <NavLink
                                to="/calendar"
                                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                            >
                                <FaCalendarAlt className="nav-icon" />
                                Calendrier
                            </NavLink>
                        </li>
                        <li>
                            <NavLink
                                to="/archive"
                                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                            >
                                <FaArchive className="nav-icon" />
                                Archive
                            </NavLink>
                        </li>
                        <div className="sidebar-bottom-section">
                            <li>
                                <NavLink
                                    to="/settings"
                                    className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                                >
                                    <FaCog className="nav-icon" />
                                    <span>Paramètres</span>
                                </NavLink>
                            </li>
                            <li>
                                <button className="nav-link logout-button" onClick={handleLogout}>
                                    <FaSignOutAlt className="nav-icon" />
                                </button>
                            </li>
                        </div>

                    </ul>
                </nav>
                <main className="project-dashboard-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;