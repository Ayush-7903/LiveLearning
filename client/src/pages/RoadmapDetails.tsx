import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useLearning } from '../context/LearningContext'
import ProgressChart from '../components/ProgressChart'
import LoadingSpinner from '../components/LoadingSpinner'
import { CheckCircle, Clock } from 'lucide-react'

const RoadmapDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { roadmaps, updateRoadmapProgress, loading } = useLearning()
  const [roadmap, setRoadmap] = useState<any>(null)
  const [openStep, setOpenStep] = useState<number | null>(null)

  useEffect(() => {
    const found = roadmaps.find(r => r._id === id)
    setRoadmap(found)
  }, [roadmaps, id])

  if (loading || !roadmap) {
    return <div className="flex justify-center items-center min-h-[60vh]"><LoadingSpinner size="lg" /></div>
  }

  const completedSteps = Array.isArray(roadmap.steps)
    ? roadmap.steps.filter(s => s.completed).length
    : 0;
  const totalSteps = Array.isArray(roadmap.steps) ? roadmap.steps.length : 0;
  const progress = totalSteps ? Math.round((completedSteps / totalSteps) * 100) : 0

  return (
    <div className="max-w-2xl mx-auto mt-8 card p-6 space-y-6">
      <h2 className="text-2xl font-bold">{roadmap.title}</h2>
      <p className="text-gray-600 mb-2">{roadmap.description}</p>
      <div className="mb-4">
        <span className="badge">{roadmap.level}</span>
        <span className="ml-4 text-sm text-gray-500">Estimated: {roadmap.estimatedDuration}</span>
      </div>
      <div>
        <div className="font-semibold mb-1">Progress: {progress}%</div>
        <ProgressChart progress={progress} />
      </div>
      <div>
        <h3 className="font-semibold mb-2">Steps:</h3>
        <ul className="space-y-3">
          {roadmap.steps.map((step: any, idx: number) => (
            <li key={idx} className="flex flex-col space-y-1">
              <div className="flex items-center space-x-2">
                {step.completed ? (
                  <CheckCircle className="text-green-500 w-5 h-5" />
                ) : (
                  <Clock className="text-gray-400 w-5 h-5" />
                )}
                <span className={step.completed ? 'line-through text-gray-400' : ''}>
                  {step.title}
                </span>
                <button
                  className="ml-2 btn-secondary px-2 py-1 text-xs"
                  onClick={() => setOpenStep(openStep === idx ? null : idx)}
                >
                  {openStep === idx ? "Hide Materials" : "Show Materials"}
                </button>
                {!step.completed && (
                  <button
                    className="ml-2 btn-secondary px-2 py-1 text-xs"
                    onClick={() => updateRoadmapProgress(roadmap._id, idx)}
                  >
                    Mark Complete
                  </button>
                )}
              </div>
              {/* Study Materials Section */}
              {openStep === idx && (
                <div className="ml-7 mt-1">
                  <div className="text-sm text-gray-600 mb-1">{step.description}</div>
                  {Array.isArray(step.resources) && step.resources.length > 0 && (
                    <ul className="list-disc ml-5 text-xs text-blue-700">
                      {step.resources.map((resource: string, rIdx: number) => (
                        <li key={rIdx}>
                          {resource.startsWith('http') ? (
                            <a href={resource} target="_blank" rel="noopener noreferrer">{resource}</a>
                          ) : (
                            resource
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-6 flex space-x-3">
        <a href={`/quiz/${roadmap._id}`} className="btn-primary flex items-center">
          Take Quiz
        </a>
      </div>
    </div>
  )
}

export default RoadmapDetails