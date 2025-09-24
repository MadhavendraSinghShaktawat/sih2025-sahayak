'use client'

import { useState } from 'react'
import { useQuizzes } from '@/hooks/useQuizzes'
import { Button } from '@/components/ui/button'

export function QuizTestComponent() {
  const { quizzes, loading, error, refreshQuizzes, deleteQuiz } = useQuizzes()
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (quizId: string) => {
    setDeleting(quizId)
    const success = await deleteQuiz(quizId)
    setDeleting(null)
    
    if (success) {
      console.log('Quiz deleted successfully')
    } else {
      console.error('Failed to delete quiz')
    }
  }

  if (loading) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Quiz Database Test</h2>
        <p>Loading quizzes...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Quiz Database Test</h2>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p><strong>Error:</strong> {error}</p>
        </div>
        <Button onClick={refreshQuizzes} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Quiz Database Test</h2>
        <Button onClick={refreshQuizzes}>
          Refresh
        </Button>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Found {quizzes.length} quiz(es)
        </p>
      </div>

      {quizzes.length === 0 ? (
        <div className="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-3 rounded">
          <p>No quizzes found. Generate a quiz using the /quiz command to test the database!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="border border-gray-300 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{quiz.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{quiz.description}</p>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span>Subject: {quiz.metadata.subject}</span>
                    <span>Class: {quiz.metadata.class}</span>
                    <span>Difficulty: {quiz.metadata.difficulty}</span>
                    <span>Questions: {quiz.questions.length}</span>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(quiz.id)}
                  disabled={deleting === quiz.id}
                >
                  {deleting === quiz.id ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
