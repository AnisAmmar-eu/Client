import logo from './logo.svg';
import './App.css';
import Login from './components/login';
import Register from './components/Register';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import ProjectDashboard from './components/ProjectDashboard';
import '@fortawesome/fontawesome-free/css/all.min.css'; // Pour les icônes
import MeetingDashboard from './components/MeetingDashboard';
import TaskDashboard from './components/TaskDashboard';
import ArchiveDashboard from './components/ArchiveDashboard';

function App() {
  return (
        <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<ProjectDashboard />} />
           <Route path="/meetings" element={<MeetingDashboard />} />
            <Route path="/tasks" element={<TaskDashboard />} />
            <Route path="/archive" element={<ArchiveDashboard />} /> {/* <-- Nouvelle route pour l'archive */}

          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </div>
    </Router>
  );
}

export default App;
