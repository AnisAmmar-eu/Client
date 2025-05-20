import React, { useState, useEffect } from 'react';
import './TaskDashboard.css'; // Nouveau fichier CSS

const TaskDashboard = () => {
  const [projects, setProjects] = useState([]); // Pour le sélecteur de projet
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [meetings, setMeetings] = useState([]); // Pour le sélecteur de réunion
  const [selectedMeetingId, setSelectedMeetingId] = useState('');
  const [tasks, setTasks] = useState([]);
  const [newTaskData, setNewTaskData] = useState({
    title: '',
    dueDate: '',
    priority: 'Normal', // Default priority
    assignedToUserId: '', // User ID for assignment
  });
  const [searchQuery, setSearchQuery] = useState(''); // For user search (again, for assignment)
  const [searchResults, setSearchResults] = useState([]); // User search results
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Suppression de useNavigate et getAuthToken

  useEffect(() => {
    fetchUserProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchMeetingsForProject(selectedProjectId);
    } else {
      setMeetings([]);
      setTasks([]); // Clear tasks if no project selected
      setSelectedMeetingId(''); // Clear selected meeting
    }
  }, [selectedProjectId]);

  useEffect(() => {
    if (selectedMeetingId) {
      fetchTasksForMeeting(selectedMeetingId);
    } else {
      setTasks([]); // Clear tasks if no meeting selected
    }
  }, [selectedMeetingId]);

  const fetchUserProjects = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/Project');
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
        if (data.length > 0) {
          setSelectedProjectId(data[0].id); // Select first project by default
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
      const response = await fetch(`/api/Meeting/project/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setMeetings(data);
        if (data.length > 0) {
          setSelectedMeetingId(data[0].id); // Select first meeting by default
        }
      } else {
        setError('Erreur lors de la récupération des réunions.');
      }
    } catch (err) {
      setError('Erreur réseau ou du serveur pour les réunions.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTasksForMeeting = async (meetingId) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/Task/meeting/${meetingId}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      } else {
        setError('Erreur lors de la récupération des tâches.');
      }
    } catch (err) {
      setError('Erreur réseau ou du serveur pour les tâches.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewTaskChange = (e) => {
    const { name, value } = e.target;
    setNewTaskData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!selectedMeetingId) {
      setError('Veuillez sélectionner une réunion pour créer la tâche.');
      setLoading(false);
      return;
    }
    if (!newTaskData.title.trim() || !newTaskData.dueDate || !newTaskData.assignedToUserId) {
      setError('Veuillez remplir tous les champs obligatoires (Titre, Date d\'échéance, Assigné à).');
      setLoading(false);
      return;
    }

    try {
      const taskToCreate = {
        ...newTaskData,
        meetingId: selectedMeetingId,
      };

      const response = await fetch('/api/Task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskToCreate)
      });

      if (response.ok) {
        setSuccess('Tâche créée avec succès !');
        setNewTaskData({ title: '', dueDate: '', priority: 'Normal', assignedToUserId: '' });
        setSearchQuery('');
        setSearchResults([]);
        fetchTasksForMeeting(selectedMeetingId); // Refresh tasks
      } else {
        const errorText = await response.text();
        setError(`Erreur lors de la création de la tâche: ${errorText}`);
      }
    } catch (err) {
      setError('Erreur réseau ou du serveur.');
      console.error('Create task error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fonction SIMULÉE de recherche d'utilisateurs (réutilise les données factices)
  const handleSearchUsers = async () => {
    setLoading(true);
    setError('');
    const dummyUsers = [
      { id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', email: 'alice@example.com', fullName: 'Alice Wonderland' },
      { id: 'f0e9d8c7-b6a5-4321-fedc-ba9876543210', email: 'bob@example.com', fullName: 'Bob The Builder' },
      { id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890', email: 'christian.lackner@example.com', fullName: 'Christian Lackner' },
      { id: '7e8f9a0b-1c2d-3e4f-5a6b-7c8d9e0f1a2b', email: 'test@example.com', fullName: 'Test User' },
    ];
    // Filter by full name or email
    const filteredUsers = dummyUsers.filter(user =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setSearchResults(filteredUsers);
    setLoading(false);
  };

  return (
    <div className="task-dashboard-container">
      {/* Top Bar */}
      <div className="top-bar">
        <div className="menu-tabs">
          <button className="tab-button">Initiate</button>
          <button className="tab-button">Meetings</button>
          <button className="tab-button active">Tasks</button>
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

          {/* Sélecteur de projet */}
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

          {/* Sélecteur de réunion */}
          <div className="meeting-select-group form-group">
            <label htmlFor="selectMeeting">Sélectionner une réunion</label>
            <select
              id="selectMeeting"
              value={selectedMeetingId}
              onChange={(e) => setSelectedMeetingId(e.target.value)}
              required
              disabled={!selectedProjectId}
            >
              <option value="">-- Choisir une réunion --</option>
              {meetings.map(meeting => (
                <option key={meeting.id} value={meeting.id}>
                  {meeting.title} ({new Date(meeting.date).toLocaleDateString()})
                </option>
              ))}
            </select>
            {!selectedProjectId && <p className="hint-message">Sélectionnez un projet d'abord.</p>}
            {selectedProjectId && meetings.length === 0 && !loading && <p className="no-items-message">Aucune réunion pour ce projet.</p>}
          </div>

          <h3>Tâches de la réunion</h3>
          <ul className="task-list">
            {tasks.length === 0 && !loading && !error && selectedMeetingId && <p className="no-items-message">Aucune tâche pour cette réunion.</p>}
            {tasks.map(task => (
              <li key={task.id} className={`priority-${task.priority.toLowerCase()}`}>
                <strong>{task.title}</strong>
                <span className="task-meta">
                  Due: {new Date(task.dueDate).toLocaleDateString()} |
                  Assigné à: {task.assignedTo?.fullName || 'N/A'} |
                  Priorité: {task.priority}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right Panel */}
        <div className="right-panel">
          {success && <div className="success-message">{success}</div>}
          {error && <div className="error-message">{error}</div>}

          {/* Créer une nouvelle tâche */}
          <div className="section create-task-section">
            <h4>Créer une nouvelle tâche</h4>
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label htmlFor="taskTitle">Titre de la tâche</label>
                <input
                  type="text"
                  id="taskTitle"
                  name="title"
                  value={newTaskData.title}
                  onChange={handleNewTaskChange}
                  placeholder="Ex: Préparer la présentation"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="taskDueDate">Date d'échéance</label>
                <input
                  type="date"
                  id="taskDueDate"
                  name="dueDate"
                  value={newTaskData.dueDate}
                  onChange={handleNewTaskChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="taskPriority">Priorité</label>
                <select
                  id="taskPriority"
                  name="priority"
                  value={newTaskData.priority}
                  onChange={handleNewTaskChange}
                >
                  <option value="Low">Basse</option>
                  <option value="Normal">Normale</option>
                  <option value="High">Haute</option>
                  <option value="Urgent">Urgente</option>
                </select>
              </div>

              {/* Assigner la tâche */}
              <div className="form-group search-user-group">
                <label htmlFor="assignToUser">Assigner à</label>
                <input
                  type="text"
                  id="assignToUser"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher par nom ou email"
                />
                <button type="button" onClick={handleSearchUsers} disabled={loading || !searchQuery.trim()}>
                  Rechercher
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className="search-results-list">
                  <label>Sélectionner un responsable:</label>
                  <select
                    id="selectAssignedUser"
                    name="assignedToUserId"
                    value={newTaskData.assignedToUserId}
                    onChange={handleNewTaskChange}
                    required
                  >
                    <option value="">-- Choisir un utilisateur --</option>
                    {searchResults.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.fullName} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {searchResults.length === 0 && searchQuery.trim() && !loading && (
                <p className="no-results">Aucun utilisateur trouvé pour "{searchQuery}".</p>
              )}
              {newTaskData.assignedToUserId && (
                <p className="selected-user-hint">
                  Assigné à: {searchResults.find(u => u.id === newTaskData.assignedToUserId)?.fullName || 'N/A'}
                </p>
              )}

              <button type="submit" disabled={loading || !selectedMeetingId}>
                {loading ? 'Création...' : 'Créer la tâche'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDashboard;
