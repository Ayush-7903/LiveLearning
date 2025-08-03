import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { Clock, HelpCircle, CheckCircle, XCircle } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

interface Question {
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
}

interface QuizData {
  questions: Question[]
  topic: string
}

const Quiz: React.FC = () => {
  const { topicId } = useParams()
  const navigate = useNavigate()
  const [quizData, setQuizData] = useState<QuizData | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [showResults, setShowResults] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes
  const [showExplanation, setShowExplanation] = useState(false)

  useEffect(() => {
    fetchQuiz()
    // eslint-disable-next-line
  }, []) // Only run once on mount

  useEffect(() => {
    if (quizData && timeLeft > 0 && !showResults) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmitQuiz()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [quizData, timeLeft, showResults])

  const fetchQuiz = async () => {
    try {
      const response = await api.get(`/quiz/generate/${topicId}`)
      setQuizData(response.data.data) // <-- Use .data
      setAnswers(new Array(response.data.data.questions.length).fill(-1))
    } catch (error: any) {
      toast.error('Failed to load quiz')
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestion] = answerIndex
    setAnswers(newAnswers)
  }

  const handleNextQuestion = () => {
    if (currentQuestion < (quizData?.questions.length || 0) - 1) {
      setCurrentQuestion(prev => prev + 1)
      setShowExplanation(false)
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1)
      setShowExplanation(false)
    }
  }

  const handleSubmitQuiz = async () => {
    if (!quizData) return

    setSubmitting(true)
    try {
      const response = await api.post('/quiz/submit', {
        topic: quizData.topic,
        questions: quizData.questions,
        answers: answers
      })
      // Optionally use response.data.data for result
      setShowResults(true)
      toast.success('Quiz submitted successfully!')
    } catch (error: any) {
      toast.error('Failed to submit quiz')
    } finally {
      setSubmitting(false)
    }
  }

  const getAIExplanation = async (questionIndex: number) => {
    try {
      const question = quizData?.questions[questionIndex]
      if (!question) return

      const response = await api.post('/quiz/explain', {
        question: question.question,
        options: question.options,
        correctAnswer: question.correctAnswer,
        userAnswer: answers[questionIndex]
      })

      // Show explanation in a toast or modal
      toast.success('Explanation generated!')
    } catch (error: any) {
      toast.error('Failed to get explanation')
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const calculateScore = () => {
    if (!quizData) return { score: 0, percentage: 0 }
    
    const correctAnswers = answers.reduce((count, answer, index) => {
      return answer === quizData.questions[index].correctAnswer ? count + 1 : count
    }, 0)
    
    return {
      score: correctAnswers,
      percentage: Math.round((correctAnswers / quizData.questions.length) * 100)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!quizData) {
    return (
      <div className="text-center py-16">
        <XCircle className="w-16 h-16 text-error-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Quiz not found</h2>
        <button onClick={() => navigate('/dashboard')} className="btn-primary">
          Back to Dashboard
        </button>
      </div>
    )
  }

  if (showResults) {
    const { score, percentage } = calculateScore()
    
    return (
      <div className="max-w-3xl mx-auto animate-fade-in">
        <div className="card text-center">
          <div className="mb-6">
            {percentage >= 80 ? (
              <CheckCircle className="w-16 h-16 text-success-500 mx-auto mb-4" />
            ) : (
              <XCircle className="w-16 h-16 text-error-500 mx-auto mb-4" />
            )}
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Complete!</h1>
            <p className="text-gray-600">Here are your results for {quizData.topic}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">{score}</div>
              <div className="text-gray-600">Correct Answers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary-600 mb-2">{quizData.questions.length}</div>
              <div className="text-gray-600">Total Questions</div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold mb-2 ${percentage >= 80 ? 'text-success-600' : 'text-error-600'}`}>
                {percentage}%
              </div>
              <div className="text-gray-600">Score</div>
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-secondary"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Retake Quiz
            </button>
          </div>
        </div>

        {/* Detailed Results */}
        <div className="card mt-6">
          <h2 className="text-xl font-semibold mb-6">Detailed Results</h2>
          <div className="space-y-6">
            {quizData.questions.map((question, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-medium">{question.question}</h3>
                  {answers[index] === question.correctAnswer ? (
                    <CheckCircle className="w-5 h-5 text-success-500 flex-shrink-0 ml-2" />
                  ) : (
                    <XCircle className="w-5 h-5 text-error-500 flex-shrink-0 ml-2" />
                  )}
                </div>
                
                <div className="space-y-2">
                  {question.options.map((option, optionIndex) => (
                    <div
                      key={optionIndex}
                      className={`p-2 rounded ${
                        optionIndex === question.correctAnswer
                          ? 'bg-success-100 text-success-700'
                          : optionIndex === answers[index] && answers[index] !== question.correctAnswer
                          ? 'bg-error-100 text-error-700'
                          : 'bg-gray-50'
                      }`}
                    >
                      {option}
                      {optionIndex === question.correctAnswer && (
                        <span className="ml-2 text-xs">(Correct)</span>
                      )}
                      {optionIndex === answers[index] && answers[index] !== question.correctAnswer && (
                        <span className="ml-2 text-xs">(Your answer)</span>
                      )}
                    </div>
                  ))}
                </div>

                {answers[index] !== question.correctAnswer && (
                  <button
                    onClick={() => getAIExplanation(index)}
                    className="mt-3 text-primary-500 hover:text-primary-600 text-sm font-medium"
                  >
                    <HelpCircle className="w-4 h-4 inline mr-1" />
                    Why is this wrong?
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const currentQ = quizData.questions[currentQuestion]
  const progress = ((currentQuestion + 1) / quizData.questions.length) * 100

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="card mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {quizData?.topic || quizData?.title || "Quiz"}
          </h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-gray-600">
              <Clock className="w-4 h-4 mr-1" />
              <span className={`${timeLeft < 60 ? 'text-error-600 font-bold' : ''}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
            <span className="text-gray-600">
              {currentQuestion + 1} of {quizData.questions.length}
            </span>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-6">{currentQ.question}</h2>
        
        <div className="space-y-3 mb-8">
          {currentQ.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(index)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                answers[currentQuestion] === index
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                  answers[currentQuestion] === index
                    ? 'border-primary-500 bg-primary-500'
                    : 'border-gray-300'
                }`}>
                  {answers[currentQuestion] === index && (
                    <div className="w-full h-full rounded-full bg-white scale-50" />
                  )}
                </div>
                <span>{option}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={handlePreviousQuestion}
            disabled={currentQuestion === 0}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <div className="flex space-x-3">
            {currentQuestion === quizData.questions.length - 1 ? (
              <button
                onClick={handleSubmitQuiz}
                disabled={submitting || answers.includes(-1)}
                className="btn-primary"
              >
                {submitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Submitting...
                  </>
                ) : (
                  'Submit Quiz'
                )}
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                disabled={answers[currentQuestion] === -1}
                className="btn-primary"
              >
                Next
              </button>
            )}
          </div>
        </div>
        {answers.includes(-1) && (
          <p className="text-red-500 text-sm mt-2">
            Please answer all questions before submitting.
          </p>
        )}
      </div>

      {/* Render all questions and options (for review or admin purposes) */}
      <div className="mt-8">
        <div className="quiz-card">
          {/* Render current question and options here */}
        </div>
      </div>
    </div>
  )
}

export default Quiz