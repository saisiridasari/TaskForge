import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';
import { NotificationProvider } from './context/NotificationContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import AppLayout from './components/layout/AppLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectBoardPage from './pages/ProjectBoardPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import TeamPage from './pages/TeamPage';
import CalendarPage from './pages/CalendarPage';
import SearchPage from './pages/SearchPage';
import AutomationPage from './pages/AutomationPage';
import ActivityPage from './pages/ActivityPage';

const FullPageSpinner = () => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg-page)' }}>
    <div className="spinner" style={{ width:36, height:36 }} />
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

const HomeRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <LandingPage />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRoute />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:id" element={<ProjectBoardPage />} />
        <Route path="/projects/:id/activity" element={<ActivityPage />} />
        <Route path="/projects/:id/automation" element={<AutomationPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/team" element={<TeamPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <ProjectProvider>
            <NotificationProvider>
              <BrowserRouter>
                <AppRoutes />
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 3000,
                    style: {
                      background: 'var(--white)',
                      color: 'var(--text)',
                      borderRadius: '12px',
                      border: '1px solid var(--border)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                      fontSize: '14px',
                      fontFamily: 'DM Sans, sans-serif',
                      padding: '12px 16px',
                    },
                    success: { iconTheme: { primary: 'var(--green)', secondary: 'var(--white)' } },
                    error: { iconTheme: { primary: 'var(--accent-warm)', secondary: 'var(--white)' } },
                  }}
                />
              </BrowserRouter>
            </NotificationProvider>
          </ProjectProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}