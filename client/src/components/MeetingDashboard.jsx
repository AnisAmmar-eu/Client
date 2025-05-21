// src/components/MeetingsDashboard.js
import React, { useState, useEffect } from 'react';
import './MeetingDashboard.css'; // Corrected to MeetingsDashboard.css
import { useNavigate } from 'react-router-dom';

const MeetingsDashboard = () => {
    const [meetings, setMeetings] = useState([]);
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [newMeetingData, setNewMeetingData] = useState({
        title: '',
        description: '',
        date: '',
        time: '',
        projectId: '' // Ensure this is initialized, will be updated by fetchProjects
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const navigate = useNavigate();
    const getAuthToken = () => localStorage.getItem('authToken');

    useEffect(() => {
        const token = getAuthToken();
        if (!token) {
            navigate('/login');
        } else {
            fetchProjects();
        }
    }, [navigate]);

    useEffect(() => {
        // Only fetch meetings if a projectId is selected and there are projects
        if (selectedProjectId) {
            fetchMeetings(selectedProjectId);
        } else if (projects.length > 0) {
            // If projects are loaded but no specific project is selected (e.g., initial load)
            // default to the first project to display some meetings
            setSelectedProjectId(projects[0].id);
            setNewMeetingData(prev => ({ ...prev, projectId: projects[0].id }));
            fetchMeetings(projects[0].id);
        } else {
            setMeetings([]); // Clear meetings if no project is selected or available
        }
    }, [selectedProjectId, projects]); // Added projects to dependency array to react to project fetch

    const fetchProjects = async () => {
        setLoading(true);
        setError('');
        const token = getAuthToken();
        try {
            const response = await fetch('https://localhost:7212/api/Project/projects', { // Fetch all projects user is part of
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                const fetchedProjects = data.$values || data; // Handle both $values and direct array
                setProjects(fetchedProjects);
                if (fetchedProjects.length > 0) {
                    // Set both the filter and the new meeting form to the first project
                    setSelectedProjectId(fetchedProjects[0].id);
                    setNewMeetingData(prev => ({ ...prev, projectId: fetchedProjects[0].id }));
                } else {
                    // No projects available, clear selections
                    setSelectedProjectId('');
                    setNewMeetingData(prev => ({ ...prev, projectId: '' }));
                }
            } else if (response.status === 401) {
                setError("Session expirée ou non autorisé. Veuillez vous reconnecter.");
                localStorage.removeItem('authToken');
                navigate('/login');
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

    const fetchMeetings = async (projectId) => {
        setLoading(true);
        setError('');
        const token = getAuthToken();
        try {
            const response = await fetch(`https://localhost:7212/api/Meeting/project/${projectId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                // Filter out archived meetings from the display list
                setMeetings((data.$values || data).filter(m => !m.isArchived));
            } else if (response.status === 401) {
                setError("Session expirée ou non autorisé. Veuillez vous reconnecter.");
                localStorage.removeItem('authToken');
                navigate('/login');
            } else {
                // If response status is 404 for no meetings, it's not an error but just no data
                if (response.status === 404) {
                    setMeetings([]);
                } else {
                    setError('Erreur lors de la récupération des réunions.');
                }
            }
        } catch (err) {
            setError('Erreur réseau ou du serveur.');
            console.error('Fetch meetings error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleNewMeetingChange = (e) => {
        const { name, value } = e.target;
        setNewMeetingData(prevData => ({ ...prevData, [name]: value }));
    };

    const handleCreateMeeting = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        const token = getAuthToken();

        if (!token) {
            setError('Vous devez être connecté pour créer une réunion.');
            setLoading(false);
            navigate('/login');
            return;
        }

        if (!newMeetingData.projectId || !newMeetingData.title || !newMeetingData.date || !newMeetingData.time) {
            setError('Veuillez remplir tous les champs obligatoires.');
            setLoading(false);
            return;
        }

        const combinedDateTime = new Date(`${newMeetingData.date}T${newMeetingData.time}:00`);

        const meetingToCreate = {
            title: newMeetingData.title,
            description: newMeetingData.description,
            date: combinedDateTime.toISOString(),
            projectId: newMeetingData.projectId
        };

        console.log("Meeting data being sent:", meetingToCreate);
        console.log("ProjectId before fetch:", newMeetingData.projectId);

        try {
            const response = await fetch('https://localhost:7212/api/Meeting', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(meetingToCreate)
            });

            if (response.ok) {
                setNewMeetingData(prev => ({
                    ...prev,
                    title: '',
                    description: '',
                    date: '',
                    time: ''
                }));
                fetchMeetings(selectedProjectId); // Refresh meetings for current project
            } else if (response.status === 401) {
                setError('Session expirée ou non autorisé. Veuillez vous reconnecter.');
                localStorage.removeItem('authToken');
                navigate('/login');
            } else {
                const errorBody = await response.json();
                if (errorBody && errorBody.errors) {
                    const validationErrors = Object.values(errorBody.errors).flat().join(' ');
                    setError(`Erreur de validation: ${validationErrors}`);
                } else {
                    const errorText = await response.text();
                    setError(`Erreur lors de la création de la réunion: ${errorText}`);
                }
                console.error('API Error:', errorBody);
            }
        } catch (err) {
            setError('Erreur réseau ou du serveur.');
            console.error('Create meeting error:', err);
        } finally {
            setLoading(false);
        }
    };

    // MODIFIED FUNCTION: handleArchiveMeeting (no confirmation)
    const handleArchiveMeeting = async (meetingId, meetingTitle) => {
        setLoading(true);
        setError('');
        setSuccess('');
        const token = getAuthToken();

        if (!token) {
            setError('Vous devez être connecté pour archiver une réunion.');
            setLoading(false);
            navigate('/login');
            return;
        }

        try {
            const response = await fetch(`https://localhost:7212/api/Meeting/${meetingId}/archive`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                // Remove the archived meeting from the current list
                setMeetings(prevMeetings => prevMeetings.filter(m => m.id !== meetingId));
            } else if (response.status === 401) {
                setError('Session expirée ou non autorisé. Veuillez vous reconnecter.');
                localStorage.removeItem('authToken');
                navigate('/login');
            } else if (response.status === 400) {
                const errorBody = await response.json();
                setError(`Erreur: ${errorBody.error || 'La réunion est déjà archivée ou une erreur s\'est produite.'}`);
            }
            else {
                const errorText = await response.text();
                setError(`Erreur lors de l'archivage de la réunion: ${errorText}`);
            }
        } catch (err) {
            setError('Erreur réseau ou du serveur lors de l\'archivage.');
            console.error('Archive meeting error:', err);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="meetings-dashboard-container">
            <div className="main-content">
                <div className="left-panel glass-effect">
                    <h3>Filtrer par Projet</h3>
                    <div className="form-group project-select-group mb-20">
                        <label htmlFor="selectProjectMeetings">Sélectionner un projet</label>
                        <select
                            id="selectProjectMeetings"
                            value={selectedProjectId}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                            disabled={projects.length === 0}
                        >
                            <option value="">-- Tous les projets --</option>
                            {projects.map(project => (
                                <option key={project.id} value={project.id}>{project.name}</option>
                            ))}
                        </select>
                        {projects.length === 0 && !loading && <p className="no-items-message">Aucun projet disponible.</p>}
                    </div>

                    <h3>Réunions ({selectedProjectId ? projects.find(p => p.id === selectedProjectId)?.name : 'Toutes'})</h3>
                    {loading && <p className="loading-message">Chargement des réunions...</p>}
                    {error && <div className="error-message">{error}</div>}

                    <div className="meetings-grid">
                        {meetings.length === 0 && !loading && !error && (
                            <p className="no-items-message">
                                {selectedProjectId
                                    ? `Aucune réunion trouvée pour le projet "${projects.find(p => p.id === selectedProjectId)?.name || 'sélectionné'}".`
                                    : 'Veuillez sélectionner un projet pour voir les réunions.'
                                }
                            </p>
                        )}
                        {meetings.map(meeting => (
                            <div key={meeting.id} className="meeting-card glassy-card">
                                <h4 className="meeting-title">{meeting.title}</h4> {/* Added title display */}
                                <div className="meeting-details">
                                    <span className="detail-item">
                                        <i className="fas fa-clock"></i> {new Date(meeting.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <span className="detail-item">
                                        <i className="fas fa-project-diagram"></i> {projects.find(p => p.id === meeting.projectId)?.name || 'N/A'}
                                    </span>
                                </div>
                                <div className="meeting-actions">
                                    <button
                                        onClick={() => handleArchiveMeeting(meeting.id, meeting.title)}
                                        className="archive-button"
                                        disabled={loading}
                                    >
                                        <i className="fas fa-box-archive"></i> Archiver
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="right-panel glass-effect">
                    {success && <div className="success-message">{success}</div>}
                    {error && <div className="error-message">{error}</div>}

                    <div className="glassy-card">
                        <h4>Planifier une nouvelle réunion</h4>
                        <form onSubmit={handleCreateMeeting}>
                            <div className="form-group">
                                <label htmlFor="meetingProject">Projet Associé</label>
                                <select
                                    id="meetingProject"
                                    name="projectId"
                                    value={newMeetingData.projectId}
                                    onChange={handleNewMeetingChange}
                                    required
                                    disabled={projects.length === 0} // Disable if no projects are loaded
                                >
                                    <option value="">-- Choisir un projet --</option>
                                    {projects.map(project => (
                                        <option key={project.id} value={project.id}>{project.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="meetingTitle">Titre de la Réunion</label>
                                <input
                                    type="text"
                                    id="meetingTitle"
                                    name="title"
                                    value={newMeetingData.title}
                                    onChange={handleNewMeetingChange}
                                    placeholder="Ex: Réunion de planification Sprint 3"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="meetingDescription">Description (optionnel)</label>
                                <textarea
                                    id="meetingDescription"
                                    name="description"
                                    value={newMeetingData.description}
                                    onChange={handleNewMeetingChange}
                                    placeholder="Ordre du jour, objectifs..."
                                    rows="3"
                                ></textarea>
                            </div>
                            <div className="form-group half-width">
                                <label htmlFor="meetingDate">Date</label>
                                <input
                                    type="date"
                                    id="meetingDate"
                                    name="date"
                                    value={newMeetingData.date}
                                    onChange={handleNewMeetingChange}
                                    required
                                />
                            </div>
                            <div className="form-group half-width">
                                <label htmlFor="meetingTime">Heure</label>
                                <input
                                    type="time"
                                    id="meetingTime"
                                    name="time"
                                    value={newMeetingData.time}
                                    onChange={handleNewMeetingChange}
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading || !getAuthToken() || projects.length === 0 || !newMeetingData.projectId} // Disable if no projects or no projectId selected
                                className="glass-button"
                            >
                                {loading ? 'Planification...' : 'Planifier la réunion'}
                            </button>
                            {!getAuthToken() && <p className="auth-hint">Connectez-vous pour planifier une réunion.</p>}
                            {projects.length === 0 && <p className="auth-hint">Créez un projet avant de planifier une réunion.</p>}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MeetingsDashboard;