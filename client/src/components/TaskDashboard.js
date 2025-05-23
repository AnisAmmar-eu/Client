// src/components/TaskDashboard.js
import React, { useState, useEffect } from 'react';
import './TaskDashboard.css';
import { useNavigate } from 'react-router-dom';

const TaskDashboard = () => {
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [meetings, setMeetings] = useState([]);
    const [selectedMeetingId, setSelectedMeetingId] = useState('');
    const [tasks, setTasks] = useState([]);
    const [newTaskData, setNewTaskData] = useState({
        title: '',
        description: '',
        dueDate: '',
        priority: 'Normal',
        assignedToUserId: ''
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedAssignedUserName, setSelectedAssignedUserName] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // *** NOUVEAU: État pour le filtre de tâches ***
    const [currentFilter, setCurrentFilter] = useState('all'); // 'all', 'today', 'thisWeek', 'urgent', 'assignedToMe'

    const navigate = useNavigate();

    const getAuthToken = () => localStorage.getItem('authToken');
    const getUserId = () => localStorage.getItem('userId'); // Assuming you store userId in localStorage

    useEffect(() => {
        const token = getAuthToken();
        if (!token) {
            navigate('/login');
        } else {
            fetchProjects();
        }
    }, [navigate]);

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
                setProjects(data.$values || data);
                if ((data.$values || data).length > 0) {
                    setSelectedProjectId((data.$values || data)[0].id);
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

    useEffect(() => {
        const fetchMeetings = async () => {
            if (!selectedProjectId) {
                setMeetings([]);
                setSelectedMeetingId('');
                return;
            }
            setLoading(true);
            setError('');
            const token = getAuthToken();
            try {
                const response = await fetch(`https://localhost:7212/api/Meeting/project/${selectedProjectId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setMeetings(data.$values || data);
                    if ((data.$values || data).length > 0) {
                        setSelectedMeetingId((data.$values || data)[0].id);
                    } else {
                        setSelectedMeetingId('');
                    }
                } else if (response.status === 401) {
                    setError("Session expirée ou non autorisé. Veuillez vous reconnecter.");
                    localStorage.removeItem('authToken');
                    navigate('/login');
                } else {
                    setError('Erreur lors de la récupération des réunions.');
                }
            } catch (err) {
                setError('Erreur réseau ou du serveur.');
                console.error('Fetch meetings error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchMeetings();
    }, [selectedProjectId, navigate]);

    const fetchTasks = async () => {
        if (!selectedMeetingId) {
            setTasks([]);
            return;
        }
        setLoading(true);
        setError('');
        const token = getAuthToken();
        try {
            const response = await fetch(`https://localhost:7212/api/Task/meeting/${selectedMeetingId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setTasks(data.$values || data);
            } else if (response.status === 401) {
                setError("Session expirée ou non autorisé. Veuillez vous reconnecter.");
                localStorage.removeItem('authToken');
                navigate('/login');
            } else {
                setError('Erreur lors de la récupération des tâches.');
            }
        } catch (err) {
            setError('Erreur réseau ou du serveur.');
            console.error('Fetch tasks error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, [selectedMeetingId, navigate]);


    const handleNewTaskChange = (e) => {
        const { name, value } = e.target;
        setNewTaskData(prevData => ({ ...prevData, [name]: value }));

        if (name === "assignedToUserId") {
            const selectedUser = searchResults.find(user => user.id === value);
            setSelectedAssignedUserName(selectedUser ? (selectedUser.fullName || selectedUser.email) : '');
        }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        const token = getAuthToken();

        if (!token) {
            setError('Vous devez être connecté pour créer une tâche.');
            setLoading(false);
            navigate('/login');
            return;
        }

        if (!selectedMeetingId) {
            setError('Veuillez sélectionner une réunion pour créer une tâche.');
            setLoading(false);
            return;
        }

        const taskToCreate = {
            ...newTaskData,
            meetingId: selectedMeetingId,
            // Ensure dueDate is sent as an ISO string in UTC
            dueDate: newTaskData.dueDate ? new Date(newTaskData.dueDate).toISOString() : null,
        };

        try {
            const response = await fetch('https://localhost:7212/api/Task', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(taskToCreate)
            });

            if (response.ok) {
                setNewTaskData({
                    title: '',
                    description: '',
                    dueDate: '',
                    priority: 'Normal',
                    assignedToUserId: ''
                });
                setSearchQuery('');
                setSearchResults([]);
                setSelectedAssignedUserName('');
                fetchTasks();
            } else if (response.status === 401) {
                setError('Session expirée ou non autorisé. Veuillez vous reconnecter.');
                localStorage.removeItem('authToken');
                navigate('/login');
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
            setSearchResults([]);
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`https://localhost:7212/api/Auth/users/search?query=${encodeURIComponent(searchQuery)}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const processedResults = (data.$values || data || []).map(user => ({
                    id: user.id,
                    email: user.email,
                    fullName: user.fullName || user.email.split('@')[0]
                }));
                setSearchResults(processedResults);
            } else if (response.status === 401) {
                setError('Session expirée ou non autorisé. Veuillez vous reconnecter.');
                localStorage.removeItem('authToken');
                navigate('/login');
            } else {
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

    // *** MODIFIÉ: Fonction de filtrage des tâches pour gérer les fuseaux horaires ***
    const filterTasks = (tasksToFilter) => {
        // Get today's date in UTC, set to midnight
        const now = new Date();
        const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

        // Calculate end of the current week in UTC
        const endOfWeek = new Date(now);
        endOfWeek.setDate(now.getDate() + (7 - now.getDay())); // Get to Sunday
        const endOfWeekUtc = Date.UTC(endOfWeek.getFullYear(), endOfWeek.getMonth(), endOfWeek.getDate(), 23, 59, 59, 999);


        const currentUserId = getUserId();

        switch (currentFilter) {
            case 'today':
                return tasksToFilter.filter(task => {
                    if (!task.dueDate) return false;
                    // Parse task due date as UTC date, and get its UTC components
                    const taskDueDate = new Date(task.dueDate);
                    const taskDueUtc = Date.UTC(taskDueDate.getFullYear(), taskDueDate.getMonth(), taskDueDate.getDate());
                    return taskDueUtc === todayUtc;
                });
            case 'thisWeek':
                return tasksToFilter.filter(task => {
                    if (!task.dueDate) return false;
                    const taskDueDate = new Date(task.dueDate);
                    const taskDueUtc = Date.UTC(taskDueDate.getFullYear(), taskDueDate.getMonth(), taskDueDate.getDate());
                    // Check if taskDueUtc is between todayUtc (inclusive) and endOfWeekUtc (inclusive)
                    return taskDueUtc >= todayUtc && taskDueUtc <= endOfWeekUtc;
                });
            case 'urgent':
                return tasksToFilter.filter(task => task.priority === 'Urgent');
            case 'assignedToMe':
                return tasksToFilter.filter(task => task.assignedToUserId === currentUserId);
            case 'all':
            default:
                return tasksToFilter;
        }
    };

    const filteredTasks = filterTasks(tasks);

    const toggleUrgentPriority = (taskId) => {
        setTasks(prevTasks =>
            prevTasks.map(task =>
                task.id === taskId
                    ? { ...task, priority: task.priority === 'Urgent' ? 'Normal' : 'Urgent' }
                    : task
            )
        );
        // You should ideally send an API request here to persist the priority change.
        // For example: updateTaskPriority(taskId, newPriority);
    };


    return (
        <div className="task-dashboard-container">
            <div className="main-content three-column-layout">
                {/* Left Panel: Smart Lists / Filters */}
                <div className="left-panel glass-effect">
                    <h3>Smart Lists</h3>
                    <ul className="filter-list custom-list">
                        <li className={currentFilter === 'all' ? 'active' : ''} onClick={() => setCurrentFilter('all')}>
                            <i className="fas fa-inbox"></i> Toutes les tâches
                        </li>
                        <li className={currentFilter === 'today' ? 'active' : ''} onClick={() => setCurrentFilter('today')}>
                            <i className="fas fa-calendar-day"></i> Aujourd'hui
                        </li>
                        <li className={currentFilter === 'thisWeek' ? 'active' : ''} onClick={() => setCurrentFilter('thisWeek')}>
                            <i className="fas fa-calendar-week"></i> Cette semaine
                        </li>
                        <li className={currentFilter === 'urgent' ? 'active' : ''} onClick={() => setCurrentFilter('urgent')}>
                            <i className="fas fa-exclamation-circle"></i> Urgent
                        </li>
                        <li className={currentFilter === 'assignedToMe' ? 'active' : ''} onClick={() => setCurrentFilter('assignedToMe')}>
                            <i className="fas fa-user-circle"></i> Assigné à moi
                        </li>
                    </ul>
                    <h3 className="mt-40">Projets</h3>
                    <div className="project-select-group form-group">
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
                        {projects.length === 0 && !loading && <p className="no-items-message">Aucun projet disponible.</p>}
                    </div>
                    <h3 className="mt-40">Réunions</h3>
                    <div className="meeting-select-group form-group">
                        <select
                            id="selectMeeting"
                            value={selectedMeetingId}
                            onChange={(e) => setSelectedMeetingId(e.target.value)}
                            required
                            disabled={!selectedProjectId || meetings.length === 0}
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


                </div>

                {/* Middle Panel: Task List */}
                <div className="middle-panel glass-effect">
                    <h3>Tâches {
                        currentFilter === 'all' ? 'de la réunion' :
                        currentFilter === 'today' ? "d'aujourd'hui" :
                        currentFilter === 'thisWeek' ? 'de cette semaine' :
                        currentFilter === 'urgent' ? 'urgentes' :
                        currentFilter === 'assignedToMe' ? 'qui me sont assignées' : ''
                    } ({meetings.find(m => m.id === selectedMeetingId)?.title || 'N/A'})</h3>
                    {loading && <p className="loading-message">Chargement des tâches...</p>}
                    {error && <div className="error-message">{error}</div>}
                    <ul className="task-list custom-list">
                        {filteredTasks.length === 0 && !loading && !error && selectedMeetingId && <p className="no-items-message">Aucune tâche pour cette sélection.</p>}
                        {filteredTasks.map(task => (
                            <li key={task.id} className={`priority-${task.priority.toLowerCase()}`}>
                                <div className="task-header">
                                    <strong>{task.title}</strong>
                                    <div className="task-actions">
                                        {/* *** NOUVEAU: icône urgent cliquable *** */}
                                        <i
                                            className={`fas fa-exclamation-triangle urgent-icon ${task.priority === 'Urgent' ? 'active' : ''}`}
                                            onClick={() => toggleUrgentPriority(task.id)}
                                            title="Basculer la priorité Urgent"
                                        ></i>
                                        <span className={`priority-badge priority-${task.priority.toLowerCase()}`}>{task.priority}</span>
                                    </div>
                                </div>
                                <p className="task-description">{task.description}</p>
                                <div className="task-meta">
                                    <span><i className="fas fa-calendar-alt"></i> Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</span>
                                    <span><i className="fas fa-user-circle"></i> Assigné à: {task.assignedTo?.fullName || 'N/A'}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Right Panel: Add/Edit Task Form */}
                <div className="right-panel glass-effect">
                    {success && <div className="success-message">{success}</div>}
                    {error && <div className="error-message">{error}</div>}

                    <div className="glassy-card">
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
                                <label htmlFor="taskDescription">Description</label>
                                <textarea
                                    id="taskDescription"
                                    name="description"
                                    value={newTaskData.description}
                                    onChange={handleNewTaskChange}
                                    placeholder="Détails de la tâche..."
                                    rows="3"
                                ></textarea>
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

                            <div className="form-group search-user-group">
                                <label htmlFor="assignToUser">Assigner à</label>
                                <input
                                    type="text"
                                    id="assignToUser"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Rechercher par nom ou email"
                                />
                                <button type="button" onClick={handleSearchUsers} disabled={loading || !searchQuery.trim()} className="glass-button small-button">
                                    Rechercher
                                </button>
                            </div>

                            {searchResults.length > 0 && (
                                <div className="search-results-list form-group">
                                    <label htmlFor="selectAssignedUser">Sélectionner un responsable:</label>
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
                                                {user.fullName || user.email} ({user.email})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            {searchResults.length === 0 && searchQuery.trim() && !loading && (
                                <p className="no-results">Aucun utilisateur trouvé pour "{searchQuery}".</p>
                            )}
                            {newTaskData.assignedToUserId && selectedAssignedUserName && (
                                <p className="selected-user-hint">
                                    Assigné à: <strong>{selectedAssignedUserName}</strong>
                                </p>
                            )}
                            {newTaskData.assignedToUserId && !selectedAssignedUserName && (
                                <p className="selected-user-hint">
                                    Assigné à: (Chargement du nom...)
                                </p>
                            )}

                            <button type="submit" disabled={loading || !selectedMeetingId || !getAuthToken()} className="glass-button">
                                {loading ? 'Création...' : 'Créer la tâche'}
                            </button>
                            {!getAuthToken() && <p className="auth-hint">Connectez-vous pour créer une tâche.</p>}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskDashboard;