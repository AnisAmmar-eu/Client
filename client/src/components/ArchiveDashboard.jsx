import React, { useState, useEffect } from 'react';
import './ArchiveDashboard.css';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for redirection

const ArchiveDashboard = () => {
    const [archivedMeetings, setArchivedMeetings] = useState([]);
    const [selectedArchivedMeeting, setSelectedArchivedMeeting] = useState(null);
    const [projects, setProjects] = useState([]); // New state for projects
    const [selectedProjectId, setSelectedProjectId] = useState(''); // New state for selected project filter
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [meetingTasks, setMeetingTasks] = useState([]); // New state for meeting tasks

    const navigate = useNavigate(); // Initialize navigate hook
    const getAuthToken = () => localStorage.getItem('authToken');

    // Effect to fetch projects on component mount
    useEffect(() => {
        const token = getAuthToken();
        if (!token) {
            navigate('/login'); // Redirect to login if no token
        } else {
            fetchProjects();
        }
    }, [navigate]);

    // Effect to fetch archived meetings when selectedProjectId or projects change
    useEffect(() => {
        if (selectedProjectId) {
            fetchArchivedMeetings(selectedProjectId);
        } else if (projects.length > 0) {
            // Default to the first project if none is selected initially
            setSelectedProjectId(projects[0].id);
            fetchArchivedMeetings(projects[0].id);
        } else {
            setArchivedMeetings([]); // Clear meetings if no project is selected or available
            setSelectedArchivedMeeting(null); // Clear selected detail
            setMeetingTasks([]); // Clear tasks as well
        }
    }, [selectedProjectId, projects]); // Depend on selectedProjectId and projects

    // Effect to fetch tasks when a meeting is selected
    useEffect(() => {
        if (selectedArchivedMeeting) {
            fetchMeetingTasks(selectedArchivedMeeting.id);
        } else {
            setMeetingTasks([]); // Clear tasks if no meeting is selected
        }
    }, [selectedArchivedMeeting]); // Depend on selectedArchivedMeeting

    const fetchProjects = async () => {
        setLoading(true);
        setError('');
        const token = getAuthToken();
        if (!token) return;

        try {
            const response = await fetch('https://localhost:7212/api/Project/projects', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                const fetchedProjects = data.$values || data;
                setProjects(fetchedProjects);
                if (fetchedProjects.length > 0) {
                    // Set the default selected project to the first one
                    setSelectedProjectId(fetchedProjects[0].id);
                } else {
                    setSelectedProjectId('');
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

    const fetchArchivedMeetings = async (projectId) => {
        setLoading(true);
        setError('');
        const token = getAuthToken();
        if (!token) {
            navigate('/login');
            return;
        }
        if (!projectId) { // Don't fetch if no project is selected
            setArchivedMeetings([]);
            setSelectedArchivedMeeting(null);
            setMeetingTasks([]); // Clear tasks
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`https://localhost:7212/api/Meeting/archived`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                const fetchedMeetings = data.$values || data; // Handle both $values and direct array
                setArchivedMeetings(fetchedMeetings);
                if (fetchedMeetings.length > 0) {
                    // Filter meetings by selected project ID
                    const projectMeetings = fetchedMeetings.filter(meeting => meeting.projectId === projectId);
                    if (projectMeetings.length > 0) {
                         setSelectedArchivedMeeting(projectMeetings[0]); // Select the first meeting of the selected project
                    } else {
                         setSelectedArchivedMeeting(null);
                         setMeetingTasks([]);
                    }
                } else {
                    setSelectedArchivedMeeting(null);
                    setMeetingTasks([]); // Clear tasks
                }
            } else if (response.status === 401) {
                setError("Session expirée ou non autorisé. Veuillez vous reconnecter.");
                localStorage.removeItem('authToken');
                navigate('/login');
            } else if (response.status === 404) {
                // No archived meetings for this project, which is not an error
                setArchivedMeetings([]);
                setSelectedArchivedMeeting(null);
                setMeetingTasks([]); // Clear tasks
            } else {
                setError('Erreur lors de la récupération des réunions archivées.');
            }
        } catch (err) {
            setError('Erreur réseau ou du serveur lors de la récupération des archives.');
            console.error('Fetch archived meetings error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMeetingTasks = async (meetingId) => {
        setLoading(true);
        setError('');
        const token = getAuthToken();
        if (!token) {
            navigate('/login');
            return;
        }
        if (!meetingId) {
            setMeetingTasks([]);
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`https://localhost:7212/api/Meeting/${meetingId}/tasks`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setMeetingTasks(data.$values || data); // Handle both $values and direct array
            } else if (response.status === 401) {
                setError("Session expirée ou non autorisé. Veuillez vous reconnecter.");
                localStorage.removeItem('authToken');
                navigate('/login');
            } else if (response.status === 404) {
                setMeetingTasks([]); // No tasks found for this meeting
            } else {
                setError('Erreur lors de la récupération des tâches de la réunion.');
            }
        } catch (err) {
            setError('Erreur réseau ou du serveur lors de la récupération des tâches.');
            console.error('Fetch meeting tasks error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleMeetingClick = (meeting) => {
        setSelectedArchivedMeeting(meeting);
        // The useEffect for selectedArchivedMeeting will now handle fetching tasks
    };

    const formatDate = (isoString) => {
        if (!isoString) return 'N/A';
        const date = new Date(isoString);
        return date.toLocaleDateString('fr-FR', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        }).replace(',', '');
    };

    const formatSimpleDate = (isoString) => {
        if (!isoString) return 'N/A';
        const date = new Date(isoString);
        return date.toLocaleDateString('fr-FR', {
            year: 'numeric', month: '2-digit', day: '2-digit'
        });
    };

    return (
        <div className="archive-dashboard-container">
            <div className="main-content archive-layout">
                <div className="archive-list-panel glass-effect">
                    <h3><i className="fas fa-archive"></i> Archives</h3>

                    <div className="form-group">
                        <label htmlFor="project-select">Sélectionner un Projet:</label>
                        <select
                            id="project-select"
                            value={selectedProjectId}
                            onChange={(e) => {
                                setSelectedProjectId(e.target.value);
                                setSelectedArchivedMeeting(null); // Clear selected meeting when project changes
                                setMeetingTasks([]); // Clear tasks when project changes
                            }}
                            className="project-dropdown"
                        >
                            <option value="">Tous les projets</option> {/* Option to view all projects */}
                            {projects.map(project => (
                                <option key={project.id} value={project.id}>
                                    {project.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {loading && <p className="loading-message">Chargement...</p>}
                    {error && <div className="error-message">{error}</div>}

                    <ul className="custom-list archive-items-list">
                        {archivedMeetings.length === 0 && !loading && !error && (
                            <p className="no-items-message">
                                {selectedProjectId
                                    ? `Aucune réunion archivée trouvée pour le projet "${projects.find(p => p.id === selectedProjectId)?.name || 'sélectionné'}".`
                                    : 'Veuillez sélectionner un projet pour voir les réunions archivées.'
                                }
                            </p>
                        )}
                        {archivedMeetings.filter(meeting => selectedProjectId === '' || meeting.projectId === selectedProjectId).map(item => (
                            <li
                                key={item.id}
                                className={selectedArchivedMeeting?.id === item.id ? 'active' : ''}
                                onClick={() => handleMeetingClick(item)} // Use the new handler
                            >
                                <div className="item-header">
                                    <strong>{item.title}</strong>
                                    {/* Assuming 'type' comes from 'Template' in your backend model, adjust if necessary */}
                                    {item.template && item.template.name && (
                                        <span className="item-type">{item.template.name}</span>
                                    )}
                                </div>
                                <div className="item-meta">
                                    <span><i className="far fa-calendar-alt"></i> {formatSimpleDate(item.date)}</span>
                                    {/* Backend 'Meeting' model doesn't seem to have archivedDate directly,
                                        You might want to add a field for when it was archived or infer from another timestamp */}
                                    <span><i className="fas fa-box-open"></i> Archivé</span> {/* Removed date if not available */}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="archive-detail-panel glass-effect">
                    {selectedArchivedMeeting ? (
                        <>
                            <h2 className="detail-title">{selectedArchivedMeeting.title}</h2>
                            <p className="detail-subtitle">
                                {selectedArchivedMeeting.description && (<span><i className="fas fa-align-left"></i> Description: {selectedArchivedMeeting.description}</span>)}
                            </p>

                            <div className="detail-card main-info-card">
                                <h3><i className="fas fa-info-circle"></i> Aperçu de la réunion</h3>
                                <div className="info-grid">
                                    <div>
                                        <span className="info-label">Date et heure:</span>
                                        <span className="info-value">{formatDate(selectedArchivedMeeting.date)}</span>
                                    </div>
                                    <div>
                                        <span className="info-label">Projet:</span>
                                        {/* Assuming you have projects state available to map projectId to projectName */}
                                        <span className="info-value">{projects.find(p => p.id === selectedArchivedMeeting.projectId)?.name || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="info-label">Type:</span>
                                        <span className="info-value">{selectedArchivedMeeting.template?.name || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Display Tasks in the desired format */}
                            {(meetingTasks && meetingTasks.length > 0) && (
                                <div className="detail-card tasks-card">
                                    <h3><i className="fas fa-tasks"></i> Tâches Associées</h3>
                                    <ul className="entries-list"> {/* Reusing entries-list for similar styling */}
                                        {meetingTasks.map(task => (
                                            <li key={task.id} className="entry-item"> {/* Reusing entry-item for styling */}
                                                <div className="entry-main-info">
                                                    <span className="entry-id">#{task.id}</span>
                                                    <span className="entry-text">{task.title}</span> {/* Using task.title as entry text */}
                                                </div>
                                                <div className="entry-meta-info">
                                                    {task.assignedTo && <span className="entry-responsible"><i className="fas fa-user-tag"></i> Assigné à: {task.assignedTo.userName}</span>}
                                                    <span className="entry-dates">
                                                        <i className="far fa-calendar-check"></i> Créé le: {formatSimpleDate(task.creationDate)} {/* Assuming a creationDate for tasks */}
                                                        {task.dueDate && <span className="entry-due-date"> | Échéance: {formatSimpleDate(task.dueDate)}</span>}
                                                    </span>
                                                </div>
                                                {task.description && <p className="entry-notes"><i className="fas fa-sticky-note"></i> {task.description}</p>}
                                                {task.status && <span className={`task-status priority-badge ${task.status.toLowerCase()}`}>{task.status}</span>} {/* Adding status as a badge */}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Display a message if no tasks are found for the selected meeting */}
                            {(!meetingTasks || meetingTasks.length === 0) && !loading && selectedArchivedMeeting && (
                                <div className="detail-card no-items-card">
                                    <h3><i className="fas fa-tasks"></i> Tâches Associées</h3>
                                    <p className="no-items-message">Aucune tâche trouvée pour cette réunion.</p>
                                </div>
                            )}

                            {(selectedArchivedMeeting.documents && selectedArchivedMeeting.documents.length > 0) && (
                                <div className="detail-card document-card">
                                    <h3><i className="fas fa-file-alt"></i> Documents</h3>
                                    <ul className="document-list">
                                        {selectedArchivedMeeting.documents.map((doc, index) => (
                                            <li key={index}>
                                                <i className="fas fa-file-pdf pdf-icon"></i>
                                                <a href={doc.url} target="_blank" rel="noopener noreferrer">{doc.name}</a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {(selectedArchivedMeeting.entries && selectedArchivedMeeting.entries.length > 0) && (
                                <div className="detail-card entries-card"> {/* Using glassy-card style */}
                                    <h3><i className="fas fa-list-check"></i> Entries</h3>
                                    <ul className="entries-list">
                                        {selectedArchivedMeeting.entries.map(entry => (
                                            <li key={entry.id} className="entry-item">
                                                <div className="entry-main-info">
                                                    <span className="entry-id">#{entry.id}</span>
                                                    <span className="entry-text">{entry.text}</span>
                                                </div>
                                                <div className="entry-meta-info">
                                                    <span className="entry-responsible"><i className="fas fa-user-tag"></i> {entry.responsible}</span>
                                                    <span className="entry-dates">
                                                        <i className="far fa-calendar-check"></i> Start: {formatSimpleDate(entry.startDate)}
                                                        {entry.dueDate && <span className="entry-due-date"> | Due: {formatSimpleDate(entry.dueDate)}</span>}
                                                    </span>
                                                </div>
                                                {entry.notes && <p className="entry-notes"><i className="fas fa-sticky-note"></i> {entry.notes}</p>}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {(selectedArchivedMeeting.linkedMeetings && selectedArchivedMeeting.linkedMeetings.length > 0) && (
                                <div className="detail-card linked-meetings-card">
                                    <h3><i className="fas fa-link"></i> Linked Meetings</h3>
                                    <ul className="linked-list">
                                        {selectedArchivedMeeting.linkedMeetings.map((link, index) => (
                                            <li key={index}>
                                                <i className="fas fa-calendar-check"></i>
                                                <a href="#">{link.title}</a> - <span>{link.agendaItem}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Combined "No items" message including tasks */}
                            {(!selectedArchivedMeeting.attachments || selectedArchivedMeeting.attachments.length === 0) &&
                             (!selectedArchivedMeeting.documents || selectedArchivedMeeting.documents.length === 0) &&
                             (!meetingTasks || meetingTasks.length === 0) &&
                             (!selectedArchivedMeeting.entries || selectedArchivedMeeting.entries.length === 0) &&
                             (!selectedArchivedMeeting.linkedMeetings || selectedArchivedMeeting.linkedMeetings.length === 0) && (
                                <div className="detail-card no-attachments-card">
                                    <h3><i className="fas fa-paperclip"></i> Pièces jointes & Informations Supplémentaires</h3>
                                    <p className="no-items-message">Aucune pièce jointe, document, tâche, entrée ou réunion liée pour cette réunion.</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="no-items-message full-height-message">Sélectionnez une réunion archivée dans le panneau de gauche pour voir les détails.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ArchiveDashboard;