import React, { useState, useEffect } from 'react'
import api from '../utils/api'
import { RefreshCw, CheckCircle, Clock, BookOpen } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

interface ReviewItem {
  _id: string
  question: string
  topic: string
  difficulty: number
  nextReview: string
  reviewCount: number
}

const Review: React.FC = () => {
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [currentItem, setCurrentItem] = useState<ReviewItem | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [reviewing, setReviewing] = useState(false)

  useEffect(() => {
    fetchReviewItems()
  }, [])

  const fetchReviewItems = async () => {
    try {
      const response = await api.get('/review/due')
      setReviewItems(response.data.data) // <-- Use .data
    } catch (error: any) {
      toast.error('Failed to fetch review items')
    } finally {
      setLoading(false)
    }
  }

  const startReview = () => {
    if (reviewItems.length > 0) {
      setCurrentItem(reviewItems[0])
      setReviewing(true)
      setShowAnswer(false)
    }
  }

  const handleReviewResponse = async (quality: number) => {
    if (!currentItem) return

    try {
      await api.post('/review/respond', {
        itemId: currentItem._id,
        quality
      })

      // Remove current item and move to next
      const remainingItems = reviewItems.slice(1)
      setReviewItems(remainingItems)

      if (remainingItems.length > 0) {
        setCurrentItem(remainingItems[0])
        setShowAnswer(false)
      } else {
        setReviewing(false)
        setCurrentItem(null)
        toast.success('Review session complete!')
      }
    } catch (error: any) {
      toast.error('Failed to record review')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (reviewing && currentItem) {
    return (
      <div className="max-w-3xl mx-auto animate-fade-in">
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Review Session</h1>
            <div className="text-gray-600">
              {reviewItems.length} items remaining
            </div>
          </div>

          <div className="mb-6">
            <div className="text-sm text-gray-500 mb-2">Topic: {currentItem.topic}</div>
            <h2 className="text-xl font-semibold mb-4">{currentItem.question}</h2>
            
            {!showAnswer ? (
              <button
                onClick={() => setShowAnswer(true)}
                className="btn-primary"
              >
                Show Answer
              </button>
            ) : (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">Think about your answer and rate how well you knew it.</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    onClick={() => handleReviewResponse(0)}
                    className="p-3 rounded-lg border-2 border-error-200 hover:bg-error-50 text-error-700 transition-all"
                  >
                    <div className="font-medium">Again</div>
                    <div className="text-xs">Didn't know</div>
                  </button>
                  <button
                    onClick={() => handleReviewResponse(3)}
                    className="p-3 rounded-lg border-2 border-warning-200 hover:bg-warning-50 text-warning-700 transition-all"
                  >
                    <div className="font-medium">Hard</div>
                    <div className="text-xs">Struggled</div>
                  </button>
                  <button
                    onClick={() => handleReviewResponse(4)}
                    className="p-3 rounded-lg border-2 border-primary-200 hover:bg-primary-50 text-primary-700 transition-all"
                  >
                    <div className="font-medium">Good</div>
                    <div className="text-xs">Remembered</div>
                  </button>
                  <button
                    onClick={() => handleReviewResponse(5)}
                    className="p-3 rounded-lg border-2 border-success-200 hover:bg-success-50 text-success-700 transition-all"
                  >
                    <div className="font-medium">Easy</div>
                    <div className="text-xs">Knew well</div>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="text-sm text-gray-500">
            Review #{currentItem.reviewCount + 1} • 
            Last reviewed: {new Date(currentItem.nextReview).toLocaleDateString()}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Spaced Repetition Review</h1>
          <p className="text-gray-600 mt-2">Review concepts at optimal intervals for better retention</p>
        </div>
        <button
          onClick={fetchReviewItems}
          className="btn-secondary"
        >
          <RefreshCw className="w-5 h-5 mr-2" />
          Refresh
        </button>
      </div>

      {reviewItems.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle className="w-16 h-16 text-success-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">All caught up!</h2>
          <p className="text-gray-600 mb-6">No items are due for review right now. Great job!</p>
          <p className="text-sm text-gray-500">
            Come back later or take some quizzes to add more items to your review queue.
          </p>
        </div>
      ) : (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Clock className="w-8 h-8 text-primary-500" />
              <div>
                <h2 className="text-xl font-semibold">Items Due for Review</h2>
                <p className="text-gray-600">{reviewItems.length} concepts waiting</p>
              </div>
            </div>
            <button
              onClick={startReview}
              className="btn-primary"
            >
              Start Review Session
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reviewItems.slice(0, 6).map((item) => (
              <div key={item._id} className="border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-2">{item.topic}</div>
                <h3 className="font-medium mb-2 line-clamp-2">{item.question}</h3>
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>Review #{item.reviewCount}</span>
                  <span>Due: {new Date(item.nextReview).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>

          {reviewItems.length > 6 && (
            <div className="text-center mt-4 text-gray-500">
              +{reviewItems.length - 6} more items
            </div>
          )}
        </div>
      )}

      {/* Info Section */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">How Spaced Repetition Works</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-2">The Science</h4>
            <p className="text-gray-600 text-sm">
              Spaced repetition uses the psychological spacing effect to improve long-term retention. 
              Items are reviewed at increasing intervals based on how well you remember them.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Response Quality</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li><strong>Again:</strong> Review tomorrow</li>
              <li><strong>Hard:</strong> Review in 2-3 days</li>
              <li><strong>Good:</strong> Review in 1 week</li>
              <li><strong>Easy:</strong> Review in 2+ weeks</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Review