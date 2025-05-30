import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import IntroPanel from './IntroPanel';
import './ProjectDashboard.css';
import { FaUserPlus, FaInfoCircle, FaFileExcel, FaProjectDiagram, FaChevronDown, FaChevronUp, FaTimes, FaCheck } from 'react-icons/fa';
import { Plus } from "lucide-react";
const ProjectDashboard = () => {
    const [projects, setProjects] = useState([]);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDescription, setNewProjectDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showContent, setShowContent] = useState(true);

    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [newUserName, setNewUserName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [excelFile, setExcelFile] = useState(null);

    const [showCreateUserForm, setShowCreateUserForm] = useState(false);
    const [showUploadExcelForm, setShowUploadExcelForm] = useState(false);
    const [showUserDetails, setShowUserDetails] = useState(false);

    const [userProjectCounts, setUserProjectCounts] = useState([]);

    const navigate = useNavigate();

    const getAuthToken = () => localStorage.getItem('authToken');
    const getUserId = () => {
        const token = getAuthToken();
        if (token) {
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
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

    const showNotification = useCallback((message, type) => {
        if (type === 'success') {
            setSuccess(message);
            setError('');
            setTimeout(() => setSuccess(''), 2000);
        } else {
            setError(message);
            setSuccess('');
            setTimeout(() => setError(''), 2000);
        }
    }, []);

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
                await fetchMeetingCountByProject(fetchedProjects);
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
        const currentUserId = getUserId();

        if (!token) {
            showNotification('Non autorisé : connectez-vous pour accéder aux utilisateurs.', 'error');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`https://localhost:7212/api/Project/users`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                let fetchedUsers = data.$values || data;

                if (currentUserId) {
                    fetchedUsers = fetchedUsers.filter(user => user.id !== currentUserId);
                }

                const sortedUsers = [...fetchedUsers].sort((a, b) => {
                    const nameA = a.fullName || a.email;
                    const nameB = b.fullName || b.email;
                    return nameA.localeCompare(nameB);
                });
                setUsers(sortedUsers);
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
    }, [navigate, showNotification]);

    const fetchMeetingCountByProject = async (fetchedProjects) => {
        const token = getAuthToken();
        if (!token) {
            showNotification('Non autorisé : connectez-vous pour accéder aux statistiques.', 'error');
            return;
        }

        try {
            const response = await fetch(`https://localhost:7212/api/Meeting/count-by-project`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const meetingCounts = await response.json();
                const projectsWithCounts = fetchedProjects.map(project => {
                    const countData = meetingCounts.find(count => count.ProjectId === project.id);
                    return {
                        ...project,
                        meetingCount: countData ? countData.MeetingCount : 0,
                        creationDate: project.creationDate
                    };
                });
                setProjects(projectsWithCounts);
            } else if (response.status === 401) {
                showNotification("Session expirée ou non autorisé. Veuillez vous reconnecter.", 'error');
                localStorage.removeItem('authToken');
                navigate('/login');
            } else {
                showNotification('Erreur lors de la récupération des statistiques des réunions.', 'error');
            }
        } catch (err) {
            showNotification('Erreur réseau ou du serveur lors de la récupération des statistiques.', 'error');
            console.error('Fetch meeting counts error:', err);
        }
    };

    const fetchUserProjectCounts = useCallback(async () => {
        setLoading(true);
        const token = getAuthToken();

        if (!token) {
            showNotification('Non autorisé : connectez-vous pour accéder aux statistiques.', 'error');
            setLoading(false);
            navigate('/login');
            return;
        }

        try {
            const response = await fetch(`https://localhost:7212/api/Project/user-project-counts`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setUserProjectCounts(data);
            } else if (response.status === 401) {
                showNotification("Session expirée ou non autorisé. Veuillez vous reconnecter.", 'error');
                localStorage.removeItem('authToken');
                navigate('/login');
            } else {
                showNotification('Erreur lors de la récupération des statistiques des projets par utilisateur.', 'error');
            }
        } catch (err) {
            showNotification('Erreur réseau ou du serveur lors de la récupération des statistiques.', 'error');
            console.error('Fetch user project counts error:', err);
        } finally {
            setLoading(false);
        }
    }, [navigate, showNotification]);

    useEffect(() => {
        const token = getAuthToken();
        if (!token) {
            navigate('/login');
        } else {
            fetchMyProjects();
            fetchAllUsers();
            fetchUserProjectCounts();
        }
    }, [navigate, fetchMyProjects, fetchAllUsers, fetchUserProjectCounts]);

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
                body: JSON.stringify({ name: newProjectName, description: newProjectDescription })
            });

            if (response.ok) {
                showNotification('Projet créé avec succès !', 'success');
                setNewProjectName('');
                setNewProjectDescription('');
                await fetchMyProjects();
                setShowContent(true);
                fetchUserProjectCounts();
            } else if (response.status === 401) {
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

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        const token = getAuthToken();

        if (!token) {
            setLoading(false);
            return;
        }

        if (!newUserName.trim() || !newUserEmail.trim()) {
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
                    'Authorization': `Bearer ${token}`
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
                fetchAllUsers();
                fetchUserProjectCounts();
                setShowCreateUserForm(false);
            } else if (response.status === 409) {
                showNotification('Un utilisateur avec cet email existe déjà.', 'error');
            } else if (response.status === 401) {
                localStorage.removeItem('authToken');
                navigate('/login');
            } else {
                const errorText = await response.text();
                showNotification(`Erreur lors de la création de l'utilisateur: ${errorText}`, 'error');
            }
        } catch (err) {
            console.error('Create user error:', err);
            showNotification('Erreur réseau ou du serveur lors de la création de l\'utilisateur.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        setExcelFile(e.target.files[0]);
    };

    const handleUploadExcelUsers = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        const token = getAuthToken();
        if (!token) {
            setLoading(false);
            navigate('/login');
            return;
        }

        if (!excelFile) {
            showNotification('Veuillez sélectionner un fichier Excel.', 'error');
            setLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append('file', excelFile);

        try {
            const response = await fetch('https://localhost:7212/api/Project/uploadUsers', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });

            if (response.ok) {
                const result = await response.json();
                showNotification(`Importation réussie. Créés: ${result.createdCount}, Mis à jour: ${result.updatedCount}, Erreurs: ${result.errorCount}`, 'success');
                setExcelFile(null);
                document.getElementById('excelFileInput').value = '';
                fetchAllUsers();
                fetchUserProjectCounts();
                setShowUploadExcelForm(false);
            } else if (response.status === 400) {
                const errorData = await response.json();
                const errorMessage = errorData.message || errorData.Message || 'Erreur lors du traitement du fichier Excel.';
                showNotification(errorMessage, 'error');
                console.error('Excel upload error:', errorData);
            } else if (response.status === 401 || response.status === 403) {
                showNotification("Session expirée ou non autorisé. Veuillez vous reconnecter.", 'error');
                localStorage.removeItem('authToken');
                navigate('/login');
            } else {
                const errorText = await response.text();
                showNotification(`Erreur lors de l'importation du fichier Excel: ${errorText}`, 'error');
                console.error('Excel upload generic error:', errorText);
            }
        } catch (err) {
            showNotification('Erreur réseau ou du serveur lors de l\'importation.', 'error');
            console.error('Excel upload network error:', err);
        } finally {
            setLoading(false);
        }
    };

    const getUserAvatar = (user) => {
        const name = user.fullName || user.email;
        const initial = name ? name.charAt(0).toUpperCase() : '?';
        return (
            <div className="user-avatar">
                {initial}
            </div>
        );
    };

    const handleUserClick = (user) => {
        setSelectedUser(user);
        setShowUserDetails(true);
        setShowCreateUserForm(false); // Close other forms when user details are shown
        setShowUploadExcelForm(false);
    };

    const closeForms = () => {
        setShowCreateUserForm(false);
        setShowUploadExcelForm(false);
        setShowUserDetails(false);
        setSelectedUser(null);
        setNewUserName(''); // Clear input fields
        setNewUserEmail('');
        setExcelFile(null);
        if (document.getElementById('excelFileInput')) {
            document.getElementById('excelFileInput').value = '';
        }
    };

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

        const totalProjects = userProjectCounts.reduce((sum, user) => sum + user.ProjectCount, 0);
        const totalUsers = userProjectCounts.length;

        const chartLabels = userProjectCounts.map(user => user.FullName || user.Email);
        const chartData = userProjectCounts.map(user => user.ProjectCount);

        return (
            <div className="project-dashboard-main-content">
                <div className="project-dashboard-panel project-dashboard-left-panel glass-effect">
                    <div className="project-dashboard-card mb-20">
                        <div className="project-header">
                            <h3>Créer un nouveau projet</h3>
                            <Plus
                                size={20}
                                className="add-item-button"
                                title="Créer le projet"
                                onClick={handleCreateProject}
                                style={{
                                    cursor: loading || !getAuthToken() || newProjectName.trim() === '' ? 'not-allowed' : 'pointer',
                                    opacity: loading || !getAuthToken() || newProjectName.trim() === '' ? 0.5 : 1,
                                }}
                            />
                        </div>



                        <form onSubmit={handleCreateProject}>
                            <div className="project-dashboard-form-group">
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
                            <div className="project-dashboard-form-group">
                                <label htmlFor="projectDescription">Description</label>
                                <textarea
                                    id="projectDescription"
                                    name="projectDescription"
                                    value={newProjectDescription}
                                    onChange={(e) => setNewProjectDescription(e.target.value)}
                                    placeholder="Décrivez votre projet en quelques mots..."
                                    rows="3"
                                ></textarea>
                            </div>

                            {!getAuthToken() && <p className="project-dashboard-auth-hint">Connectez-vous pour créer un projet.</p>}
                        </form>

                        {loading && <p className="project-dashboard-loading-message">Chargement de vos projets...</p>}
                        {error && <div className="project-dashboard-error-message">{error}</div>}
                        <div className="project-dashboard-project-list-wrapper">
                            <h3>Mes Projets ({projects.length})</h3>
                            <ul className="project-dashboard-list project-list">
                                {projects.length === 0 && !loading && !error ? (
                                    <p className="project-dashboard-no-items-message">Vous n'avez créé aucun projet.</p>
                                ) : (
                                    projects.map(project => (
                                        <li key={project.id} className="project-dashboard-list-item project-item">
                                            <div className="project-item-layout">
                                                <div className="project-item-left">
                                                    <h4 className="project-name">{project.name}</h4>
                                                    {project.description && (
                                                        <p className="project-description">{project.description}</p>
                                                    )}
                                                </div>
                                                <div className="project-item-center">
                                                    {project.createdAt && (
                                                        <p className="project-date">
                                                            Créé le: {new Date(project.createdAt).toLocaleDateString('fr-FR', {
                                                                year: 'numeric',
                                                                month: 'long',
                                                                day: 'numeric',
                                                            })}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="project-item-right">
                                                    <span className="meeting-count">{project.meetingCount || 0} réunions</span>
                                                </div>
                                            </div>
                                        </li>
                                    ))
                                )}
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="project-dashboard-right-section">
                    <div className="project-dashboard-panel project-dashboard-middle-panel glass-effect">
                        <div className="project-dashboard-users-header">
                            <h3>Liste des Utilisateurs</h3>
                            <div className="project-dashboard-user-actions">
                                <FaUserPlus
                                    className={`project-dashboard-action-icon ${showCreateUserForm ? 'active' : ''}`}
                                    onClick={() => {
                                        setShowCreateUserForm(!showCreateUserForm);
                                        setShowUploadExcelForm(false);
                                        setShowUserDetails(false);
                                        setSelectedUser(null);
                                    }}
                                    title="Créer un nouvel utilisateur"
                                />
                                <FaFileExcel
                                    className={`project-dashboard-action-icon ${showUploadExcelForm ? 'active' : ''}`}
                                    onClick={() => {
                                        setShowUploadExcelForm(!showUploadExcelForm);
                                        setShowCreateUserForm(false);
                                        setShowUserDetails(false);
                                        setSelectedUser(null);
                                    }}
                                    title="Importer des utilisateurs par Excel"
                                />
                                <FaInfoCircle
                                    className={`project-dashboard-action-icon ${showUserDetails ? 'active' : ''}`}
                                    onClick={() => setShowUserDetails(!showUserDetails)}
                                    title="Afficher les détails de l'utilisateur sélectionné"
                                />
                            </div>
                        </div>

                        {loading && <p className="project-dashboard-loading-message">Chargement des utilisateurs...</p>}
                        {error && <div className="project-dashboard-error-message">{error}</div>}

                        <div className={`project-dashboard-sliding-panel ${showCreateUserForm ? 'slide-in-top' : 'slide-out-top'}`}>
                            {showCreateUserForm && (
                                <div className="project-dashboard-card project-dashboard-user-creation-form">
                                    <div className="form-header">
                                        <h4>Créer un nouvel utilisateur</h4>
                                        <FaTimes className="close-icon" onClick={closeForms} title="Fermer" />
                                    </div>
                                    <form onSubmit={handleCreateUser}>
                                        <div className="project-dashboard-form-group">
                                            <label htmlFor="newUserName">Nom Complet</label>
                                            <input
                                                type="text"
                                                id="newUserName"
                                                name="newUserName"
                                                value={newUserName}
                                                onChange={(e) => setNewUserName(e.target.value)}
                                                placeholder="Nom et prénom"
                                                required
                                            />
                                        </div>
                                        <div className="project-dashboard-form-group">
                                            <label htmlFor="newUserEmail">Email</label>
                                            <input
                                                type="email"
                                                id="newUserEmail"
                                                name="newUserEmail"
                                                value={newUserEmail}
                                                onChange={(e) => setNewUserEmail(e.target.value)}
                                                placeholder="email@example.com"
                                                required
                                            />
                                        </div>
                                        {(newUserName.trim() !== '' && newUserEmail.trim() !== '') && (
                                            <button
                                                type="submit"
                                                disabled={loading || !getAuthToken()}
                                                className="icon-button submit-button"
                                                title="Créer l'utilisateur"
                                            >
                                                {loading ? '...' : <FaCheck size={10} />}
                                            </button>
                                        )}
                                    </form>
                                </div>
                            )}
                        </div>

                        <div className={`project-dashboard-sliding-panel ${showUploadExcelForm ? 'slide-in-top' : 'slide-out-top'}`}>
                            {showUploadExcelForm && (
                                <div className="project-dashboard-card project-dashboard-excel-upload-form">
                                    <div className="form-header">
                                        <FaTimes className="close-icon" onClick={closeForms} title="Fermer" />
                                    </div>
                                    <form onSubmit={handleUploadExcelUsers}>
                                        <div className="project-dashboard-form-group">
                                            <label htmlFor="excelFileInput">Sélectionner un fichier Excel (.xlsx)</label>
                                            <input
                                                type="file"
                                                id="excelFileInput"
                                                name="excelFile"
                                                accept=".xlsx"
                                                onChange={handleFileChange}
                                                required
                                            />
                                        </div>
                                        {excelFile && (
                                            <button type="submit" disabled={loading || !getAuthToken()} className="icon-button submit-button" title="Importer les utilisateurs">
                                                {loading ? '...' : <FaCheck size={15} />}
                                            </button>
                                        )}
                                    </form>
                                    <p className="project-dashboard-hint-text">
                                        Le fichier Excel doit contenir les colonnes 'FullName' et 'Email'.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className={`project-dashboard-sliding-panel ${showUserDetails && selectedUser ? 'slide-in-bottom' : 'slide-out-bottom'}`}>
                            {showUserDetails && selectedUser && (
                                <div className="project-dashboard-card project-dashboard-user-detail-card">
                                    <div className="form-header">
                                        <h4>Détails de l'utilisateur</h4>
                                        <FaTimes className="close-icon" onClick={closeForms} title="Fermer" />
                                    </div>
                                    {getUserAvatar(selectedUser)}
                                    <p><strong>Nom :</strong> {selectedUser.fullName || 'N/A'}</p>
                                    <p><strong>Email:</strong> {selectedUser.email}</p>
                                    {selectedUser.phoneNumber && <p><strong>Téléphone:</strong> {selectedUser.phoneNumber}</p>}
                                </div>
                            )}
                        </div>

                        <div className="project-dashboard-user-list-wrapper">
                            <ul className="project-dashboard-list">
                                {users.length === 0 && !loading && !error ? (
                                    <p className="project-dashboard-no-items-message">Aucun utilisateur trouvé.</p>
                                ) : (
                                    users.map(user => (
                                        <li
                                            key={user.id}
                                            onClick={() => handleUserClick(user)}
                                            className={selectedUser && selectedUser.id === user.id ? 'project-dashboard-list-item active' : 'project-dashboard-list-item'}
                                        >
                                            {getUserAvatar(user)}
                                            <span className="user-list-name">{user.fullName}</span>
                                            <span className="user-list-email">{user.email}</span>
                                        </li>
                                    ))
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="project-dashboard-container">
            {success && <div className="project-dashboard-notification project-dashboard-success">{success}</div>}
            {error && <div className="project-dashboard-notification project-dashboard-error">{error}</div>}
            {renderContent()}
        </div>
    );
};

export default ProjectDashboard;