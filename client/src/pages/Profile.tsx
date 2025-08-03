import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { User, Settings, BookOpen, Trophy, Clock } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

interface UserProfile {
  learningStyle: string[]
  preferredTopics: string[]
  studyGoals: string
  skillLevel: string
}

const Profile: React.FC = () => {
  const { currentUser } = useAuth()
  const [profile, setProfile] = useState<UserProfile>({
    learningStyle: [],
    preferredTopics: [],
    studyGoals: '',
    skillLevel: 'beginner'
  })
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

const fetchProfile = async () => {
  try {
    const response = await api.get('/profile')
    const data = response.data.data // <-- Use .data

    setProfile({
      learningStyle: Array.isArray(data.learningStyle) ? data.learningStyle : [],
      preferredTopics: Array.isArray(data.preferredTopics) ? data.preferredTopics : [],
      studyGoals: typeof data.studyGoals === 'string' ? data.studyGoals : '',
      skillLevel: ['beginner', 'intermediate', 'advanced'].includes(data.skillLevel) ? data.skillLevel : 'beginner',
    })
  } catch (error) {
    // Use defaults silently
  }
}

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      await api.put('/profile', profile)
      setEditing(false)
      toast.success('Profile updated successfully!')
    } catch (error: any) {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const learningStyles = [
    'Visual',
    'Auditory',
    'Hands-on',
    'Reading/Writing',
    'Fast Learner',
    'Step-by-step'
  ]

  const topicOptions = [
    'Data Structures & Algorithms',
    'Machine Learning',
    'Web Development',
    'Mobile Development',
    'Database Design',
    'System Design',
    'DevOps',
    'Cybersecurity'
  ]

  const handleStyleToggle = (style: string) => {
    setProfile(prev => ({
      ...prev,
      learningStyle: prev.learningStyle.includes(style)
        ? prev.learningStyle.filter(s => s !== style)
        : [...prev.learningStyle, style]
    }))
  }

  const handleTopicToggle = (topic: string) => {
    setProfile(prev => ({
      ...prev,
      preferredTopics: prev.preferredTopics.includes(topic)
        ? prev.preferredTopics.filter(t => t !== topic)
        : [...prev.preferredTopics, topic]
    }))
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-2">Customize your learning experience</p>
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="btn-primary"
          >
            <Settings className="w-5 h-5 mr-2" />
            Edit Profile
          </button>
        ) : (
          <div className="flex space-x-3">
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="btn-primary"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Basic Info */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">{currentUser?.displayName}</h2>
              <p className="text-gray-600">{currentUser?.email}</p>
              <div className="mt-4 flex justify-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <BookOpen className="w-4 h-4 mr-1" />
                  <span>Learner</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>Member since {new Date(currentUser?.metadata.creationTime || '').toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Learning Style */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Learning Style</h3>
            <p className="text-gray-600 mb-4">Select your preferred learning styles to get personalized content</p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {learningStyles.map((style) => (
                <button
                  key={style}
                  onClick={() => editing && handleStyleToggle(style)}
                  disabled={!editing}
                  className={`p-3 rounded-lg border-2 text-sm transition-all ${
                    (profile.learningStyle ?? []).includes(style)
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${!editing ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* Preferred Topics */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Preferred Topics</h3>
            <p className="text-gray-600 mb-4">Choose topics you're interested in learning</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {topicOptions.map((topic) => (
                <button
                  key={topic}
                  onClick={() => editing && handleTopicToggle(topic)}
                  disabled={!editing}
                  className={`p-3 rounded-lg border-2 text-sm text-left transition-all ${
                    profile.preferredTopics.includes(topic)
                      ? 'border-secondary-500 bg-secondary-50 text-secondary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${!editing ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          {/* Skill Level */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Overall Skill Level</h3>
            <div className="space-y-3">
              {['beginner', 'intermediate', 'advanced'].map((level) => (
                <label key={level} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="skillLevel"
                    value={level}
                    checked={profile.skillLevel === level}
                    onChange={(e) => setProfile(prev => ({ ...prev, skillLevel: e.target.value }))}
                    disabled={!editing}
                    className="mr-3"
                  />
                  <span className="capitalize">{level}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Study Goals */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Study Goals</h3>
            <textarea
              value={profile.studyGoals}
              onChange={(e) => setProfile(prev => ({ ...prev, studyGoals: e.target.value }))}
              disabled={!editing}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={4}
              placeholder="What are your learning goals? What do you want to achieve?"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile