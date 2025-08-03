import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLearning } from '../context/LearningContext'
import { BookOpen, Target, Clock, TrendingUp, Plus } from 'lucide-react'
import ProgressChart from '../components/ProgressChart'
import LoadingSpinner from '../components/LoadingSpinner'

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth()
  const { roadmaps, quizResults, loading, fetchRoadmaps, fetchQuizResults } = useLearning()

  useEffect(() => {
    fetchRoadmaps()
    fetchQuizResults()
  }, [])

  const completedRoadmaps = Array.isArray(roadmaps)
    ? roadmaps.filter(r => r.progress === 100).length
    : 0;

  const averageScore = Array.isArray(quizResults) && quizResults.length > 0
    ? Math.round(
        quizResults.reduce((sum, r) => sum + r.percentage, 0) / quizResults.length
      )
    : 0;


    const chartData = Array.isArray(quizResults)
  ? quizResults.slice(-7).map(result => {
      let dateStr = '';
      if (result.completedAt && !isNaN(Date.parse(result.completedAt))) {
        dateStr = new Date(result.completedAt).toISOString().split('T')[0];
      } else {
        dateStr = 'N/A';
      }
      return {
        date: dateStr,
        score: result.percentage,
      };
    })
  : [];


    if (loading) {
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
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {currentUser?.displayName || 'Learner'}!
            </h1>
            <p className="text-gray-600 mt-2">Track your progress and continue your learning journey</p>
          </div>
          <Link to="/roadmaps" className="btn-primary">
            <Plus className="w-5 h-5 mr-2" />
            New Roadmap
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Roadmaps</p>
                <p className="text-2xl font-bold text-primary-600">{roadmaps.length}</p>
              </div>
              <BookOpen className="w-8 h-8 text-primary-500" />
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-success-600">{completedRoadmaps}</p>
              </div>
              <Target className="w-8 h-8 text-success-500" />
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Quizzes Taken</p>
                <p className="text-2xl font-bold text-secondary-600">{quizResults.length}</p>
              </div>
              <Clock className="w-8 h-8 text-secondary-500" />
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Score</p>
                <p className="text-2xl font-bold text-accent-600">{averageScore}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-accent-500" />
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Roadmaps */}
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Recent Roadmaps</h2>
              <Link to="/roadmaps" className="text-primary-500 hover:text-primary-600 text-sm font-medium">
                View All
              </Link>
            </div>
            
            {roadmaps.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No roadmaps yet</p>
                <Link to="/roadmaps" className="btn-primary">
                  Create Your First Roadmap
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {Array.isArray(roadmaps) && roadmaps.slice(0, 3).map((roadmap) => {
                  const completedSteps = Array.isArray(roadmap.steps)
                    ? roadmap.steps.filter(s => s.completed).length
                    : 0;
                  const totalSteps = Array.isArray(roadmap.steps) ? roadmap.steps.length : 0;
                  const progress = totalSteps ? Math.round((completedSteps / totalSteps) * 100) : 0;

                  return (
                    <div key={roadmap._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">{roadmap.title}</h3>
                        <span className="text-xs bg-primary-100 text-primary-600 px-2 py-1 rounded">
                          {roadmap.level}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{roadmap.description}</p>
                      <div className="flex justify-between items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-4">
                          <div 
                            className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{progress}%</span>
                      </div>
                    </div>
                  )
                })}

              </div>
            )}
          </div>

          {/* Progress Chart */}
          <div>
            {chartData.length > 0 ? (
              <ProgressChart data={chartData} />
            ) : (
              <div className="card text-center py-8">
                <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No quiz data yet</p>
                <p className="text-sm text-gray-400">Take some quizzes to see your progress</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Quiz Results */}
        {quizResults.length > 0 && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-6">Recent Quiz Results</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4">Topic</th>
                    <th className="text-left py-3 px-4">Score</th>
                    <th className="text-left py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {quizResults.slice(-5).reverse().map((result) => (
                    <tr key={result._id} className="border-b border-gray-100">
                      <td className="py-3 px-4">{result.topic}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-sm ${
                          result.percentage >= 80 ? 'bg-success-100 text-success-600' :
                          result.percentage >= 60 ? 'bg-warning-100 text-warning-600' :
                          'bg-error-100 text-error-600'
                        }`}>
                          {result.score}/{result.totalQuestions} ({result.percentage}%)
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {new Date(result.completedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    )
  }
  
  export default Dashboard