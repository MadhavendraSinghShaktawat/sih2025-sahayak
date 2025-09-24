'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Question, Quiz } from '@/lib/llm/types'

type AnswerMap = Record<string, string | number>

interface QuizDisplayProps {
  quiz: Quiz
  onComplete?: (result: { score: number; total: number; answers: AnswerMap }) => void
}

function QuestionCard({
  question,
  answer,
  onAnswer,
}: {
  question: Question
  answer: string | number | undefined
  onAnswer: (value: string | number) => void
}) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="mb-3 font-medium text-gray-900">{question.question}</div>
      {question.type === 'mcq' && (
        <div className="grid gap-2">
          {question.options?.map((opt, idx) => {
            const selected = answer === idx
            return (
              <button
                key={idx}
                onClick={() => onAnswer(idx)}
                className={`text-left rounded-md border px-3 py-2 text-sm transition-colors ${
                  selected ? 'border-blue-600 bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                }`}
              >
                {opt}
              </button>
            )
          })}
        </div>
      )}
      {question.type === 'true-false' && (
        <div className="grid grid-cols-2 gap-2">
          {['True', 'False'].map((opt, idx) => {
            const selected = answer === idx
            return (
              <button
                key={opt}
                onClick={() => onAnswer(idx)}
                className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                  selected ? 'border-blue-600 bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                }`}
              >
                {opt}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function QuizDisplay({ quiz, onComplete }: QuizDisplayProps) {
  const [index, setIndex] = React.useState(0)
  const [answers, setAnswers] = React.useState<AnswerMap>({})
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const [completed, setCompleted] = React.useState(false)
  const [result, setResult] = React.useState<{ score: number; total: number } | null>(null)

  const current = quiz.questions[index]
  const isLast = index === quiz.questions.length - 1
  const isAnswered = answers[current?.id] !== undefined

  const handleAnswer = (value: string | number) => {
    const updated = { ...answers, [current.id]: value }
    setAnswers(updated)
  }

  const finishQuiz = () => {
    const total = quiz.questions.length
    let score = 0
    for (const q of quiz.questions) {
      if (String(answers[q.id]) === String(q.correctAnswer)) score += 1
    }
    onComplete?.({ score, total, answers })
    setResult({ score, total })
    setCompleted(true)
  }

  // Swipe navigation
  React.useEffect(() => {
    const el = containerRef.current
    if (!el) return
    let startX = 0
    let startY = 0
    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
    }
    const onTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX
      const dy = e.changedTouches[0].clientY - startY
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
        if (dx < 0 && index < quiz.questions.length - 1) setIndex((i) => i + 1)
        if (dx > 0 && index > 0) setIndex((i) => i - 1)
      }
    }
    el.addEventListener('touchstart', onTouchStart)
    el.addEventListener('touchend', onTouchEnd)
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [index, quiz.questions.length])

  if (completed && result) {
    return (
      <div className="w-full rounded-xl border bg-white p-6">
        <div className="mb-2 text-lg font-semibold text-gray-900">{quiz.title}</div>
        <div className="mb-6 text-sm text-gray-600">{quiz.description}</div>
        <div className="mb-6 rounded-md border bg-blue-50 p-4 text-blue-800">
          Score: <span className="font-semibold">{result.score}</span> / {result.total}
        </div>
        <div className="flex gap-2">
          <button
            className="rounded-md border px-3 py-2 text-sm"
            onClick={() => {
              setAnswers({})
              setIndex(0)
              setCompleted(false)
              setResult(null)
            }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold text-gray-900">{quiz.title}</div>
          <div className="text-sm text-gray-600">Question {index + 1} / {quiz.questions.length}</div>
        </div>
        <div className="flex gap-2">
          <button
            aria-label="Previous"
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
          >
            Prev
          </button>
          {isLast ? (
            <button
              aria-label="Finish"
              onClick={finishQuiz}
              className="rounded-md border px-3 py-2 text-sm"
            >
              Finish
            </button>
          ) : (
            <button
              aria-label="Next"
              onClick={() => setIndex((i) => Math.min(quiz.questions.length - 1, i + 1))}
              className="rounded-md border px-3 py-2 text-sm"
            >
              Next
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={current.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.15 }}
        >
          <QuestionCard
            question={current}
            answer={answers[current.id]}
            onAnswer={handleAnswer}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}


