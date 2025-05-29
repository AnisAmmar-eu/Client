import React, { useState, useEffect, useRef } from 'react';
import './MeetingDashboard.css';
import { useNavigate } from 'react-router-dom';
import DescriptionModal from './DescriptionModale';
import AgendaModal from './AgendaModale';
import ObjectivesModal from './ObjectivesModale';
import { Archive } from 'lucide-react';

const CheckboxDropdown = ({ label, options, selectedValues, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const handleToggle = () => {
        setIsOpen(!isOpen);
    };

    const handleCheckboxChange = (e) => {
        const { value, checked } = e.target;
        let newSelectedValues;
        if (checked) {
            newSelectedValues = [...selectedValues, value];
        } else {
            newSelectedValues = selectedValues.filter(id => id !== value);
        }
        onChange(newSelectedValues);
    };

    const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setIsOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const getDisplayValue = () => {
        if (selectedValues.length === 0) {
            return `Sélectionner ${label}`;
        } else if (selectedValues.length === options.length) {
            return `Tous les ${label}`;
        } else {
            const selectedNames = selectedValues
                .map(id => {
                    const option = options.find(opt => opt.id === id);
                    return option ? option.fullName : '';
                })
                .filter(name => name !== '');
            return selectedNames.join(', ');
        }
    };

    return (
        <div className="md-checkbox-dropdown" ref={dropdownRef}>
            <div className="md-dropdown-header" onClick={handleToggle}>
                {getDisplayValue()}
                <span className="md-dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
            </div>
            {isOpen && (
                <div className="md-dropdown-list">
                    {options.length === 0 ? (
                        <div className="md-dropdown-item disabled">Aucun {label.toLowerCase()} disponible</div>
                    ) : (
                        options.map(option => (
                            <label key={option.id} className="md-dropdown-item">
                                <input
                                    type="checkbox"
                                    value={option.id}
                                    checked={selectedValues.includes(option.id)}
                                    onChange={handleCheckboxChange}
                                />
                                {option.fullName} ({option.email})
                            </label>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

const MeetingsDashboard = () => {
    const [meetings, setMeetings] = useState([]);
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [newMeetingData, setNewMeetingData] = useState({
        title: '',
        description: '',
        agenda: '',
        objectives: '',
        date: '',
        time: '',
        projectId: ''
    });
    const [selectedParticipantIds, setSelectedParticipantIds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showDescriptionModal, setShowDescriptionModal] = useState(false);
    const [showAgendaModal, setShowAgendaModal] = useState(false);
    const [showObjectivesModal, setShowObjectivesModal] = useState(false);
    const [newlyCreatedMeetingId, setNewlyCreatedMeetingId] = useState(null);
    const [sendingInvitations, setSendingInvitations] = useState(false);
    const [selectedMeeting, setSelectedMeeting] = useState(null); // Nouvel état pour la réunion sélectionnée
    const [meetingParticipants, setMeetingParticipants] = useState([]); // État pour les participants de la réunion

    const navigate = useNavigate();
    const getAuthToken = () => localStorage.getItem('authToken');

    useEffect(() => {
        const token = getAuthToken();
        if (!token) {
            navigate('/login');
        } else {
            fetchProjects();
            fetchUsers();
            fetchTemplates();
        }
    }, [navigate]);

    useEffect(() => {
        if (selectedProjectId) {
            fetchMeetings(selectedProjectId);
        } else if (projects.length > 0) {
            setSelectedProjectId(projects[0].id);
            setNewMeetingData(prev => ({ ...prev, projectId: projects[0].id }));
            fetchMeetings(projects[0].id);
        } else {
            setMeetings([]);
        }
    }, [selectedProjectId, projects]);

    const fetchMeetingParticipants = async (meetingId) => {
        setLoading(true);
        setError('');
        const token = getAuthToken();
        try {
            const response = await fetch(`https://localhost:7212/api/Meeting/${meetingId}/participants`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setMeetingParticipants(data.$values || data);
            } else if (response.status === 401) {
                setError("Session expirée ou non autorisé. Veuillez vous reconnecter.");
                localStorage.removeItem('authToken');
                navigate('/login');
            } else {
                setError('Erreur lors de la récupération des participants.');
            }
        } catch (err) {
            setError('Erreur réseau ou du serveur.');
            console.error('Fetch meeting participants error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchProjects = async () => {
        setLoading(true);
        setError('');
        const token = getAuthToken();
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
                    setNewMeetingData(prev => ({ ...prev, projectId: fetchedProjects[0].id }));
                } else {
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
    const getTodayDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0'); 
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    const fetchUsers = async () => {
        setLoading(true);
        setError('');
        const token = getAuthToken();
        try {
            const response = await fetch('https://localhost:7212/api/Project/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setUsers(data.$values || data);
            } else if (response.status === 401) {
                setError("Session expirée ou non autorisé. Veuillez vous reconnecter.");
                localStorage.removeItem('authToken');
                navigate('/login');
            } else {
                setError('Erreur lors de la récupération des utilisateurs.');
            }
        } catch (err) {
            setError('Erreur réseau ou du serveur lors de la récupération des utilisateurs.');
            console.error('Fetch users error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchTemplates = async () => {
        setLoading(true);
        setError('');
        const token = getAuthToken();
        try {
            const response = await fetch('https://localhost:7212/api/Template/templates', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setTemplates(data.$values || data);
            } else if (response.status === 401) {
                setError("Session expirée ou non autorisé. Veuillez vous reconnecter.");
                localStorage.removeItem('authToken');
                navigate('/login');
            } else {
                setError('Erreur lors de la récupération des modèles de réunion.');
            }
        } catch (err) {
            setError('Erreur réseau ou du serveur lors de la récupération des modèles.');
            console.error('Fetch templates error:', err);
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
                setMeetings((data.$values || data).filter(m => !m.isArchived));
            } else if (response.status === 401) {
                setError("Session expirée ou non autorisé. Veuillez vous reconnecter.");
                localStorage.removeItem('authToken');
                navigate('/login');
            } else {
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

    const handleParticipantChange = (selectedValues) => {
        setSelectedParticipantIds(selectedValues);
        if (newlyCreatedMeetingId) {
            setNewlyCreatedMeetingId(null);
        }
    };

    const handleSaveDescription = (description) => {
        setNewMeetingData(prev => ({ ...prev, description }));
        setShowDescriptionModal(false);
    };

    const handleOpenDescriptionModal = () => {
        setShowDescriptionModal(true);
    };


    const handleSaveObjectives = (objectives) => {
        setNewMeetingData(prev => ({ ...prev, objectives }));
        setShowObjectivesModal(false);
    };

    const handleOpenObjectivesModal = () => {
        setShowObjectivesModal(true);
    };

    const handleCreateMeeting = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        setNewlyCreatedMeetingId(null);
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
            agenda: newMeetingData.agenda,
            objectives: newMeetingData.objectives,
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
                const createdMeeting = await response.json();
                setNewlyCreatedMeetingId(createdMeeting.id);
                setSuccess(`Réunion "${createdMeeting.title}" créée avec succès.`);

                setNewMeetingData(prev => ({
                    ...prev,
                    title: '',
                    description: '',
                    agenda: '',
                    objectives: '',
                    date: '',
                    time: ''
                }));
                setSelectedParticipantIds([]);

                fetchMeetings(selectedProjectId);
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

    const sendMeetingInvitations = async (meetingId, participantIds) => {
        setSendingInvitations(true);
        setError('');
        setSuccess('');
        const token = getAuthToken();

        if (!token) {
            setError('Vous devez être connecté pour envoyer des invitations.');
            setSendingInvitations(false);
            navigate('/login');
            return;
        }
        if (!meetingId) {
            setError('Aucune réunion sélectionnée pour envoyer des invitations.');
            setSendingInvitations(false);
            return;
        }
        if (participantIds.length === 0) {
            setError('Veuillez sélectionner au moins un participant pour envoyer des invitations.');
            setSendingInvitations(false);
            return;
        }

        try {
            const response = await fetch(`https://localhost:7212/api/Meeting/${meetingId}/invite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(participantIds)
            });

            if (response.ok) {
                setNewlyCreatedMeetingId(null);
                setSelectedParticipantIds([]);
            } else if (response.status === 401) {
                setError('Session expirée ou non autorisé. Veuillez vous reconnecter.');
                localStorage.removeItem('authToken');
                navigate('/login');
            } else {
                const errorText = await response.text();
                setError(`Erreur lors de l'envoi des invitations: ${errorText}`);
            }
        } catch (err) {
            setError('Erreur réseau ou du serveur lors de l\'envoi des invitations.');
            console.error('Send invitations error:', err);
        } finally {
            setSendingInvitations(false);
        }
    };

    const handleArchiveMeeting = async (meetingId, meetingTitle) => {
        setLoading(true);
        setError('');
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
                setMeetings(prevMeetings => prevMeetings.filter(m => m.id !== meetingId));
                if (selectedMeeting?.id === meetingId) {
                    setSelectedMeeting(null); 
                }
            } else if (response.status === 401) {
                setError('Session expirée ou non autorisé. Veuillez vous reconnecter.');
                localStorage.removeItem('authToken');
                navigate('/login');
            } else if (response.status === 400) {
                const errorBody = await response.json();
                setError(`Erreur: ${errorBody.error || 'La réunion est déjà archivée ou une erreur s\'est produite.'}`);
            } else {
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

    const handleSelectMeeting = (meeting) => {
        setSelectedMeeting(meeting);
        fetchMeetingParticipants(meeting.id); 
    };

    const handleBackToForm = () => {
        setSelectedMeeting(null);
        setMeetingParticipants([]);
    };

    const parseAgendaStringToArray = (agendaString) => {
        if (!agendaString) {
            return [{ title: '', start: '', duration: '', finish: '' }]; 
        }
     
        return agendaString.split('\n')
            .filter(line => line.trim() !== '')
            .map(line => ({
                title: line.trim(),
                start: '',    
                duration: '', 
                finish: ''    
            }));
    };

    const convertAgendaArrayToString = (agendaArray) => {
        if (!agendaArray || agendaArray.length === 0) {
            return '';
        }
        return agendaArray.map(item => item.title).join('\n');
    };

    const handleSaveAgenda = (agendaArrayFromModal) => {
        const agendaString = convertAgendaArrayToString(agendaArrayFromModal);
        setNewMeetingData(prev => ({ ...prev, agenda: agendaString }));
        setShowAgendaModal(false);
    };

    const handleOpenAgendaModal = () => {
        setShowAgendaModal(true);
    };
    return (
        <div className="md-container">
            <div className="md-content-container">
                <div className="md-left-panel">
                    <div className="md-glassy-card md-project-meetings-card">
                        <h3>Filtrer par Projet</h3>
                        <div className="md-form-group md-project-select-group">
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
                            {projects.length === 0 && !loading && <p className="md-no-items-message">Aucun projet disponible.</p>}
                        </div>

                        <h3 className="md-meetings-list-header">Réunions ({selectedProjectId ? projects.find(p => p.id === selectedProjectId)?.name : 'Toutes'})</h3>
                        {loading && <p className="md-loading-message">Chargement des réunions...</p>}
                        {error && <div className="md-error-message">{error}</div>}

                        <div className="md-meetings-grid">
                            {meetings.length === 0 && !loading && !error && (
                                <p className="md-no-items-message">
                                    {selectedProjectId
                                        ? `Aucune réunion trouvée pour le projet "${projects.find(p => p.id === selectedProjectId)?.name || 'sélectionné'}".`
                                        : 'Veuillez sélectionner un projet pour voir les réunions.'
                                    }
                                </p>
                            )}
                            {meetings.map(meeting => (
                                <div
                                    key={meeting.id}
                                    className={`md-meeting-card md-glassy-card ${selectedMeeting?.id === meeting.id ? 'md-selected' : ''}`}
                                    onClick={() => handleSelectMeeting(meeting)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="md-card-header">
                                        <h4 className="md-meeting-title">{meeting.title}</h4>
                                        <div className="md-meeting-datetime">
                                            <i className="fas fa-calendar-alt"></i> {new Date(meeting.date).toLocaleDateString()}
                                            <i className="fas fa-clock"></i> {new Date(meeting.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <Archive
                                            className={`md-icon-button ${loading ? 'disabled' : ''}`}
                                            onClick={(e) => {
                                                e.stopPropagation(); 
                                                !loading && handleArchiveMeeting(meeting.id, meeting.title);
                                            }}
                                            title="Archiver"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="md-glassy-card md-template-selection-card">
                        <h4>Utiliser un modèle de réunion</h4>
                        {loading && <p className="md-loading-message">Chargement des modèles...</p>}
                        {error && <div className="md-error-message">{error}</div>}
                        {templates.length === 0 && !loading && !error && (
                            <p className="md-no-items-message">Aucun modèle disponible.</p>
                        )}
                        <div className="md-templates-list">
                            {templates.map(template => (
                                <div
                                    key={template.id}
                                    className="md-template-card md-glassy-card"
                                    onClick={() => {
                                        setNewMeetingData(prev => ({
                                            ...prev,
                                            title: template.name || '',
                                            description: template.description || '',
                                            agenda: template.agenda || '',
                                            objectives: `${template.objectives || ''}${template.nonObjectives ? '\n\nNon-Objectifs:\n' + template.nonObjectives : ''}`
                                        }));
                                    }}
                                >
                                    <h5>{template.name}</h5>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="md-right-panel glass-effect">
                    {success && <div className="md-success-message">{success}</div>}
                    {error && <div className="md-error-message">{error}</div>}

                    <div className="md-glassy-card">
                        {selectedMeeting ? (
                            <>
                                <h4>Détails de la réunion</h4>
                                <div className="md-meeting-details">
                                    <div className="md-detail-item">
                                        <strong>Titre :</strong> {selectedMeeting.title}
                                    </div>
                                    <div className="md-detail-item">
                                        <strong>Projet :</strong> {projects.find(p => p.id === selectedMeeting.projectId)?.name || 'N/A'}
                                    </div>
                                    <div className="md-detail-item">
                                        <strong>Date :</strong> {new Date(selectedMeeting.date).toLocaleDateString()}
                                    </div>
                                    <div className="md-detail-item">
                                        <strong>Heure :</strong> {new Date(selectedMeeting.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div className="md-detail-item">
                                        <strong>Description :</strong>
                                        {selectedMeeting.description || 'Aucune description fournie.'}
                                    </div>
                                    <div className="md-detail-item">
                                        <strong>Agenda :</strong>
                                        {selectedMeeting.agenda ? (
                                            <table className="md-transparent-table">
                                                <tbody>
                                                    {selectedMeeting.agenda.split('\n').filter(item => item.trim() !== '').map((item, index) => (
                                                        <tr key={index}>
                                                            <td>{item}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <p>Aucun agenda fourni.</p>
                                        )}
                                    </div>
                                    <div className="md-detail-item">
                                        <strong>Objectifs & Non-Objectifs :</strong>
                                        {selectedMeeting.objectives ? (
                                            <table className="md-transparent-table">
                                                <tbody>
                                                    {selectedMeeting.objectives.split('\n').filter(item => item.trim() !== '').map((item, index) => (
                                                        <tr key={index}>
                                                            <td>{item}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <p>Aucun objectif fourni.</p>
                                        )}
                                    </div>
                                    <div className="md-detail-item">
                                        <strong>Participants :</strong>
                                        {loading ? (
                                            <p>Chargement des participants...</p>
                                        ) : meetingParticipants.length > 0 ? (
                                            <ul>
                                                {meetingParticipants.map(participant => (
                                                    <li key={participant.id}>
                                                        {participant.fullName} ({participant.email})
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p>Aucun participant associé.</p>
                                        )}
                                    </div>
                                    <button
                                        className="md-glass-button"
                                        onClick={handleBackToForm}
                                    >
                                        Retour au formulaire
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <h4>Planifier une nouvelle réunion</h4>
                                <form onSubmit={handleCreateMeeting}>
                                    <div className="md-form-group">
                                        <label htmlFor="meetingProject">Projet Associé</label>
                                        <select
                                            id="meetingProject"
                                            name="projectId"
                                            value={newMeetingData.projectId}
                                            onChange={handleNewMeetingChange}
                                            required
                                            disabled={projects.length === 0}
                                        >
                                            <option value="">-- Choisir un projet --</option>
                                            {projects.map(project => (
                                                <option key={project.id} value={project.id}>{project.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="md-form-group">
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
                                    <div className="md-form-row" style={{ display: 'flex', gap: '1rem' }}>
                                        <div className="md-form-group">
                                            <label
                                                className="md-description-card"
                                                onClick={handleOpenDescriptionModal}
                                                tabIndex="0"
                                                role="button"
                                                aria-label="Modifier la description"
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" || e.key === " ") {
                                                        handleOpenDescriptionModal();
                                                    }
                                                }}
                                            >
                                                Description
                                            </label>
                                        </div>
                                        <div className="md-form-group">
                                            <label
                                                className="md-agenda-card"
                                                onClick={handleOpenAgendaModal}
                                                tabIndex="0"
                                                role="button"
                                                aria-label="Modifier l'agenda"
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" || e.key === " ") {
                                                        handleOpenAgendaModal();
                                                    }
                                                }}
                                            >
                                                Agenda
                                            </label>
                                        </div>
                                        <div className="md-form-group">
                                            <label
                                                className="md-obj-card"
                                                onClick={handleOpenObjectivesModal}
                                                tabIndex="0"
                                                role="button"
                                                aria-label="Modifier les objectifs et non-objectifs"
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" || e.key === " ") {
                                                        handleOpenObjectivesModal();
                                                    }
                                                }}
                                            >
                                                Objectifs & Non-Objectifs
                                            </label>
                                        </div>
                                    </div>
                                    <div className="md-form-group">
                                        <label htmlFor="meetingDate">Date de la réunion</label>
                                        <input
                                            type="date"
                                            id="meetingDate"
                                            name="date"
                                            value={newMeetingData.date}
                                            onChange={handleNewMeetingChange}
                                            min={getTodayDate()} 
                                            required
                                        />
                                    </div>
                                    <div className="md-form-group md-half-width">
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
                                    <div className="md-form-group md-half-width">
                                        <label htmlFor="meetingDuration">Durée</label>
                                        <input
                                            type="time"
                                            id="meetingDuration"
                                            name="duration"
                                            value={newMeetingData.duration || ''}
                                            onChange={handleNewMeetingChange}
                                        />
                                    </div>
                                    <div className="md-form-group">
                                        <label>Inviter des participants</label>
                                        <CheckboxDropdown
                                            label="Participants"
                                            options={users}
                                            selectedValues={selectedParticipantIds}
                                            onChange={handleParticipantChange}

                                        />
                                        {users.length === 0 && !loading && <p className="md-hint-message">Aucun utilisateur à inviter.</p>}
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading || !getAuthToken() || projects.length === 0 || !newMeetingData.projectId}
                                        className="md-glass-button md-create-meeting-button"
                                    >
                                        {loading ? 'Planification...' : 'Planifier la réunion'}
                                    </button>
                                    {!getAuthToken() && <p className="md-auth-hint">Connectez-vous pour planifier une réunion.</p>}
                                    {projects.length === 0 && <p className="md-auth-hint">Créez un projet avant de planifier une réunion.</p>}
                                </form>
                                {newlyCreatedMeetingId && selectedParticipantIds.length > 0 && (
                                    <div className="md-send-invitations-section">
                                        <p>Réunion créée. Envoyez les invitations aux {selectedParticipantIds.length} participants sélectionnés :</p>
                                        <button
                                            className="md-glass-button md-send-invites-button"
                                            onClick={() => sendMeetingInvitations(newlyCreatedMeetingId, selectedParticipantIds)}
                                            disabled={sendingInvitations || loading}
                                        >
                                            {sendingInvitations ? 'Envoi en cours...' : 'Envoyer les invitations par Mail'}
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
            {showDescriptionModal && (
                <DescriptionModal
                    currentDescription={newMeetingData.description}
                    onSave={handleSaveDescription}
                    onCancel={() => setShowDescriptionModal(false)}
                />
            )}
        {showAgendaModal && (
            <AgendaModal
                agenda={parseAgendaStringToArray(newMeetingData.agenda)} 
                onSave={handleSaveAgenda}
                onCancel={() => setShowAgendaModal(false)}
            />
        )}
            {showObjectivesModal && (
                <ObjectivesModal
                    objectives={newMeetingData.objectives}
                    onSave={handleSaveObjectives}
                    onCancel={() => setShowObjectivesModal(false)}
                />
            )}
        </div>
    );
};

export default MeetingsDashboard;