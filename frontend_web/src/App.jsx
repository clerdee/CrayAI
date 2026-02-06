import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

import LandingPage from './pages/LandingPage';
import AboutUs from './pages/AboutUs';
import TheRedClaw from './pages/TheRedClaw';
import AuthPage from './pages/auth/AuthPage';
import UserDashboard from './pages/user/UserDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import AIScanLogs from './pages/admin/AIScanLogs';
import TrainingData from './pages/admin/Training/TrainingData';
import Moderation from './pages/admin/Moderation';
import UserManagement from './pages/admin/UserManagement';
import SystemHealth from './pages/admin/SystemHealth';
import Settings from './pages/admin/Settings';


// =========================================================
// 2. ADD AXIOS INTERCEPTOR (The Session Guard)
// =========================================================
axios.interceptors.response.use(
  (response) => response, // Pass successful requests through
  (error) => {
    // Check if error is 401 (Unauthorized) or 403 (Forbidden)
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.warn('Session expired or unauthorized. Logging out...');
      
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Force redirect to login page
      // Note: We use window.location because navigate() isn't available outside components
      window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  // Add safety check: parse might fail if storage is corrupted
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('user'));
  } catch (e) {
    console.error("User data corrupted");
  }

  if (!token || !user) {
    // Double safety: if data is missing/corrupt, clear it
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />; 
  }

  return children;
};

const App = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/about" element={<AboutUs />} />
      <Route path="/red-claw" element={<TheRedClaw />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/register" element={<AuthPage />} />

      {/* USER ROUTES (Researchers) */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['user', 'admin']}>
            <UserDashboard />
          </ProtectedRoute>
        } 
      />

      {/* ADMIN ROUTES (System Management) */}
      <Route 
        path="/admin/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/admin/scans" 
        element={<ProtectedRoute allowedRoles={['admin']}><AIScanLogs /></ProtectedRoute>} 
      />

      <Route 
        path="/admin/dataset" 
        element={<ProtectedRoute allowedRoles={['admin']}><TrainingData /></ProtectedRoute>} 
      />

      <Route path="/admin/moderation" 
        element={<ProtectedRoute allowedRoles={['admin']}><Moderation /></ProtectedRoute>} 
      />

      <Route 
        path="/admin/users" 
        element={<ProtectedRoute allowedRoles={['admin']}><UserManagement /></ProtectedRoute>} 
      />

      <Route path="/admin/health" 
        element={<ProtectedRoute allowedRoles={['admin']}><SystemHealth /></ProtectedRoute>} 
      />

      <Route path="/admin/settings"
        element={<ProtectedRoute allowedRoles={['admin']}><Settings /></ProtectedRoute>} 
      />

    </Routes>
  );
};

export default App;