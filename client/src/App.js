import logo from './logo.svg';
import './App.css';
import Login from './components/login';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import ProjectDashboard from './components/ProjectDashboard';
import '@fortawesome/fontawesome-free/css/all.min.css'; // Pour les icônes
import MeetingDashboard from './components/MeetingDashboard';
import TaskDashboard from './components/TaskDashboard';
import './App.css';
import DashboardHome from './components/DashboardHome';
import MainLayout from './components/MainLayout';
import ArchiveDashboard from './components/ArchiveDashboard';
import IntroPanel from './components/IntroPanel';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public route: Login Page */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes wrapped by MainLayout */}
        {/* The <Outlet> in MainLayout will render the matching child route component */}
        <Route element={<MainLayout />}>
          {/* Redirect from root to /dashboard if logged in */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<IntroPanel />} />
          <Route path="/projects" element={<ProjectDashboard />} />
          <Route path="/meetings" element={<MeetingDashboard />} />
          <Route path="/tasks" element={<TaskDashboard />} />
          <Route path="/archive" element={<ArchiveDashboard/>} />
          {/* Add more protected routes here */}
        </Route>

        {/* Fallback route for any unmatched paths, redirects to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
