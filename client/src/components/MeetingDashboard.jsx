import React, { useState, useEffect } from 'react';
import './MeetingDashboard.css'; // Nouveau fichier CSS

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
    templateId: '',
  });
  const [selectedMeetingIdForInvite, setSelectedMeetingIdForInvite] = useState(''); // Pour inviter à une réunion spécifique
  const [searchQuery, setSearchQuery] = useState(''); // Pour la recherche d'utilisateurs à inviter
  const [searchResults, setSearchResults] = useState([]);
  const [participantsToInvite, setParticipantsToInvite] = useState([]); // Liste des ID d'utilisateurs à inviter
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Suppression de useNavigate et getAuthToken

  useEffect(() => {
    fetchUserProjects();
    fetchTemplates();
  }, []);

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
    try {
      const response = await fetch('https://localhost:7212/api/Project');
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
        if (data.length > 0) {
          setSelectedProjectId(data[0].id); // Sélectionner le premier projet par défaut
        }
      } else {
        setError('Erreur lors de la récupération des projets.');
      }
    } catch (err) {
      setError('Erreur réseau ou du serveur pour les projets.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMeetingsForProject = async (projectId) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`https://localhost:7212/api/Meeting/project/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setMeetings(data);
      } else {
        setError('Erreur lors de la récupération des réunions.');
      }
    } catch (err) {
      setError('Erreur réseau ou du serveur pour les réunions.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    setLoading(true);
    setError('');
    // Simuler la récupération des templates
    const dummyTemplates = [
      { id: 'tpl1', name: 'Kick Off Meeting Template' },
      { id: 'tpl2', name: 'Project Closing Workshop Template' },
      { id: 'tpl3', name: 'Daily Standup Template' },
    ];
    setTemplates(dummyTemplates);
    setLoading(false);
  };

  const handleNewMeetingChange = (e) => {
    const { name, value } = e.target;
    setNewMeetingData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!selectedProjectId) {
      setError('Veuillez sélectionner un projet pour créer la réunion.');
      setLoading(false);
      return;
    }

    try {
      const meetingToCreate = {
        ...newMeetingData,
        projectId: selectedProjectId,
      };

      const response = await fetch('https://localhost:7212/api/Meeting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(meetingToCreate)
      });

      if (response.ok) {
        const createdMeeting = await response.json();
        setSuccess('Réunion créée avec succès !');
        setNewMeetingData({
          title: '', date: '', startTime: '', finishTime: '', type: '', location: '', templateId: ''
        });
        fetchMeetingsForProject(selectedProjectId); // Rafraîchir les réunions
        setSelectedMeetingIdForInvite(createdMeeting.id); // Sélectionner la nouvelle réunion pour l'invitation
      } else {
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

  // Recherche d'utilisateurs simulée
  const handleSearchUsers = async () => {
    setLoading(true);
    setError('');
    const dummyUsers = [
      { id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', email: 'alice@example.com' },
      { id: 'f0e9d8c7-b6a5-4321-fedc-ba9876543210', email: 'bob@example.com' },
      { id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890', email: 'christian.lackner@example.com' },
      { id: '7e8f9a0b-1c2d-3e4f-5a6b-7c8d9e0f1a2b', email: 'test@example.com' },
    ];
    setSearchResults(dummyUsers.filter(user => user.email.toLowerCase().includes(searchQuery.toLowerCase())));
    setLoading(false);
  };

  const handleAddUserToInviteList = (userId) => {
    if (!participantsToInvite.includes(userId)) {
      setParticipantsToInvite(prev => [...prev, userId]);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const handleRemoveUserFromInviteList = (userId) => {
    setParticipantsToInvite(prev => prev.filter(id => id !== userId));
  };

  const handleInviteParticipants = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!selectedMeetingIdForInvite || participantsToInvite.length === 0) {
      setError('Veuillez sélectionner une réunion et des participants.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`https://localhost:7212/api/Meeting/${selectedMeetingIdForInvite}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(participantsToInvite)
      });

      if (response.ok) {
        setSuccess('Invitations envoyées avec succès !');
        setParticipantsToInvite([]);
      } else {
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

  return (
    <div className="meeting-dashboard-container">
      {/* Top Bar */}
      <div className="top-bar">
        <div className="menu-tabs">
          <button className="tab-button">Initiate</button>
          <button className="tab-button active">Meetings</button>
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
                <li key={template.id}>{template.name}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Panel */}
        <div className="right-panel">
          {success && <div className="success-message">{success}</div>}
          {error && <div className="error-message">{error}</div>}

          <div className="section create-meeting-section">
            <h4>Créer une nouvelle réunion</h4>
            <form onSubmit={handleCreateMeeting}>
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
              <div className="form-group">
                <label htmlFor="meetingTemplate">Choisir un template</label>
                <select
                  id="meetingTemplate"
                  name="templateId"
                  value={newMeetingData.templateId}
                  onChange={handleNewMeetingChange}
                >
                  <option value="">-- Aucun template --</option>
                  {templates.map(template => (
                    <option key={template.id} value={template.id}>{template.name}</option>
                  ))}
                </select>
              </div>
              <button type="submit" disabled={loading}>
                {loading ? 'Création...' : 'Créer la réunion'}
              </button>
            </form>
          </div>

          <div className="section invite-participants-section">
            <h4>Inviter des participants à la réunion</h4>
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
              <label htmlFor="searchUserInput">Rechercher utilisateur par email</label>
              <input
                type="text"
                id="searchUserInput"
                placeholder="Ex: christian.lackner@example.com"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <button type="button" onClick={handleSearchUsers} disabled={loading || !searchQuery}>
                Rechercher
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="search-results">
                <h5>Résultats de la recherche :</h5>
                <ul>
                  {searchResults.map(user => (
                    <li key={user.id}>
                      {user.email}{' '}
                      <button type="button" onClick={() => handleAddUserToInviteList(user.id)}>
                        Ajouter
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {participantsToInvite.length > 0 && (
              <div className="invite-list">
                <h5>Participants à inviter :</h5>
                <ul>
                  {participantsToInvite.map(userId => {
                    const user = searchResults.find(u => u.id === userId);
                    return (
                      <li key={userId}>
                        {user ? user.email : userId}{' '}
                        <button type="button" onClick={() => handleRemoveUserFromInviteList(userId)}>
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
              disabled={loading || !selectedMeetingIdForInvite || participantsToInvite.length === 0}
            >
              {loading ? 'Envoi...' : 'Envoyer les invitations'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingDashboard;
