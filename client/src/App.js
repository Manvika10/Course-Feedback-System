import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SubmitFeedback from './pages/SubmitFeedback';
import AdminPanel from './pages/AdminPanel';

// Project attribution: Developed by Gone Manvika(B23CS161)
// Under supervision of BRIKIENLABS (https://brikienlabs.tech)
function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1a1a2e',
              color: '#f1f5f9',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: '12px',
              fontSize: '0.875rem',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#1a1a2e' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#1a1a2e' },
            },
          }}
        />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes (with Navbar) */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div className="app-container">
                  <Navbar />
                  <main className="main-content">
                    <Dashboard />
                  </main>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/submit-feedback/:courseId"
            element={
              <ProtectedRoute>
                <div className="app-container">
                  <Navbar />
                  <main className="main-content">
                    <SubmitFeedback />
                  </main>
                </div>
              </ProtectedRoute>
            }
          />
          {/* NEW: Lesson-specific micro-feedback route */}
          <Route
            path="/submit-feedback/:courseId/lesson/:lessonId"
            element={
              <ProtectedRoute>
                <div className="app-container">
                  <Navbar />
                  <main className="main-content">
                    <SubmitFeedback />
                  </main>
                </div>
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <div className="app-container">
                  <Navbar />
                  <main className="main-content">
                    <AdminPanel />
                  </main>
                </div>
              </AdminRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <footer className="app-footer">
          Developed by Gone Manvika (B23CS161) under supervision of BRIKIENLABS (
          <a href="https://brikienlabs.tech" target="_blank" rel="noreferrer">
            brikienlabs.tech
          </a>
          )
        </footer>
      </Router>
    </AuthProvider>
  );
}

export default App;
