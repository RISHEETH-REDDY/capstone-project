import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import FacultyDashboard from './pages/FacultyDashboard';
import StudentDashboard from './pages/StudentDashboard';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Analytics from './pages/Analytics';

const RootRedirect = () => {
  return <Navigate to="/login" />;
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!user.role) return <Navigate to="/login" />;
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'faculty' ? '/faculty' : '/student'} />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <Layout>
            <Routes>
              <Route path="/" element={<RootRedirect />} />
              <Route path="/faculty" element={<ProtectedRoute allowedRoles={['faculty', 'admin']}><FacultyDashboard /></ProtectedRoute>} />
              <Route path="/student" element={<ProtectedRoute allowedRoles={['student', 'admin']}><StudentDashboard /></ProtectedRoute>} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/analytics" element={<ProtectedRoute allowedRoles={['faculty', 'admin']}><Analytics /></ProtectedRoute>} />
            </Routes>
          </Layout>
        } />
      </Routes>
    </Router>
  );
}

export default App;
