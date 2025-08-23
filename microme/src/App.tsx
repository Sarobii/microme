import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { Layout } from './components/Layout'
import { LandingPage } from './pages/LandingPage'
import { Dashboard } from './pages/Dashboard'
import { DataUpload } from './pages/DataUpload'
import { PersonaAnalysis } from './pages/PersonaAnalysis'
import { ContentStrategy } from './pages/ContentStrategy'
import { TransparencyCard } from './pages/TransparencyCard'
import { Simulation } from './pages/Simulation'
import { Settings } from './pages/Settings'
import { AuthPage } from './pages/AuthPage'
import { AuthCallback } from './pages/AuthCallback'
import { ProtectedRoute } from './components/ProtectedRoute'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            
            {/* Protected routes */}
            <Route path="/app" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="upload" element={<DataUpload />} />
              <Route path="persona" element={<PersonaAnalysis />} />
              <Route path="strategy" element={<ContentStrategy />} />
              <Route path="transparency" element={<TransparencyCard />} />
              <Route path="simulation" element={<Simulation />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            
            {/* Redirect unknown routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App