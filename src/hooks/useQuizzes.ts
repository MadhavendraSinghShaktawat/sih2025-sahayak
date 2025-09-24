import { useState, useEffect } from 'react'
import { Quiz } from '@/lib/llm/types'
import { supabase } from '@/lib/supabaseClient'

export interface UseQuizzesReturn {
  quizzes: Quiz[]
  loading: boolean
  error: string | null
  refreshQuizzes: () => Promise<void>
  deleteQuiz: (quizId: string) => Promise<boolean>
}

export function useQuizzes(): UseQuizzesReturn {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchQuizzes = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('User not authenticated')
      }

      const response = await fetch('/api/quizzes', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch quizzes')
      }

      if (data.success) {
        setQuizzes(data.quizzes || [])
      } else {
        throw new Error(data.error || 'Failed to fetch quizzes')
      }
    } catch (err) {
      console.error('Error fetching quizzes:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const deleteQuiz = async (quizId: string): Promise<boolean> => {
    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('User not authenticated')
      }

      const response = await fetch(`/api/quizzes?id=${quizId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete quiz')
      }

      if (data.success) {
        // Remove the quiz from local state
        setQuizzes(prev => prev.filter(quiz => quiz.id !== quizId))
        return true
      } else {
        throw new Error(data.error || 'Failed to delete quiz')
      }
    } catch (err) {
      console.error('Error deleting quiz:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      return false
    }
  }

  useEffect(() => {
    fetchQuizzes()
  }, [])

  return {
    quizzes,
    loading,
    error,
    refreshQuizzes: fetchQuizzes,
    deleteQuiz
  }
}
