import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import IntroPanel from './IntroPanel';
import '../App.css'; // Assurez-vous que App.css est importé pour les styles généraux et les notifications
import { FaUserPlus, FaInfoCircle } from 'react-icons/fa'; // Icônes pour le nouveau bouton et infos user

const ProjectDashboard = () => {
    // --- States existants ---
    const [projects, setProjects] = useState([]);
    const [newProjectName, setNewProjectName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showContent, setShowContent] = useState(true); // Initialisé à true

    // --- Nouveaux states pour la gestion des utilisateurs ---
    const [users, setUsers] = useState([]); // Liste de tous les utilisateurs
    const [selectedUser, setSelectedUser] = useState(null); // Utilisateur sélectionné pour afficher les détails
    // showUserCreationForm n'est plus nécessaire comme state de bascule pour le panneau de droite.
    // Il gérera seulement l'état du formulaire (initialisé/nettoyé) après soumission si besoin.
    const [newUserName, setNewUserName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');

    const navigate = useNavigate();

    const getAuthToken = () => localStorage.getItem('authToken');
    const getUserId = () => {
        const token = getAuthToken();
        if (token) {
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
                const payload = JSON.parse(jsonPayload);
                return payload.sub;
            } catch (e) {
                console.error("Failed to decode token:", e);
                return null;
            }
        }
        return null;
    };

    // Fonction pour afficher une notification temporaire
    const showNotification = useCallback((message, type) => {
        if (type === 'success') {
            setSuccess(message);
            setError(''); // Clear any previous error
            setTimeout(() => setSuccess(''), 2000); // Clear after 2 seconds
        } else {
            setError(message);
            setSuccess(''); // Clear any previous success
            setTimeout(() => setError(''), 2000); // Clear after 2 seconds
        }
    }, []);

    // --- Define fetch functions BEFORE useEffect ---
    const fetchMyProjects = useCallback(async () => {
        setLoading(true);
        setError('');
        const token = getAuthToken();
        const userId = getUserId();

        if (!token || !userId) {
            showNotification('Non autorisé : connectez-vous pour accéder à vos projets.', 'error');
            setLoading(false);
            navigate('/login');
            return;
        }

        try {
            const response = await fetch(`https://localhost:7212/api/Project/projects`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const fetchedProjects = data.$values || data;
                setProjects(fetchedProjects);
            } else if (response.status === 401) {
                showNotification("Session expirée ou non autorisé. Veuillez vous reconnecter.", 'error');
                localStorage.removeItem('authToken');
                navigate('/login');
            } else {
                showNotification('Erreur lors de la récupération de vos projets.', 'error');
            }
        } catch (err) {
            showNotification('Erreur réseau ou du serveur.', 'error');
            console.error('Fetch my projects error:', err);
        } finally {
            setLoading(false);
        }
    }, [navigate, showNotification]);

    const fetchAllUsers = useCallback(async () => {
        setLoading(true);
        const token = getAuthToken();

        if (!token) {
            showNotification('Non autorisé : connectez-vous pour accéder aux utilisateurs.', 'error');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`https://localhost:7212/api/Project/users`, { // Endpoint pour tous les utilisateurs
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const fetchedUsers = data.$values || data;

                // Tri alphabétique des utilisateurs par fullName, puis par email si fullName est absent
                const sortedUsers = [...fetchedUsers].sort((a, b) => {
                    const nameA = a.fullName || a.email;
                    const nameB = b.fullName || b.email;
                    return nameA.localeCompare(nameB);
                });
                setUsers(sortedUsers);

                // Sélectionne le premier utilisateur par défaut si la liste n'est pas vide et qu'aucun n'est déjà sélectionné
                // La persistance de la sélection manuelle est importante
                if (sortedUsers.length > 0 && !selectedUser) {
                    setSelectedUser(sortedUsers[0]);
                } else if (sortedUsers.length === 0) {
                    setSelectedUser(null); // Si plus d'utilisateurs, désélectionne
                } else if (selectedUser) {
                    // Si un utilisateur était déjà sélectionné, assurez-vous qu'il existe toujours dans la liste mise à jour
                    const foundSelected = sortedUsers.find(user => user.id === selectedUser.id);
                    if (!foundSelected) {
                        // Si l'utilisateur précédemment sélectionné n'existe plus, sélectionne le premier nouveau
                        setSelectedUser(sortedUsers[0]);
                    }
                }

            } else if (response.status === 401) {
                showNotification("Session expirée ou non autorisé. Veuillez vous reconnecter.", 'error');
                localStorage.removeItem('authToken');
                navigate('/login');
            } else {
                showNotification('Erreur lors de la récupération des utilisateurs.', 'error');
            }
        } catch (err) {
            showNotification('Erreur réseau ou du serveur lors de la récupération des utilisateurs.', 'error');
            console.error('Fetch all users error:', err);
        } finally {
            setLoading(false);
        }
    }, [navigate, showNotification, selectedUser]); // Ajouté selectedUser aux dépendances

    // --- Fetch initial data (projects and all users) ---
    useEffect(() => {
        const token = getAuthToken();
        if (!token) {
            navigate('/login');
        } else {
            fetchMyProjects();
            fetchAllUsers(); // Fetch all users on component mount and handle initial selection
        }
    }, [navigate, fetchMyProjects, fetchAllUsers]);


    // --- Handlers existants (avec notifications) ---
    const handleCreateProject = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        const token = getAuthToken();

        if (!token) {
            showNotification('Vous devez être connecté pour créer un projet.', 'error');
            setLoading(false);
            navigate('/login');
            return;
        }

        if (!newProjectName.trim()) {
            showNotification('Le nom du projet ne peut pas être vide.', 'error');
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
                showNotification('Projet créé avec succès !', 'success');
                setNewProjectName('');
                await fetchMyProjects();
                setShowContent(true);
            } else if (response.status === 401) {
                showNotification('Session expirée ou non autorisé. Veuillez vous reconnecter.', 'error');
                localStorage.removeItem('authToken');
                navigate('/login');
            } else {
                const errorText = await response.text();
                showNotification(`Erreur lors de la création du projet: ${errorText}`, 'error');
            }
        } catch (err) {
            showNotification('Erreur réseau ou du serveur.', 'error');
            console.error('Create project error:', err);
        } finally {
            setLoading(false);
        }
    };

    // --- Nouveaux Handlers pour les utilisateurs ---

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        const token = getAuthToken();

        if (!token) {
            showNotification('Vous devez être connecté pour créer un utilisateur.', 'error');
            setLoading(false);
            return;
        }

        if (!newUserName.trim() || !newUserEmail.trim()) {
            showNotification('Veuillez remplir tous les champs pour créer un utilisateur.', 'error');
            setLoading(false);
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUserEmail)) {
            showNotification('Veuillez entrer une adresse email valide.', 'error');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('https://localhost:7212/api/Auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // L'admin qui crée l'utilisateur doit être authentifié
                },
                body: JSON.stringify({
                    fullName: newUserName,
                    email: newUserEmail,
                })
            });

            if (response.ok) {
                showNotification('Utilisateur créé avec succès !', 'success');
                setNewUserName('');
                setNewUserEmail('');
                setNewUserPassword('');
                fetchAllUsers(); // Rafraîchir la liste des utilisateurs
            } else if (response.status === 409) { // Conflict for existing user
                showNotification('Un utilisateur avec cet email existe déjà.', 'error');
            } else if (response.status === 401) {
                showNotification('Non autorisé : vous n\'avez pas la permission de créer des utilisateurs.', 'error');
                localStorage.removeItem('authToken');
                navigate('/login');
            }
            else {
                const errorText = await response.text();
                showNotification(`Erreur lors de la création de l'utilisateur: ${errorText}`, 'error');
            }
        } catch (err) {
            showNotification('Erreur réseau ou du serveur lors de la création de l\'utilisateur.', 'error');
            console.error('Create user error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Fonction pour afficher le contenu détaillé ou l'intro
    const renderContent = () => {
        if (!showContent && projects.length === 0 && !loading && !error) {
            return (
                <IntroPanel
                    title="Gérez vos Projets"
                    subtitle="Créez et organisez tous vos projets importants. Commencez par ajouter votre premier projet !"
                    imageUrl="/images/project_icon.png"
                    buttonText="Créer mon premier projet"
                    onButtonClick={() => {
                        setShowContent(true);
                    }}
                />
            );
        }

        // Sinon, affichez le contenu normal de ProjectDashboard avec 3 panneaux
        return (
            <div className="main-content three-column-layout">
                {/* Left Panel: Création Projet & Vos Projets Créés */}
                <div className="left-panel glass-effect">
                    <div className="glassy-card mb-20">
                        <h4>Créer un nouveau projet</h4>
                        <form onSubmit={handleCreateProject}>
                            <div className="form-group">
                                <label htmlFor="projectName">Nom du projet</label>
                                <input
                                    type="text"
                                    id="projectName"
                                    name="projectName"
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    placeholder="Ex: Projet de refonte UX"
                                    required
                                />
                            </div>
                            <button type="submit" disabled={loading || !getAuthToken()} className="glass-button">
                                {loading ? 'Création...' : 'Créer le projet'}
                            </button>
                            {!getAuthToken() && <p className="auth-hint">Connectez-vous pour créer un projet.</p>}
                        </form>
                    </div>

                    <h3>Vos Projets Créés</h3>
                    {loading && <p className="loading-message">Chargement de vos projets...</p>}
                    {error && <div className="error-message">{error}</div>}
                    <ul className="custom-list project-list">
                        {projects.length === 0 && !loading && !error ? (
                            <p className="no-items-message">Vous n'avez créé aucun projet.</p>
                        ) : (
                            projects.map(project => (
                                <li key={project.id}>
                                    {project.name}
                                </li>
                            ))
                        )}
                    </ul>
                </div>

                {/* Middle Panel: Liste des Utilisateurs ET Détails Utilisateur */}
                <div className="middle-panel glass-effect">
                    <h3>Liste des Utilisateurs</h3>
                    {loading && <p className="loading-message">Chargement des utilisateurs...</p>}
                    {error && <div className="error-message">{error}</div>}
                    <ul className="custom-list user-list mb-20"> {/* Ajout de mb-20 pour espacer la liste et les détails */}
                        {users.length === 0 && !loading && !error ? (
                            <p className="no-items-message">Aucun utilisateur trouvé.</p>
                        ) : (
                            users.map(user => (
                                <li
                                    key={user.id}
                                    onClick={() => setSelectedUser(user)} // Met à jour l'utilisateur sélectionné
                                    className={selectedUser && selectedUser.id === user.id ? 'active' : ''}
                                >
                                    {user.fullName || user.email}
                                </li>
                            ))
                        )}
                    </ul>

                    {/* Détails de l'utilisateur sélectionné (directement en dessous de la liste) */}
                    {selectedUser && (
                        <div className="glassy-card user-detail-card">
                            <h4><FaInfoCircle style={{ marginRight: '10px' }} /> Détails de l'utilisateur</h4>
                            <p><strong>Nom Complet:</strong> {selectedUser.fullName || 'N/A'}</p>
                            <p><strong>Email:</strong> {selectedUser.email}</p>
                            {/* Le bouton "Fermer les détails" n'est plus utile ici, car il reste toujours affiché */}
                            {/* <button onClick={() => setSelectedUser(null)} className="glass-button full-width" style={{ marginTop: '15px' }}>
                                Fermer les détails
                            </button> */}
                        </div>
                    )}
                    {!selectedUser && users.length > 0 && (
                        <p className="no-selection-message glassy-card">Sélectionnez un utilisateur pour voir ses détails.</p>
                    )}
                </div>

                {/* Right Panel: Création Utilisateur uniquement */}
                <div className="right-panel glass-effect">
                    <div className="glassy-card user-creation-form">
                        <h4>Créer un nouvel utilisateur</h4>
                        <form onSubmit={handleCreateUser}>
                            <div className="form-group">
                                <label htmlFor="newUserName">Nom Complet</label>
                                <input
                                    type="text"
                                    id="newUserName"
                                    value={newUserName}
                                    onChange={(e) => setNewUserName(e.target.value)}
                                    placeholder="Nom et prénom"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="newUserEmail">Email</label>
                                <input
                                    type="email"
                                    id="newUserEmail"
                                    value={newUserEmail}
                                    onChange={(e) => setNewUserEmail(e.target.value)}
                                    placeholder="email@example.com"
                                    required
                                />
                            </div>

                            <button type="submit" disabled={loading || !getAuthToken()} className="glass-button">
                                {loading ? 'Création...' : 'Créer l\'utilisateur'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="project-dashboard-container">
            {success && <div className="notification success">{success}</div>}
            {error && <div className="notification error">{error}</div>}
            {renderContent()}
        </div>
    );
};

export default ProjectDashboard;