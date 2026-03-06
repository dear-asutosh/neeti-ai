import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './index.css'
import { AuthProvider } from './context/AuthProvider';
import { PrivateRoute } from './components/PrivateRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AppShell from './components/layout/AppShell';

// Placeholder Pages
import Documents from './pages/Documents';
import Speeches from './pages/Speeches';
import Schedule from './pages/Schedule';
import Constituency from './pages/Constituency';
import AIAssistant from './pages/AIAssistant';
import Meetings from './pages/Meetings';
import Insights from './pages/Insights';
import Settings from './pages/Settings';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* AppShell acts as a layout wrapper for authenticated routes */}
          <Route element={<PrivateRoute><AppShell /></PrivateRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/meetings" element={<Meetings />} />
            <Route path="/speeches" element={<Speeches />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/constituency" element={<Constituency />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/assistant" element={<AIAssistant />} />
          </Route>
          
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          {/* <Route path="*" element={<Navigate to="/dashboard" replace />} /> */}
        </Routes>
      </Router>
    </AuthProvider>
  </StrictMode>,
)
