import React, { createContext, useContext, useState, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'

interface Roadmap {
  _id: string
  title: string
  description: string
  level: string
  steps: Array<{
    title: string
    description: string
    completed: boolean
    order: number
  }>
  progress: number
  createdAt: string
}

interface QuizResult {
  _id: string
  topic: string
  score: number
  totalQuestions: number
  percentage: number
  completedAt: string
}

interface LearningContextType {
  roadmaps: Roadmap[]
  quizResults: QuizResult[]
  loading: boolean
  createRoadmap: (topic: string, level: string) => Promise<void>
  fetchRoadmaps: () => Promise<void>
  fetchQuizResults: () => Promise<void>
  updateRoadmapProgress: (roadmapId: string, stepIndex: number) => Promise<void>
}

const LearningContext = createContext<LearningContextType | undefined>(undefined)

export const useLearning = () => {
  const context = useContext(LearningContext)
  if (context === undefined) {
    throw new Error('useLearning must be used within a LearningProvider')
  }
  return context
}

interface LearningProviderProps {
  children: ReactNode
}

export const LearningProvider: React.FC<LearningProviderProps> = ({ children }) => {
  const { currentUser } = useAuth()
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([])
  const [quizResults, setQuizResults] = useState<QuizResult[]>([])
  const [loading, setLoading] = useState(false)

  const fetchRoadmaps = async () => {
    if (!currentUser) return
    setLoading(true)
    try {
      const response = await api.get('/roadmaps')
      setRoadmaps(response.data.data) // <-- Use .data
    } catch (error: any) {
      toast.error('Failed to fetch roadmaps')
    } finally {
      setLoading(false)
    }
  }

  const fetchQuizResults = async () => {
    if (!currentUser) return
    try {
      const response = await api.get('/quiz/results')
      setQuizResults(response.data.data) // <-- Use .data
    } catch (error: any) {
      toast.error('Failed to fetch quiz results')
    }
  }

  const createRoadmap = async (topic: string, level: string) => {
    if (!currentUser) return
    setLoading(true)
    try {
      const response = await api.post('/roadmaps', { topic, level })
      setRoadmaps(prev => Array.isArray(prev) ? [...prev, response.data.data] : [response.data.data])
      toast.success('Roadmap created successfully!')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create roadmap')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updateRoadmapProgress = async (roadmapId: string, stepIndex: number) => {
    if (!currentUser) return
    try {
      const response = await api.put(`/roadmaps/${roadmapId}/progress`, { stepIndex })
      setRoadmaps(prev =>
        prev.map(roadmap =>
          roadmap._id === roadmapId ? response.data.data : roadmap // <-- Use .data
        )
      )
      toast.success('Progress updated!')
    } catch (error: any) {
      toast.error('Failed to update progress')
    }
  }

  const value = {
    roadmaps,
    quizResults,
    loading,
    createRoadmap,
    fetchRoadmaps,
    fetchQuizResults,
    updateRoadmapProgress,
  }

  return (
    <LearningContext.Provider value={value}>
      {children}
    </LearningContext.Provider>
  )
}