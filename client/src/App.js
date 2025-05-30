// src/App.js
import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';

import Login from './components/login';
import Register from './components/Register';
import ProjectDashboard from './components/ProjectDashboard';
import MeetingDashboard from './components/MeetingDashboard';
import TaskDashboard from './components/TaskDashboard';
import ArchiveDashboard from './components/ArchiveDashboard';
import CalendarView from './components/CalendarView';
import IntroPanel from './components/IntroPanel';
import MainLayout from './components/MainLayout';

import './App.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import AuthCallback from './components/AuthCallback';

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Routes protégées avec layout principal */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/dashboard" element={<IntroPanel />} />
        <Route path="/projects" element={<ProjectDashboard />} />
        <Route path="/meetings" element={<MeetingDashboard />} />
        <Route path="/tasks" element={<TaskDashboard />} />
        <Route path="/archive" element={<ArchiveDashboard />} />
        <Route path="/calendar" element={<CalendarView />} />
        <Route path="/auth-callback" element={<AuthCallback />} />

      </Route>

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
