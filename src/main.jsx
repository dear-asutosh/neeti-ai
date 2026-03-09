import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './index.css'
import { AuthProvider } from './context/AuthProvider';
import { PrivateRoute } from './components/PrivateRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AppShell from './components/layout/AppShell';
import Landing from './pages/Landing';

// Placeholder Pages
import Documents from './pages/Documents';
import Speeches from './pages/Speeches';
import Schedule from './pages/Schedule';
import ConstituencyLayout from './components/layout/ConstituencyLayout';
import ConstituencyDashboard from './pages/ConstituencyTracker/Dashboard';
import AllComplaints from './pages/ConstituencyTracker/AllComplaints';
import AddComplaint from './pages/ConstituencyTracker/AddComplaint';
import ComplaintDetail from './pages/ConstituencyTracker/ComplaintDetail';
import ProjectsList from './pages/ConstituencyTracker/Projects/List';
import AddProject from './pages/ConstituencyTracker/Projects/Add';
import ProjectDetail from './pages/ConstituencyTracker/Projects/Detail';
import PeopleList from './pages/ConstituencyTracker/People/List';
import AddPerson from './pages/ConstituencyTracker/People/Add';
import PersonDetail from './pages/ConstituencyTracker/People/Detail';
import WardsOverview from './pages/ConstituencyTracker/Wards/Overview';
import WardDetail from './pages/ConstituencyTracker/Wards/Detail';

import AIAssistant from './pages/AIAssistant';
import Meetings from './pages/Meetings';
import Insights from './pages/Insights';
import Settings from './pages/Settings';

createRoot(document.getElementById('root')).render(
  // <StrictMode>
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* AppShell acts as a layout wrapper for authenticated routes */}
          <Route element={<PrivateRoute><AppShell /></PrivateRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/meetings" element={<Meetings />} />
            <Route path="/speeches" element={<Speeches />} />
            {/* Constituency Tracker Module with its own layout tab wrapper */}
            <Route element={<ConstituencyLayout />}>
              <Route path="/constituency" element={<ConstituencyDashboard />} />
              
              <Route path="/constituency/complaints" element={<AllComplaints />} />
              <Route path="/constituency/complaints/new" element={<AddComplaint />} />
              <Route path="/constituency/complaints/:id" element={<ComplaintDetail />} />
              
              <Route path="/constituency/projects" element={<ProjectsList />} />
              <Route path="/constituency/projects/new" element={<AddProject />} />
              <Route path="/constituency/projects/:id" element={<ProjectDetail />} />
              
              <Route path="/constituency/people" element={<PeopleList />} />
              <Route path="/constituency/people/new" element={<AddPerson />} />
              <Route path="/constituency/people/:id" element={<PersonDetail />} />
              
              <Route path="/constituency/wards" element={<WardsOverview />} />
              <Route path="/constituency/wards/:wardNumber" element={<WardDetail />} />
            </Route>
            <Route path="/settings" element={<Settings />} />
            <Route path="/assistant" element={<AIAssistant />} />
          </Route>
          
          <Route path="/" element={<Landing />} />
          {/* <Route path="*" element={<Navigate to="/dashboard" replace />} /> */}
        </Routes>
      </Router>
    </AuthProvider>
  // </StrictMode>
)
