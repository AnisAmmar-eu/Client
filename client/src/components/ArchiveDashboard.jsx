import React, { useState, useEffect } from 'react';
import './ArchiveDashboard.css';
import { useNavigate } from 'react-router-dom'; 
import { Trash } from 'lucide-react';

const ArchiveDashboard = () => {
    const [archivedMeetings, setArchivedMeetings] = useState([]);
    const [selectedArchivedMeeting, setSelectedArchivedMeeting] = useState(null);
    const [projects, setProjects] = useState([]); 
    const [selectedProjectId, setSelectedProjectId] = useState(''); 
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [meetingTasks, setMeetingTasks] = useState([]); 
    const [meetingAttachments, setMeetingAttachments] = useState([]); 

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
        if (selectedProjectId) {
            fetchArchivedMeetings(selectedProjectId);
        } else if (projects.length > 0) {
            setSelectedProjectId(projects[0].id);
            fetchArchivedMeetings(projects[0].id);
        } else {
            setArchivedMeetings([]); 
            setSelectedArchivedMeeting(null); 
            setMeetingTasks([]); 
            setMeetingAttachments([]); 
        }
    }, [selectedProjectId, projects]); 

    useEffect(() => {
        if (selectedArchivedMeeting) {
            fetchMeetingTasks(selectedArchivedMeeting.id);
            fetchMeetingAttachments(selectedArchivedMeeting.id); 
        } else {
            setMeetingTasks([]); 
            setMeetingAttachments([]); 
        }
    }, [selectedArchivedMeeting]); 

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
        if (!projectId) { 
            setArchivedMeetings([]);
            setSelectedArchivedMeeting(null);
            setMeetingTasks([]); 
            setMeetingAttachments([]); 
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`https://localhost:7212/api/Meeting/archived`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                const fetchedMeetings = data.$values || data; 
                setArchivedMeetings(fetchedMeetings);
                if (fetchedMeetings.length > 0) {
                    const projectMeetings = fetchedMeetings.filter(meeting => meeting.projectId === projectId);
                    if (projectMeetings.length > 0) {
                        setSelectedArchivedMeeting(projectMeetings[0]); 
                    } else {
                        setSelectedArchivedMeeting(null);
                        setMeetingTasks([]);
                        setMeetingAttachments([]);
                    }
                } else {
                    setSelectedArchivedMeeting(null);
                    setMeetingTasks([]); 
                    setMeetingAttachments([]);
                }
            } else if (response.status === 401) {
                setError("Session expirée ou non autorisé. Veuillez vous reconnecter.");
                localStorage.removeItem('authToken');
                navigate('/login');
            } else if (response.status === 404) {
            
                setArchivedMeetings([]);
                setSelectedArchivedMeeting(null);
                setMeetingTasks([]); 
                setMeetingAttachments([]); 
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
                setMeetingTasks(data.$values || data);
            } else if (response.status === 401) {
                setError("Session expirée ou non autorisé. Veuillez vous reconnecter.");
                localStorage.removeItem('authToken');
                navigate('/login');
            } else if (response.status === 404) {
                setMeetingTasks([]); 
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

    const fetchMeetingAttachments = async (meetingId) => {
        setLoading(true);
        setError('');
        const token = getAuthToken();
        if (!token) {
            navigate('/login');
            return;
        }
        if (!meetingId) {
            setMeetingAttachments([]);
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`https://localhost:7212/api/Meeting/${meetingId}/attachments`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setMeetingAttachments(data.$values || data); 
            } else if (response.status === 401) {
                setError("Session expirée ou non autorisé. Veuillez vous reconnecter.");
                localStorage.removeItem('authToken');
                navigate('/login');
            } else if (response.status === 404) {
                setMeetingAttachments([]); 
            } else {
                setError('Erreur lors de la récupération des pièces jointes de la réunion.');
            }
        } catch (err) {
            setError('Erreur réseau ou du serveur lors de la récupération des pièces jointes.');
            console.error('Fetch meeting attachments error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadAllAttachments = () => {
        if (selectedArchivedMeeting) {
            const token = getAuthToken();
            if (!token) {
                setError("Vous n'êtes pas authentifié. Veuillez vous reconnecter.");
                navigate('/login');
                return;
            }

            const downloadUrl = `https://localhost:7212/api/Meeting/${selectedArchivedMeeting.id}/attachments/download`;

            setLoading(true); 
            setError('');

            fetch(downloadUrl, {
                method: 'GET', 
                headers: {
                    'Authorization': `Bearer ${token}` 
                }
            })
                .then(response => {
                    if (response.ok) {
                        return response.blob(); 
                    }
                    if (response.status === 401) {
                        setError("Session expirée ou non autorisé pour le téléchargement. Veuillez vous reconnecter.");
                        localStorage.removeItem('authToken');
                        navigate('/login');
                        throw new Error("Unauthorized"); 
                    }
                    throw new Error(`Échec du téléchargement des pièces jointes: ${response.statusText || response.status}`);
                })
                .then(blob => {
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', `meeting_${selectedArchivedMeeting.id}_attachments.zip`);
                    document.body.appendChild(link);
                    link.click(); 
                    link.parentNode.removeChild(link);
                    window.URL.revokeObjectURL(url); 

                    setLoading(false); 
                })
                .catch(err => {
                    if (err.message !== "Unauthorized") { 
                        setError(err.message || 'Une erreur est survenue lors du téléchargement.');
                    }
                    console.error('Download error:', err);
                    setLoading(false); 
                });
        }
    };

    const handleDeleteMeeting = async (meetingId, event) => {
        event.stopPropagation(); 

        setLoading(true);
        setError('');
        const token = getAuthToken();
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const response = await fetch(`https://localhost:7212/api/Meeting/archived/${meetingId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const deletedMeeting = archivedMeetings.find(m => m.id === meetingId);
                const deletedMeetingProjectId = deletedMeeting ? deletedMeeting.projectId : selectedProjectId;

                if (selectedArchivedMeeting && selectedArchivedMeeting.id === meetingId) {
                    setSelectedArchivedMeeting(null); 
                    setMeetingTasks([]);
                    setMeetingAttachments([]); 
                }

                fetchArchivedMeetings(deletedMeetingProjectId);
            } else if (response.status === 401) {
                setError("Session expirée ou non autorisé. Veuillez vous reconnecter.");
                localStorage.removeItem('authToken');
                navigate('/login');
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Erreur lors de la suppression de la réunion archivée.');
            }
        } catch (err) {
            setError('Erreur réseau ou du serveur lors de la suppression.');
            console.error('Delete meeting error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleMeetingClick = (meeting) => {
        setSelectedArchivedMeeting(meeting);
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
                                onClick={() => handleMeetingClick(item)}
                            >
                                <div className="item-content">
                                    <div className="item-header">
                                        <div className="title-template">
                                            <strong>{item.title}</strong>
                                            {item.template && item.template.name && (
                                                <span className="item-type">{item.template.name}</span>
                                            )}
                                        </div>
                                        <Trash
                                            className="delete-meeting-icon"
                                            onClick={(event) => handleDeleteMeeting(item.id, event)}
                                            title="Supprimer cette réunion archivée (Action irréversible)"
                                        />
                                    </div>
                                    <div className="item-meta">
                                        <span><i className="far fa-calendar-alt"></i> {formatSimpleDate(item.date)}</span>
                                        <span><i className="fas fa-box-open"></i> Archivé</span>
                                    </div>
                                </div>
                            </li>

                        ))}
                    </ul>
                </div>

                <div className="archive-detail-panel glass-effect">
                    {selectedArchivedMeeting ? (
                        <>
                            <div className="detail-card main-info-card">
                                <h3><i className="fas fa-info-circle"></i> Aperçu de la réunion</h3>
                                <div className="info-grid">
                                    <span className="info-label">Projet:</span>

                                    <span className="info-value">{projects.find(p => p.id === selectedArchivedMeeting.projectId)?.name || 'N/A'}</span>
                                    <span className="info-label">Nom de la Réunion:</span>
                                    <span className="info-value">{selectedArchivedMeeting.title}</span>

                                    <span className="info-label">Date et heure:</span>
                                    <span className="info-value">{formatDate(selectedArchivedMeeting.date)}</span>

                                </div>
                            </div>

                            {(meetingTasks && meetingTasks.length > 0) && (
                                <div className="detail-card tasks-card">
                                    <h3><i className="fas fa-tasks"></i> Tâches Associées</h3>
                                    <ul className="entries-list">
                                        {meetingTasks.map(task => (
                                            <li key={task.id} className="entry-item">
                                                <div className="entry-main-info">
                                                    <span className="entry-text">{task.title}</span>
                                                </div>
                                                <div className="entry-meta-info">
                                                    {task.assignedTo && <span className="entry-responsible"><i className="fas fa-user-tag"></i> Assigné à: {task.assignedTo.userName}</span>}
                                                    <span className="entry-dates">
                                                        <i className="far fa-calendar-check"></i> Créé le: {formatSimpleDate(task.createdAt)}
                                                        {task.dueDate && <span className="entry-due-date"> | Échéance: {formatSimpleDate(task.dueDate)}</span>}
                                                    </span>
                                                </div>
                                                {task.description && <p className="entry-notes"><i className="fas fa-sticky-note"></i> {task.description}</p>}
                                                {task.status && <span className={`task-status priority-badge ${task.status.toLowerCase()}`}>{task.status}</span>}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {(!meetingTasks || meetingTasks.length === 0) && !loading && selectedArchivedMeeting && (
                                <div className="detail-card no-items-card">
                                    <h3><i className="fas fa-tasks"></i> Tâches Associées</h3>
                                    <p className="no-items-message">Aucune tâche trouvée pour cette réunion.</p>
                                </div>
                            )}

                            <div className="detail-card attachments-card">
                                <h3><i className="fas fa-paperclip"></i> Pièces jointes</h3>
                                {meetingAttachments && meetingAttachments.length > 0 ? (
                                    <>
                                        <p>Cette réunion contient les pièces jointes suivantes :</p>
                                        <ul className="attachment-list">
                                            {meetingAttachments.map(attachment => (
                                                <li key={attachment.id}>
                                                    <i className="fas fa-file"></i> {attachment.fileName}
                                                </li>
                                            ))}
                                        </ul>
                                        <button
                                            onClick={handleDownloadAllAttachments}
                                            className="btn btn-primary download-zip-btn"
                                        >
                                            <i className="fas fa-download"></i> Télécharger toutes les pièces jointes
                                        </button>
                                    </>
                                ) : (
                                    <p className="no-items-message">Aucune pièce jointe trouvée pour cette réunion.</p>
                                )}
                            </div>


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
                                <div className="detail-card entries-card">
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