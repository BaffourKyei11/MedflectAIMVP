import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { SyncProvider } from './contexts/SyncContext'
import { ToastProvider } from './contexts/ToastContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Patients from './pages/Patients'
import PatientDetail from './pages/PatientDetail'
import Admin from './pages/Admin'
import Audit from './pages/Audit'
import ProtectedRoute from './components/ProtectedRoute'

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <SyncProvider>
          <ToastProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="patients" element={<Patients />} />
                <Route path="patients/:id" element={<PatientDetail />} />
                <Route path="admin" element={<Admin />} />
                <Route path="audit" element={<Audit />} />
              </Route>
            </Routes>
          </ToastProvider>
        </SyncProvider>
      </AuthProvider>
    </Router>
  )
}

export default App 