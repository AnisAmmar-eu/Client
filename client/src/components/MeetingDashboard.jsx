import React, { useState, useEffect } from 'react';
import './MeetingDashboard.css'; // Nouveau fichier CSS
import { useNavigate } from 'react-router-dom'; // Importez useNavigate

const MeetingDashboard = () => {
    const [projects, setProjects] = useState([]); // Pour le sélecteur de projet
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [meetings, setMeetings] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [newMeetingData, setNewMeetingData] = useState({
        title: '',
        date: '',
        startTime: '',
        finishTime: '',
        type: '',
        location: '',
        templateId: '', // Keep as empty string for optional
    });
    // NEW STATE: For notes section fields
    const [meetingNotesData, setMeetingNotesData] = useState({
        agenda: '',
        objectives: '',
        nonObjectives: '',
    });

    const [selectedMeetingIdForInvite, setSelectedMeetingIdForInvite] = useState(''); // Pour inviter à une réunion spécifique
    const [searchQuery, setSearchQuery] = useState(''); // Pour la recherche d'utilisateurs à inviter
    const [searchResults, setSearchResults] = useState([]);
    // MODIFICATION ICI: participantsToInvite stocke maintenant des objets utilisateur
    const [participantsToInvite, setParticipantsToInvite] = useState([]); // Liste des objets utilisateur à inviter {id, email, userName}
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // State for collapsible sections
    const [isCreateMeetingOpen, setIsCreateMeetingOpen] = useState(true); // Open by default
    const [isInviteParticipantsOpen, setIsInviteParticipantsOpen] = useState(true); // Open by default
    const [isMeetingNotesOpen, setIsMeetingNotesOpen] = useState(false); // NEW: State for Meeting Notes section


    const navigate = useNavigate(); // Initialisez useNavigate

    // obtenir token d'auth
    const getAuthToken = () => localStorage.getItem('authToken');

    // Vérifie l'auth au chargement du composant et avant chaque fetch
    useEffect(() => {
        const token = getAuthToken();
        if (!token) {
            navigate('/login'); // Si pas de token, redirige vers la page de connexion
        } else {
            fetchUserProjects();
            fetchTemplates();
        }
    }, [navigate]); // Ajouter navigate comme dépendance pour éviter les warnings

    useEffect(() => {
        if (selectedProjectId) {
            fetchMeetingsForProject(selectedProjectId);
        } else {
            setMeetings([]); // Effacer les réunions si aucun projet n'est sélectionné
        }
    }, [selectedProjectId]);

    const fetchUserProjects = async () => {
        setLoading(true);
        setError('');
        const token = getAuthToken(); // Récupérer le token

        if (!token) { // Vérifier la présence du token avant la requête
            setError('Non autorisé : connectez-vous pour accéder aux projets.');
            setLoading(false);
            navigate('/login');
            return;
        }

        try {
            const response = await fetch('https://localhost:7212/api/Project/projects', { // Endpoint pour les projets de l'utilisateur
                headers: {
                    'Authorization': `Bearer ${token}` // Inclure le token
                }
            });
            if (response.ok) {
                const data = await response.json();
                setProjects(data.$values || data); // Gérer le format $values de .NET
                if ((data.$values || data).length > 0) {
                    setSelectedProjectId((data.$values || data)[0].id); // Sélectionner le premier projet par default
                }
            } else if (response.status === 401) {
                setError("Session expirée ou non autorisé. Veuillez vous reconnecter.");
                localStorage.removeItem('authToken');
                navigate('/login');
            }
            else {
                setError('Erreur lors de la récupération des projets.');
            }
        } catch (err) {
            setError('Erreur réseau ou du serveur pour les projets.');
            console.error('Fetch user projects error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMeetingsForProject = async (projectId) => {
        setLoading(true);
        setError('');
        const token = getAuthToken(); // Récupérer le token

        if (!token) { // Vérifier la présence du token
            setError('Non autorisé : connectez-vous pour accéder aux réunions.');
            setLoading(false);
            navigate('/login');
            return;
        }

        try {
            const response = await fetch(`https://localhost:7212/api/Meeting/project/${projectId}`, {
                headers: {
                    'Authorization': `Bearer ${token}` // Inclure le token
                }
            });
            if (response.ok) {
                const data = await response.json();
                setMeetings(data.$values || data); // Gérer le format $values
            } else if (response.status === 401) {
                setError("Session expirée ou non autorisé. Veuillez vous reconnecter.");
                localStorage.removeItem('authToken');
                navigate('/login');
            }
            else {
                setError('Erreur lors de la récupération des réunions.');
            }
        } catch (err) {
            setError('Erreur réseau ou du serveur pour les réunions.');
            console.error('Fetch meetings for project error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchTemplates = async () => {
        setLoading(true);
        setError('');
        const token = getAuthToken(); // Récupérer le token

        if (!token) { // Vérifier la présence du token
            setError('Non autorisé : connectez-vous pour accéder aux templates.');
            setLoading(false);
            navigate('/login');
            return;
        }
        const dummyTemplates = [
            { id: 'tpl1', name: 'Kick Off Meeting Template', title: 'Project Kick-off', type: 'Workshop', location: 'Main Conference Room', agenda: 'Introduction, Goals, Team Roles, Project Scope', objectives: 'Align on project vision; Define initial roadmap', nonObjectives: 'Detailed technical discussion; Individual task assignment' },
            { id: 'tpl2', name: 'Project Closing Workshop Template', title: 'Project Closure Review', type: 'Review', location: 'Online (Teams)', agenda: 'Lessons Learned, Final Deliverables, Budget Review', objectives: 'Document success and failures; Formal project closure', nonObjectives: 'New project planning; Future resource allocation' },
            { id: 'tpl3', name: 'Daily Standup Template', title: 'Daily Standup', type: 'Scrum', location: 'Online (Zoom)', agenda: 'What I did yesterday, What I will do today, Impediments', objectives: 'Daily progress sync; Identify blockers', nonObjectives: 'Problem-solving discussions; Detailed status reports' },
        ];
        setTemplates(dummyTemplates);
        setLoading(false);
    };

    const handleNewMeetingChange = (e) => {
        const { name, value } = e.target;
        setNewMeetingData(prev => ({ ...prev, [name]: value }));
    };

    // Handler for notes section fields
    const handleMeetingNotesChange = (e) => {
        const { name, value } = e.target;
        setMeetingNotesData(prev => ({ ...prev, [name]: value }));
    };

    // Function to load template data into the form
    const handleSelectTemplate = (templateId) => {
        const selectedTemplate = templates.find(t => t.id === templateId);
        if (selectedTemplate) {
            setNewMeetingData(prev => ({
                ...prev,
                title: selectedTemplate.title || '',
                type: selectedTemplate.type || '',
                location: selectedTemplate.location || '',
                templateId: selectedTemplate.id,

            }));
            // Load template data into meetingNotesData
            setMeetingNotesData({
                agenda: selectedTemplate.agenda || '',
                objectives: selectedTemplate.objectives || '',
                nonObjectives: selectedTemplate.nonObjectives || '',
            });
            setSuccess(`Template '${selectedTemplate.name}' chargé.`);
            setError('');
        } else {
            setNewMeetingData(prev => ({
                ...prev,
                title: '', date: '', startTime: '', finishTime: '', type: '', location: '',
                templateId: '', // Clear templateId
            }));
            // Clear meetingNotesData
            setMeetingNotesData({
                agenda: '', objectives: '', nonObjectives: ''
            });
            setSuccess('Formulaire effacé des données de template.');
        }
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

        if (!selectedProjectId) {
            setError('Veuillez sélectionner un projet pour créer la réunion.');
            setLoading(false);
            return;
        }

        if (!newMeetingData.title || !newMeetingData.date || !newMeetingData.startTime || !newMeetingData.finishTime) {
            setError('Veuillez remplir tous les champs obligatoires (Titre, Date, Heure de début, Heure de fin).');
            setLoading(false);
            return;
        }

        try {
            const meetingToCreate = {
                ...newMeetingData,
                projectId: selectedProjectId,
                // Include notes data in the meeting object
                agenda: meetingNotesData.agenda,
                objectives: meetingNotesData.objectives,
                nonObjectives: meetingNotesData.nonObjectives,
            };

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
                setSuccess('Réunion créée avec succès !');
                setNewMeetingData({
                    title: '', date: '', startTime: '', finishTime: '', type: '', location: '', templateId: ''
                });
                // Clear notes data after meeting creation
                setMeetingNotesData({
                    agenda: '', objectives: '', nonObjectives: ''
                });
                fetchMeetingsForProject(selectedProjectId);
                setSelectedMeetingIdForInvite(createdMeeting.id);
            } else if (response.status === 401) {
                setError("Session expirée ou non autorisé. Veuillez vous reconnecter.");
                localStorage.removeItem('authToken');
                navigate('/login');
            }
            else {
                const errorText = await response.text();
                setError(`Erreur lors de la création de la réunion: ${errorText}`);
            }
        } catch (err) {
            setError('Erreur réseau ou du serveur.');
            console.error('Create meeting error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Recherche d'utilisateurs via l'API AuthController
    const handleSearchUsers = async () => {
        setLoading(true);
        setError('');
        const token = getAuthToken();

        if (!token) {
            setError('Vous devez être connecté pour rechercher des utilisateurs.');
            setLoading(false);
            navigate('/login');
            return;
        }

        if (!searchQuery.trim()) {
            setError('Veuillez entrer un terme de recherche pour les utilisateurs.');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`https://localhost:7212/api/Auth/users/search?query=${searchQuery}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setSearchResults(data.$values || data || []);
            } else if (response.status === 401) {
                setError("Session expirée ou non autorisé. Veuillez vous reconnecter.");
                localStorage.removeItem('authToken');
                navigate('/login');
            }
            else {
                const errorText = await response.text();
                setError(`Erreur lors de la recherche des utilisateurs: ${errorText}`);
                setSearchResults([]);
            }
        } catch (err) {
            setError('Erreur réseau ou du serveur.');
            console.error('Search users error:', err);
            setSearchResults([]);
        } finally {
            setLoading(false);
        }
    };

    // MODIFICATION ICI: handleAddUserToInviteList accepte un objet utilisateur
    const handleAddUserToInviteList = (userToAdd) => {
        if (!participantsToInvite.some(p => p.id === userToAdd.id)) {
            setParticipantsToInvite(prev => [...prev, userToAdd]); // Ajoute l'objet utilisateur entier
            setSearchQuery('');
            setSearchResults([]);
        }
    };

    // MODIFICATION ICI: handleRemoveUserFromInviteList filtre par l'ID de l'objet utilisateur
    const handleRemoveUserFromInviteList = (userIdToRemove) => {
        setParticipantsToInvite(prev => prev.filter(user => user.id !== userIdToRemove));
    };

    const handleInviteParticipants = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        const token = getAuthToken();

        if (!token) {
            setError('Vous devez être connecté pour envoyer des invitations.');
            setLoading(false);
            navigate('/login');
            return;
        }

        if (!selectedMeetingIdForInvite || participantsToInvite.length === 0) {
            setError('Veuillez sélectionner une réunion et des participants.');
            setLoading(false);
            return;
        }

        // MODIFICATION ICI: Mapper la liste pour n'envoyer que les IDs au backend
        const participantIdsToSend = participantsToInvite.map(p => p.id);

        try {
            const response = await fetch(`https://localhost:7212/api/Meeting/${selectedMeetingIdForInvite}/invite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(participantIdsToSend) // Envoyer la liste des IDs
            });

            if (response.ok) {
                setSuccess('Invitations envoyées avec succès !');
                setParticipantsToInvite([]); // Effacer la liste après l'envoi réussi
            } else if (response.status === 401) {
                setError("Session expirée ou non autorisé. Veuillez vous reconnecter.");
                localStorage.removeItem('authToken');
                navigate('/login');
            }
            else {
                const errorText = await response.text();
                setError(`Erreur lors de l'envoi des invitations: ${errorText}`);
            }
        } catch (err) {
            setError('Erreur réseau ou du serveur.');
            console.error('Invite participants error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        navigate('/login');
    };

    return (
        <div className="meeting-dashboard-container">
            {/* Top Bar */}
            <div className="top-bar">
                <div className="menu-tabs">
                    <button className="tab-button" onClick={() => navigate('/project')}>Initiate</button>
                    <button className="tab-button active">Meetings</button>
                    <button className="tab-button">Tasks</button>
                    <button className="tab-button">Archive</button>
                    <button className="tab-button add-tab">+</button>
                </div>
                <div className="user-settings">
                    <button className="icon-button"><i className="fas fa-search"></i></button>
                    <button className="icon-button"><i className="fas fa-cog"></i></button>
                    <button className="icon-button" onClick={handleLogout} title="Déconnexion">
                        <i className="fas fa-sign-out-alt"></i>
                    </button>
                    <button className="icon-button"><i className="fas fa-question-circle"></i></button>
                </div>
            </div>

            <div className="main-content">
                {/* Left Panel */}
                <div className="left-panel">
                    {loading && <p className="loading-message">Chargement...</p>}
                    {error && <div className="error-message">{error}</div>}

                    <div className="project-select-group form-group">
                        <label htmlFor="selectProject">Sélectionner un projet</label>
                        <select
                            id="selectProject"
                            value={selectedProjectId}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                            required
                        >
                            <option value="">-- Choisir un projet --</option>
                            {projects.map(project => (
                                <option key={project.id} value={project.id}>{project.name}</option>
                            ))}
                        </select>
                    </div>

                    <h3>Réunions du projet</h3>
                    <ul className="meeting-list">
                        {meetings.length === 0 && !loading && !error && <p className="no-items-message">Aucune réunion pour ce projet.</p>}
                        {meetings.map(meeting => (
                            <li key={meeting.id} onClick={() => setSelectedMeetingIdForInvite(meeting.id)}
                                className={selectedMeetingIdForInvite === meeting.id ? 'active' : ''}>
                                {meeting.title} ({new Date(meeting.date).toLocaleDateString()})
                            </li>
                        ))}
                    </ul>

                    <div className="templates-section">
                        <h3>Templates de réunions</h3>
                        <ul className="template-list">
                            {templates.length === 0 && !loading && !error && <p className="no-items-message">Aucun template disponible.</p>}
                            {templates.map(template => (
                                <li key={template.id} onClick={() => handleSelectTemplate(template.id)} className="template-item">
                                    {template.name}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Right Panel */}
                <div className="right-panel">
                    {success && <div className="success-message">{success}</div>}
                    {error && <div className="error-message">{error}</div>}

                    {/* Collapsible Section: Create Meeting */}
                    <div className="section create-meeting-section">
                        <h4 onClick={() => setIsCreateMeetingOpen(!isCreateMeetingOpen)} className="section-header">
                            Créer une nouvelle réunion
                            <i className={`fas fa-chevron-right toggle-icon ${isCreateMeetingOpen ? 'rotated' : ''}`}></i>
                        </h4>
                        {isCreateMeetingOpen && (
                            <form onSubmit={handleCreateMeeting} className="section-content">
                                <div className="form-group">
                                    <label htmlFor="meetingTitle">Titre de la réunion</label>
                                    <input
                                        type="text"
                                        id="meetingTitle"
                                        name="title"
                                        value={newMeetingData.title}
                                        onChange={handleNewMeetingChange}
                                        placeholder="Ex: Réunion de lancement du Projet X"
                                        required
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
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
                                    <div className="form-group">
                                        <label htmlFor="startTime">Heure de début</label>
                                        <input
                                            type="time"
                                            id="startTime"
                                            name="startTime"
                                            value={newMeetingData.startTime}
                                            onChange={handleNewMeetingChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="finishTime">Heure de fin</label>
                                        <input
                                            type="time"
                                            id="finishTime"
                                            name="finishTime"
                                            value={newMeetingData.finishTime}
                                            onChange={handleNewMeetingChange}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="meetingType">Type</label>
                                        <input
                                            type="text"
                                            id="meetingType"
                                            name="type"
                                            value={newMeetingData.type}
                                            onChange={handleNewMeetingChange}
                                            placeholder="Ex: Conférence, Atelier"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="meetingLocation">Lieu</label>
                                        <input
                                            type="text"
                                            id="meetingLocation"
                                            name="location"
                                            value={newMeetingData.location}
                                            onChange={handleNewMeetingChange}
                                            placeholder="Ex: Salle 301, Visio"
                                        />
                                    </div>
                                </div>

                                {/* Removed agenda, objectives, nonObjectives from here */}

                                <button type="submit" disabled={loading || !getAuthToken()}>
                                    {loading ? 'Création...' : 'Créer la réunion'}
                                </button>
                                {!getAuthToken() && <p className="auth-hint">Connectez-vous pour créer une réunion.</p>}
                            </form>
                        )}
                    </div>

                    {/* Collapsible Section: Invite Participants */}
                    <div className="section invite-participants-section">
                        <h4 onClick={() => setIsInviteParticipantsOpen(!isInviteParticipantsOpen)} className="section-header">
                            Inviter des participants à la réunion
                            <i className={`fas fa-chevron-right toggle-icon ${isInviteParticipantsOpen ? 'rotated' : ''}`}></i>
                        </h4>
                        {isInviteParticipantsOpen && (
                            <div className="section-content">
                                <div className="form-group">
                                    <label htmlFor="selectMeetingToInvite">Réunion à laquelle inviter</label>
                                    <select
                                        id="selectMeetingToInvite"
                                        value={selectedMeetingIdForInvite}
                                        onChange={(e) => setSelectedMeetingIdForInvite(e.target.value)}
                                    >
                                        <option value="">-- Choisir une réunion --</option>
                                        {meetings.map(meeting => (
                                            <option key={meeting.id} value={meeting.id}>
                                                {meeting.title} ({new Date(meeting.date).toLocaleDateString()})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group search-users-group">
                                    <label htmlFor="searchUserInput">Rechercher utilisateur</label>
                                    <input
                                        type="text"
                                        id="searchUserInput"
                                        placeholder="Ex: christian.lackner@example.com"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                    <button type="button" onClick={handleSearchUsers} disabled={loading || !searchQuery.trim() || !getAuthToken()}>
                                        Rechercher
                                    </button>
                                    {!getAuthToken() && <p className="auth-hint">Connectez-vous pour rechercher des utilisateurs.</p>}
                                </div>

                                {searchResults.length > 0 && (
                                    <div className="search-results">
                                        <h5>Résultats de la recherche :</h5>
                                        <ul>
                                            {searchResults.map(user => (
                                                <li key={user.id}>
                                                    {user.email} {user.userName ? `(${user.userName})` : ''}{' '}
                                                    <button type="button" onClick={() => handleAddUserToInviteList(user)}> {/* MODIFICATION ICI: Passer l'objet user complet */}
                                                        Ajouter
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {searchResults.length === 0 && searchQuery.trim() && !loading && (
                                    <p className="no-results">Aucun utilisateur trouvé pour "{searchQuery}".</p>
                                )}

                                {participantsToInvite.length > 0 && (
                                    <div className="invite-list">
                                        <h5>Participants à inviter :</h5>
                                        <ul>
                                            {participantsToInvite.map(participant => { // MODIFICATION ICI: 'participant' est maintenant un objet user
                                                return (
                                                    <li key={participant.id}> {/* Utiliser participant.id pour la key */}
                                                        {participant.email} {participant.userName ? `(${participant.userName})` : ''}{' '} {/* Accéder directement aux propriétés */}
                                                        <button type="button" onClick={() => handleRemoveUserFromInviteList(participant.id)}>
                                                            Retirer
                                                        </button>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={handleInviteParticipants}
                                    disabled={loading || !selectedMeetingIdForInvite || participantsToInvite.length === 0 || !getAuthToken()}
                                >
                                    {loading ? 'Envoi...' : 'Envoyer les invitations'}
                                </button>
                                {!getAuthToken() && <p className="auth-hint">Connectez-vous pour envoyer des invitations.</p>}
                            </div>
                        )}
                    </div>

                    {/* Collapsible Section: Meeting Notes (Now includes Agenda, Objectives, Non-Objectives) */}
                    <div className="section meeting-notes-section">
                        <h4 onClick={() => setIsMeetingNotesOpen(!isMeetingNotesOpen)} className="section-header">
                            Notes de réunion
                            <i className={`fas fa-chevron-right toggle-icon ${isMeetingNotesOpen ? 'rotated' : ''}`}></i>
                        </h4>
                        {isMeetingNotesOpen && (
                            <div className="section-content">
                                <p>Ces champs peuvent être pré-remplis si un template est sélectionné.</p>
                                <div className="form-group">
                                    <label htmlFor="meetingAgenda">Agenda</label>
                                    <textarea
                                        id="meetingAgenda"
                                        name="agenda"
                                        value={meetingNotesData.agenda}
                                        onChange={handleMeetingNotesChange}
                                        placeholder="Ex: Introduction, Présentation des objectifs, Discussion..."
                                        rows="3"
                                    ></textarea>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="meetingObjectives">Objectifs (Ce que la réunion doit accomplir)</label>
                                    <textarea
                                        id="meetingObjectives"
                                        name="objectives"
                                        value={meetingNotesData.objectives}
                                        onChange={handleMeetingNotesChange}
                                        placeholder="Ex: Décider de la stratégie X; Valider le plan Y"
                                        rows="3"
                                    ></textarea>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="meetingNonObjectives">Non-Objectifs (Ce que la réunion ne doit PAS faire)</label>
                                    <textarea
                                        id="meetingNonObjectives"
                                        name="nonObjectives"
                                        value={meetingNotesData.nonObjectives}
                                        onChange={handleMeetingNotesChange}
                                        placeholder="Ex: Ne pas discuter de détails techniques de l'implémentation; Ne pas débattre du budget"
                                        rows="3"
                                    ></textarea>
                                </div>
                                {/* You can add a save button for notes here if they can be edited independently */}
                                {/* <button type="button">Sauvegarder les notes</button> */}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default MeetingDashboard;