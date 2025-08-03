import React, { useState, useEffect } from 'react'
import { useLearning } from '../context/LearningContext'
import { Plus, BookOpen, CheckCircle, Clock, Play } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import { Link } from 'react-router-dom'

const Roadmaps: React.FC = () => {
  const { roadmaps, loading, createRoadmap, fetchRoadmaps, updateRoadmapProgress } = useLearning()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    topic: '',
    level: 'beginner'
  })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchRoadmaps()
  }, [])

  const handleCreateRoadmap = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.topic.trim()) return

    setCreating(true)
    try {
      await createRoadmap(formData.topic, formData.level)
      setFormData({ topic: '', level: 'beginner' })
      setShowCreateForm(false)
    } catch (error) {
      console.error('Failed to create roadmap:', error)
    } finally {
      setCreating(false)
    }
  }

  const handleStepComplete = async (roadmapId: string, stepIndex: number) => {
    try {
      await updateRoadmapProgress(roadmapId, stepIndex)
    } catch (error) {
      console.error('Failed to update progress:', error)
    }
  }

  if (loading && roadmaps.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Learning Roadmaps</h1>
          <p className="text-gray-600 mt-2">Create and follow AI-generated learning paths</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-primary"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Roadmap
        </button>
      </div>

      {/* Create Roadmap Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Create New Roadmap</h2>
            <form onSubmit={handleCreateRoadmap} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Learning Topic
                </label>
                <input
                  type="text"
                  value={formData.topic}
                  onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                  className="input-field"
                  placeholder="e.g., Data Structures & Algorithms, Machine Learning, React.js"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skill Level
                </label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
                  className="input-field"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 btn-primary"
                >
                  {creating ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Creating...
                    </>
                  ) : (
                    'Create Roadmap'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Roadmaps Grid */}
      {roadmaps.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No roadmaps yet</h2>
          <p className="text-gray-600 mb-6">Create your first learning roadmap to get started</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Your First Roadmap
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.isArray(roadmaps) && roadmaps.map((roadmap,index) => {

            const completedSteps = Array.isArray(roadmap.steps)
  ? roadmap.steps.filter(s => s.completed).length
  : 0;
const totalSteps = Array.isArray(roadmap.steps) ? roadmap.steps.length : 0;
const progress = totalSteps ? Math.round((completedSteps / totalSteps) * 100) : 0;

            return (
              <div key={roadmap._id || index} className="card">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold">{roadmap.title}</h3>
                <span className={`px-2 py-1 text-xs rounded ${
                  roadmap.level === 'beginner' ? 'bg-green-100 text-green-600' :
                  roadmap.level === 'intermediate' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-red-100 text-red-600'
                }`}>
                  {roadmap.level}
                </span>
              </div>
              
              <p className="text-gray-600 mb-4">{roadmap.description}</p>
              
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Progress</span>
                  <span className="text-sm font-medium">{roadmap.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${roadmap.progress}%` }}
                  />
                </div>
              </div>
              
              <div className="space-y-2 mb-6">
                <h4 className="font-medium text-sm text-gray-700">Steps:</h4>
{Array.isArray(roadmap.steps) && roadmap.steps.slice(0, 3).map((step, index) => (
    <div key={`${roadmap._id}-${step.title}-${index}`} className="flex items-center space-x-2">
    {step.completed ? (
      <CheckCircle className="w-4 h-4 text-success-500" />
    ) : (
      <Clock className="w-4 h-4 text-gray-400" />
    )}
    <span className={`text-sm ${step.completed ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
      {step.title}
    </span>
  </div>
))}

{Array.isArray(roadmap.steps) && roadmap.steps.length > 3 && (
  <p className="text-xs text-gray-500">+{roadmap.steps.length - 3} more steps</p>
)}

                {Array.isArray(roadmap.steps) && roadmap.steps.length > 3 && (
  <p className="text-xs text-gray-500">
    +{roadmap.steps.length - 3} more steps
  </p>
)}

              </div>
              
              <div className="flex space-x-2">
                <Link to={`/roadmaps/${roadmap._id}`} className="flex-1 btn-primary text-sm py-2 flex items-center justify-center">
                  <Play className="w-4 h-4 mr-1" />
                  Continue
                </Link>
              </div>
            </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Roadmaps