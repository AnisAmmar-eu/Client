import React, { useState, useEffect } from 'react';
import './ProjectDashboard.css';
import { useNavigate } from 'react-router-dom';

const ProjectDashboard = () => {
    const [projects, setProjects] = useState([]);
    const [newProjectName, setNewProjectName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [selectedUserIdToAdd, setSelectedUserIdToAdd] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const navigate = useNavigate();

    const getAuthToken = () => localStorage.getItem('authToken');

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        setLoading(true);
        setError('');
        const token = getAuthToken();

        try {
            const response = await fetch('https://localhost:7212/api/Project/projects', {
                headers: {
                    // Envoi le token si dispo, sinon pas d'authorization header
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                }
            });

            if (response.ok) {
                const data = await response.json();
                setProjects(data);
                if (data.length > 0) {
                    setSelectedProjectId(data[0].id);
                }
            } else if (response.status === 401) {
                setError("Non autorisé : connectez-vous pour accéder aux projets.");
                setProjects([]);
            } else {
                setError('Erreur lors de la récupération des projets.');
            }
        } catch (err) {
            setError('Erreur réseau ou du serveur.');
            console.error('Fetch projects error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        const token = getAuthToken();

        if (!token) {
            setError('Vous devez être connecté pour créer un projet.');
            setLoading(false);
            return;
        }

        if (!newProjectName.trim()) {
            setError('Le nom du projet ne peut pas être vide.');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('https://localhost:7212/api/Project', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: newProjectName })
            });

            if (response.ok) {
                setSuccess('Projet créé avec succès !');
                setNewProjectName('');
                fetchProjects();
            } else if (response.status === 401) {
                setError('Non autorisé : connectez-vous pour créer un projet.');
            } else {
                const errorText = await response.text();
                setError(`Erreur lors de la création du projet: ${errorText}`);
            }
        } catch (err) {
            setError('Erreur réseau ou du serveur.');
            console.error('Create project error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchUsers = async () => {
        setLoading(true);
        setError('');
        // Simule une recherche utilisateur (remplace par ta vraie API)
        const dummyUsers = [
            { id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', email: 'alice@example.com' },
            { id: 'f0e9d8c7-b6a5-4321-fedc-ba9876543210', email: 'bob@example.com' },
            { id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890', email: 'christian.lackner@example.com' },
            { id: '7e8f9a0b-1c2d-3e4f-5a6b-7c8d9e0f1a2b', email: 'test@example.com' },
        ];
        setSearchResults(dummyUsers.filter(user => user.email.toLowerCase().includes(searchQuery.toLowerCase())));
        setLoading(false);
    };

    const handleAddParticipant = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        const token = getAuthToken();

        if (!token) {
            setError('Vous devez être connecté pour ajouter un participant.');
            setLoading(false);
            return;
        }

        if (!selectedProjectId || !selectedUserIdToAdd) {
            setError('Veuillez sélectionner un projet et un utilisateur.');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`https://localhost:7212/api/Project/${selectedProjectId}/addParticipant/${selectedUserIdToAdd}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                setSuccess('Participant ajouté avec succès !');
            } else if (response.status === 401) {
                setError('Non autorisé : connectez-vous pour ajouter un participant.');
            } else {
                const errorText = await response.text();
                setError(`Erreur lors de l'ajout du participant: ${errorText}`);
            }
        } catch (err) {
            setError('Erreur réseau ou du serveur.');
            console.error('Add participant error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="project-dashboard-container">
            <div className="top-bar">
                <div className="menu-tabs">
                    <button className="tab-button active" >Initiate</button>
                    <button className="tab-button">Meetings</button>
                    <button className="tab-button">Tasks</button>
                    <button className="tab-button">Archive</button>
                    <button className="tab-button add-tab">+</button>
                </div>
                <div className="user-settings">
                    <button className="icon-button"><i className="fas fa-search"></i></button>
                    <button className="icon-button"><i className="fas fa-cog"></i></button>
                    <button className="icon-button"><i className="fas fa-question-circle"></i></button>
                </div>
            </div>

            <div className="main-content">
                <div className="left-panel">
                    <h3>Projets existants</h3>
                    {loading && <p className="loading-message">Chargement des projets...</p>}
                    {error && <div className="error-message">{error}</div>}
                    <ul className="project-list">
                        {projects.length === 0 && !loading && !error && <p>Aucun projet trouvé.</p>}
                        {projects.map(project => (
                            <li key={project.id} onClick={() => setSelectedProjectId(project.id)}
                                className={selectedProjectId === project.id ? 'active' : ''}>
                                {project.name}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="right-panel">
                    {success && <div className="success-message">{success}</div>}
                    {error && <div className="error-message">{error}</div>}

                    <div className="section create-project-section">
                        <h4>Créer un nouveau projet</h4>
                        <form onSubmit={handleCreateProject}>
                            <div className="form-group">
                                <label htmlFor="projectName">Nom du projet</label>
                                <input
                                    type="text"
                                    id="projectName"
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    placeholder="Ex: Projet Web 2024"
                                />
                            </div>
                            <button type="submit" disabled={loading || !getAuthToken()}>
                                {loading ? 'Création...' : 'Créer le projet'}
                            </button>
                            {!getAuthToken() && <p>Connectez-vous pour créer un projet.</p>}
                        </form>
                    </div>

                    <div className="section add-participant-section">
                        <h4>Ajouter un participant à un projet</h4>
                        <form onSubmit={handleAddParticipant}>
                            <div className="form-group">
                                <label htmlFor="selectProject">Sélectionner un projet</label>
                                <select
                                    id="selectProject"
                                    value={selectedProjectId}
                                    onChange={(e) => setSelectedProjectId(e.target.value)}
                                >
                                    <option value="">-- Choisir un projet --</option>
                                    {projects.map(project => (
                                        <option key={project.id} value={project.id}>{project.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group search-user-group">
                                <label htmlFor="searchUser">Rechercher un utilisateur (Email)</label>
                                <input
                                    type="text"
                                    id="searchUser"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Email de l'utilisateur"
                                />
                                <button type="button" onClick={handleSearchUsers} disabled={loading || !searchQuery.trim()}>
                                    Rechercher
                                </button>
                            </div>

                            {searchResults.length > 0 && (
                                <div className="form-group">
                                    <label htmlFor="selectUser">Sélectionner l'utilisateur</label>
                                    <select
                                        id="selectUser"
                                        value={selectedUserIdToAdd}
                                        onChange={(e) => setSelectedUserIdToAdd(e.target.value)}
                                    >
                                        <option value="">-- Choisir un utilisateur --</option>
                                        {searchResults.map((user) => (
                                            <option key={user.id} value={user.id}>
                                                {user.email}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {searchResults.length === 0 && searchQuery.trim() && !loading && (
                                <p className="no-results">Aucun utilisateur trouvé pour "{searchQuery}".</p>
                            )}

                            <button type="submit" disabled={loading || !selectedProjectId || !selectedUserIdToAdd || !getAuthToken()}>
                                {loading ? 'Ajout...' : 'Ajouter le participant'}
                            </button>
                            {!getAuthToken() && <p>Connectez-vous pour ajouter un participant.</p>}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectDashboard;
