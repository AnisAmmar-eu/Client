import React, { useState, useEffect } from 'react';
import './TaskDashboard.css';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';

const TaskDashboard = () => {
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [meetings, setMeetings] = useState([]);
    const [selectedMeetingId, setSelectedMeetingId] = useState('');
    const [tasks, setTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [allUsers, setAllUsers] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [currentFilter, setCurrentFilter] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const navigate = useNavigate();

    const getAuthToken = () => localStorage.getItem('authToken');
    const getUserId = () => localStorage.getItem('userId');

    useEffect(() => {
        const token = getAuthToken();
        if (!token) {
            navigate('/login');
        } else {
            fetchProjects();
            fetchAllUsers();
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

    const fetchAllUsers = async () => {
        setLoading(true);
        setError('');
        const token = getAuthToken();
        if (!token) {
            navigate('/login');
            return;
        }
        try {
            const response = await fetch('https://localhost:7212/api/Project/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                const fetchedUsers = (data.$values || data || []).map(user => ({
                    id: user.id,
                    email: user.email,
                    fullName: user.fullName || user.email.split('@')[0]
                }));
                setAllUsers(fetchedUsers);
            } else if (response.status === 401) {
                setError("Session expirée ou non autorisé. Veuillez vous reconnecter.");
                localStorage.removeItem('authToken');
                navigate('/login');
            } else {
                setError('Erreur lors de la récupération des utilisateurs.');
            }
        } catch (err) {
            setError('Erreur réseau ou du serveur lors de la récupération des utilisateurs.');
            console.error('Fetch all users error:', err);
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
                const response = await fetch(`https://localhost:7212/api/Meeting/project/${selectedProjectId}/active`, {
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
                    setError('Erreur lors de la récupération des réunions actives du projet.');
                }
            } catch (err) {
                setError('Erreur réseau ou du serveur.');
                console.error('Fetch active project meetings error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchMeetings();
    }, [selectedProjectId, navigate]);
    // Calculate task counts for each filter
    const calculateTaskCounts = () => {
        const now = new Date();
        const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfWeek = new Date(now);
        endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
        const endOfWeekUtc = Date.UTC(endOfWeek.getFullYear(), endOfWeek.getMonth(), endOfWeek.getDate(), 23, 59, 59, 999);
        const currentUserId = getUserId();

        return {
            all: tasks.length,
            today: tasks.filter(task => {
                if (!task.dueDate) return false;
                const taskDueDate = new Date(task.dueDate);
                const taskDueUtc = Date.UTC(taskDueDate.getFullYear(), taskDueDate.getMonth(), taskDueDate.getDate());
                return taskDueUtc === todayUtc;
            }).length,
            thisWeek: tasks.filter(task => {
                if (!task.dueDate) return false;
                const taskDueDate = new Date(task.dueDate);
                const taskDueUtc = Date.UTC(taskDueDate.getFullYear(), taskDueDate.getMonth(), taskDueDate.getDate());
                return taskDueUtc >= todayUtc && taskDueUtc <= endOfWeekUtc;
            }).length,
            urgent: tasks.filter(task => task.priority === 'Urgent').length,
            assignedToMe: tasks.filter(task => task.assignedToUserId === currentUserId).length,
        };
    };

    const taskCounts = calculateTaskCounts();
    const fetchTasks = async () => {
        if (!selectedMeetingId) {
            setTasks([]);
            setSelectedTask(null);
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
                if (selectedTask && !(data.$values || data).some(task => task.id === selectedTask.id)) {
                    setSelectedTask(null);
                }
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

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setSelectedTask(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'application/pdf') {
            setSelectedFile(file);
            setError('');
        } else {
            setSelectedFile(null);
            setError('Seuls les fichiers PDF sont autorisés.');
        }
    };

    const handleAddNewTask = () => {
        if (!selectedMeetingId) {
            setError("Veuillez sélectionner une réunion avant d'ajouter une tâche.");
            return;
        }
        setError('');
        setSuccess('');
        setSelectedFile(null);

        const tempId = `new-${Date.now()}`;
        const newTask = {
            id: tempId,
            title: 'Nouvelle tâche',
            description: '',
            dueDate: '',
            priority: 'Normal',
            assignedToUserId: '',
        };
        setTasks(prevTasks => [newTask, ...prevTasks]);
    };

    const handleSelectTask = (task) => {
        setError('');
        setSuccess('');
        setSelectedFile(null);
        setSelectedTask(task);
        setIsModalOpen(true);
    };

    const handleCancelEdit = () => {
        setTasks(prevTasks => prevTasks.filter(task => !task.id.startsWith('new-')));
        setSelectedTask(null);
        setSelectedFile(null);
        setError('');
        setSuccess('');
        setIsModalOpen(false);
    };

    const handleSaveTask = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        const token = getAuthToken();

        if (!token) {
            setError('Vous devez être connecté pour créer/modifier une tâche.');
            setLoading(false);
            navigate('/login');
            return;
        }

        if (!selectedMeetingId) {
            setError('Veuillez sélectionner une réunion pour créer/modifier une tâche.');
            setLoading(false);
            return;
        }

        if (!selectedTask || !selectedTask.title || !selectedTask.dueDate) {
            setError('Veuillez remplir au moins le titre et la date d\'échéance.');
            setLoading(false);
            return;
        }

        const isNew = typeof selectedTask.id === 'string' && selectedTask.id.startsWith('new-');
        const taskDataToSend = {
            title: selectedTask.title,
            description: selectedTask.description,
            dueDate: selectedTask.dueDate ? new Date(selectedTask.dueDate).toISOString() : null,
            priority: selectedTask.priority,
            assignedToUserId: selectedTask.assignedToUserId,
            meetingId: selectedMeetingId
        };

        if (!isNew) {
            taskDataToSend.id = selectedTask.id;
        }

        const method = isNew ? 'POST' : 'PUT';
        const url = isNew ? 'https://localhost:7212/api/Task' : `https://localhost:7212/api/Task/${selectedTask.id}`;

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(taskDataToSend)
            });

            if (response.ok) {
                const savedTask = await response.json();
                setTasks(prevTasks => {
                    if (isNew) {
                        return prevTasks.map(task => task.id === selectedTask.id ? savedTask : task);
                    } else {
                        return prevTasks.map(task => task.id === savedTask.id ? savedTask : task);
                    }
                });

                if (selectedFile) {
                    await uploadAttachment(selectedMeetingId, selectedFile);
                }
                setSelectedFile(null);
                setSelectedTask(null);
                setIsModalOpen(false);
            } else if (response.status === 401) {
                setError('Session expirée ou non autorisé. Veuillez vous reconnecter.');
                localStorage.removeItem('authToken');
                navigate('/login');
            } else {
                const errorData = await response.json();
                let errorMessage = `Erreur lors de ${isNew ? 'la création' : 'la mise à jour'} de la tâche.`;
                if (errorData.errors) {
                    errorMessage += "\nDétails: ";
                    for (const key in errorData.errors) {
                        errorMessage += `\n${key}: ${errorData.errors[key].join(', ')}`;
                    }
                } else if (errorData.title) {
                    errorMessage += `\n${errorData.title}`;
                }
                setError(errorMessage);
            }
        } catch (err) {
            setError(`Erreur réseau ou du serveur lors de ${isNew ? 'la création' : 'la mise à jour'} de la tâche.`);
            console.error(`${isNew ? 'Create' : 'Update'} task error:`, err);
        } finally {
            setLoading(false);
        }
    };

    const uploadAttachment = async (meetingId, file) => {
        setLoading(true);
        setError('');
        const token = getAuthToken();

        if (!token) {
            setError('Vous devez être connecté pour télécharger des fichiers.');
            setLoading(false);
            navigate('/login');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`https://localhost:7212/api/Meeting/${meetingId}/attachments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Attachment uploaded:', data.attachment);
                setSuccess('Fichier PDF téléchargé avec succès !');
            } else if (response.status === 401) {
                setError('Session expirée ou non autorisé pour le téléchargement. Veuillez vous reconnecter.');
                localStorage.removeItem('authToken');
                navigate('/login');
            } else {
                const errorText = await response.text();
                setError(`Erreur lors du téléchargement de l'attachement: ${errorText}`);
            }
        } catch (err) {
            setError('Erreur réseau ou du serveur lors du téléchargement de l\'attachement.');
            console.error('Upload attachment error:', err);
        } finally {
            setLoading(false);
        }
    };

    const filterTasks = (tasksToFilter) => {
        const now = new Date();
        const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfWeek = new Date(now);
        endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
        const endOfWeekUtc = Date.UTC(endOfWeek.getFullYear(), endOfWeek.getMonth(), endOfWeek.getDate(), 23, 59, 59, 999);
        const currentUserId = getUserId();

        return tasksToFilter.filter(task => {
            if (task.id && typeof task.id === 'string' && task.id.startsWith('new-')) return true;
            switch (currentFilter) {
                case 'today':
                    if (!task.dueDate) return false;
                    const taskDueDateToday = new Date(task.dueDate);
                    const taskDueUtcToday = Date.UTC(taskDueDateToday.getFullYear(), taskDueDateToday.getMonth(), taskDueDateToday.getDate());
                    return taskDueUtcToday === todayUtc;
                case 'thisWeek':
                    if (!task.dueDate) return false;
                    const taskDueDateWeek = new Date(task.dueDate);
                    const taskDueUtcWeek = Date.UTC(taskDueDateWeek.getFullYear(), taskDueDateWeek.getMonth(), taskDueDateWeek.getDate());
                    return taskDueUtcWeek >= todayUtc && taskDueUtcWeek <= endOfWeekUtc;
                case 'urgent':
                    return task.priority === 'Urgent';
                case 'assignedToMe':
                    return task.assignedToUserId === currentUserId;
                case 'all':
                default:
                    return true;
            }
        });
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
    };

    return (
        <div className="task-dashboard-container">
            <div className="task-section glass-effect">
                {/* Fusion des badges et sélecteurs en haut de task-section */}
                <div className="filter-and-select-group">
                    <div className="filter-badges">
                        <span
                            className={`badge ${currentFilter === 'all' ? 'active' : ''}`}
                            onClick={() => setCurrentFilter('all')}
                        >
                            <i className="fas fa-inbox"></i> Toutes
                            {taskCounts.all > 0 && <span className="task-count">{taskCounts.all}</span>}
                        </span>
                        <span
                            className={`badge ${currentFilter === 'today' ? 'active' : ''}`}
                            onClick={() => setCurrentFilter('today')}
                        >
                            <i className="fas fa-calendar-day"></i> Aujourd'hui
                            {taskCounts.today > 0 && <span className="task-count">{taskCounts.today}</span>}
                        </span>
                        <span
                            className={`badge ${currentFilter === 'thisWeek' ? 'active' : ''}`}
                            onClick={() => setCurrentFilter('thisWeek')}
                        >
                            <i className="fas fa-calendar-week"></i> Semaine
                            {taskCounts.thisWeek > 0 && <span className="task-count">{taskCounts.thisWeek}</span>}
                        </span>
                        <span
                            className={`badge ${currentFilter === 'urgent' ? 'active' : ''}`}
                            onClick={() => setCurrentFilter('urgent')}
                        >
                            <i className="fas fa-exclamation-circle"></i> Urgent
                            {taskCounts.urgent > 0 && <span className="task-count">{taskCounts.urgent}</span>}
                        </span>
                        <span
                            className={`badge ${currentFilter === 'assignedToMe' ? 'active' : ''}`}
                            onClick={() => setCurrentFilter('assignedToMe')}
                        >
                            <i className="fas fa-user-circle"></i> À moi
                            {taskCounts.assignedToMe > 0 && <span className="task-count">{taskCounts.assignedToMe}</span>}
                        </span>
                    </div>

                    <div className="select-group">
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
                                    {meeting.title}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="task-content">
                    <div className="panel-header-with-button">
                        <h3>
                            Tâches {
                                currentFilter === 'all' ? 'de la réunion' :
                                    currentFilter === 'today' ? "d'aujourd'hui" :
                                        currentFilter === 'thisWeek' ? 'de cette semaine' :
                                            currentFilter === 'urgent' ? 'urgentes' :
                                                currentFilter === 'assignedToMe' ? 'qui me sont assignées' : ''
                            }
                        </h3>

                        <Plus
                            className="add-item-button"
                            onClick={handleAddNewTask}
                            disabled={!selectedMeetingId}
                            title={!selectedMeetingId ? "Sélectionnez une réunion pour ajouter une tâche" : "Ajouter une nouvelle tâche"}
                        />
                    </div>
                    {loading && <p className="loading-message">Chargement des tâches...</p>}
                    {error && <div className="error-message">{error}</div>}
                    <ul className="task-list custom-list">
                        {filteredTasks.length === 0 && !loading && !error && selectedMeetingId && <p className="no-items-message">Aucune tâche pour cette sélection.</p>}
                        {!selectedMeetingId && <p className="no-items-message">Sélectionnez une réunion pour voir les tâches.</p>}
                        {filteredTasks.map(task => (
                            <li
                                key={task.id}
                                className={`priority-${(task.priority || 'Normal').toLowerCase()} ${selectedTask && selectedTask.id === task.id ? 'selected-card' : ''}`}
                                onClick={() => handleSelectTask(task)}
                            >
                                <div className="task-header">
                                    <strong>{task.title || "Nouvelle tâche"}</strong>
                                    <div className="task-actions">
                                        <i
                                            className={`fas fa-exclamation-triangle urgent-icon ${task.priority === 'Urgent' ? 'active' : ''}`}
                                            onClick={(e) => { e.stopPropagation(); toggleUrgentPriority(task.id); }}
                                            title="Basculer la priorité Urgent"
                                        ></i>
                                        <span className={`priority-badge priority-${(task.priority || 'Normal').toLowerCase()}`}>{task.priority || 'N/A'}</span>
                                    </div>
                                </div>
                                <p className="task-description">{task.description || "Aucune description"}</p>
                                <div className="task-meta">
                                    <span><i className="fas fa-calendar-alt"></i> Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</span>
                                    <span><i className="fas fa-user-circle"></i> Assigné à: {
                                        allUsers.find(user => user.id === task.assignedToUserId)?.fullName || 'N/A'
                                    }</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Pop-up (Modal) */}
            {isModalOpen && selectedTask && (
                <div className="modal-overlay">
                    <div className="modal-content glass-effect">
                        <h4>{selectedTask && typeof selectedTask.id === 'string' && selectedTask.id.startsWith('new-') ? 'Créer une nouvelle tâche' : 'Modifier la tâche'}</h4>
                        <form onSubmit={handleSaveTask}>
                            <div className="form-group">
                                <label htmlFor="taskTitle">Titre de la tâche</label>
                                <input
                                    type="text"
                                    id="taskTitle"
                                    name="title"
                                    value={selectedTask?.title || ''}
                                    onChange={handleFormChange}
                                    placeholder="Ex: Préparer la présentation"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="taskDescription">Description</label>
                                <textarea
                                    id="taskDescription"
                                    name="description"
                                    value={selectedTask?.description || ''}
                                    onChange={handleFormChange}
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
                                    value={selectedTask?.dueDate ? new Date(selectedTask.dueDate).toISOString().split('T')[0] : ''}
                                    onChange={handleFormChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="taskPriority">Priorité</label>
                                <select
                                    id="taskPriority"
                                    name="priority"
                                    value={selectedTask?.priority || 'Normal'}
                                    onChange={handleFormChange}
                                >
                                    <option value="Low">Basse</option>
                                    <option value="Normal">Normale</option>
                                    <option value="High">Haute</option>
                                    <option value="Urgent">Urgente</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="selectAssignedUser">Assigner à</label>
                                <select
                                    id="selectAssignedUser"
                                    name="assignedToUserId"
                                    value={selectedTask?.assignedToUserId || ''}
                                    onChange={handleFormChange}
                                    required
                                >
                                    <option value="">-- Choisir un utilisateur --</option>
                                    {allUsers.map(user => (
                                        <option key={user.id} value={user.id}>
                                            {user.fullName || user.email}
                                        </option>
                                    ))}
                                </select>
                                {allUsers.length === 0 && !loading && <p className="no-items-message">Aucun utilisateur disponible.</p>}
                            </div>
                            {selectedTask?.assignedToUserId && (
                                <p className="selected-user-hint">
                                    Assigné à: <strong>{allUsers.find(u => u.id === selectedTask.assignedToUserId)?.fullName || 'N/A'}</strong>
                                </p>
                            )}
                            <div className="form-group">
                                <label htmlFor="taskAttachment">Attachement</label>
                                <input
                                    type="file"
                                    id="taskAttachment"
                                    name="attachment"
                                    accept=".pdf"
                                    onChange={handleFileChange}
                                />
                                {selectedFile && <p className="file-info">Fichier sélectionné: {selectedFile.name}</p>}
                                {error.includes('fichiers PDF sont autorisés') && <div className="error-message">{error}</div>}
                            </div>
                            <div className="modal-actions">
                                <button
                                    type="submit"
                                    disabled={loading || !selectedMeetingId || !getAuthToken()}
                                    className="glass-button"
                                >
                                    {loading ? 'Chargement...' : (typeof selectedTask.id === 'string' && selectedTask.id.startsWith('new-') ? 'Créer la tâche' : 'Mettre à jour la tâche')}
                                </button>
                                <button type="button" onClick={handleCancelEdit} className="glass-button cancel-button" disabled={loading}>
                                    Annuler
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaskDashboard;