import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { LearningProvider } from './context/LearningContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Roadmaps from './pages/Roadmaps'
import Quiz from './pages/Quiz'
import Profile from './pages/Profile'
import Review from './pages/Review'
import RoadmapDetails from './pages/RoadmapDetails'

function App() {
  return (
    <AuthProvider>
      <LearningProvider>
        <Router>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/roadmaps" element={
                  <ProtectedRoute>
                    <Roadmaps />
                  </ProtectedRoute>
                } />
                <Route path="/quiz/:topicId" element={
                  <ProtectedRoute>
                    <Quiz />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                <Route path="/review" element={
                  <ProtectedRoute>
                    <Review />
                  </ProtectedRoute>
                } />
                <Route path="/roadmaps/:id" element={
                  <ProtectedRoute>
                    <RoadmapDetails />
                  </ProtectedRoute>
                } />
              </Routes>
            </main>
            <Toaster 
              position="top-right"
              toastOptions={{
                className: 'bg-white shadow-lg border border-gray-200',
                duration: 4000,
              }}
            />
          </div>
        </Router>
      </LearningProvider>
    </AuthProvider>
  )
}

export default App