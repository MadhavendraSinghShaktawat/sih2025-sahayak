"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Question, Quiz } from "@/lib/llm/types";
import { supabase } from "@/lib/supabaseClient";

type AnswerMap = Record<string, string | number>;

interface QuizDisplayProps {
  quiz: Quiz;
  roomId?: string;
  onComplete?: (result: {
    score: number;
    total: number;
    answers: AnswerMap;
    timeTaken: number;
  }) => void;
}

function QuestionCard({
  question,
  answer,
  onAnswer,
}: {
  question: Question;
  answer: string | number | undefined;
  onAnswer: (value: string | number) => void;
}) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="mb-3 font-medium text-gray-900">{question.question}</div>
      {question.type === "mcq" && (
        <div className="grid gap-2">
          {question.options?.map((opt, idx) => {
            const selected = answer === idx;
            return (
              <button
                key={idx}
                onClick={() => onAnswer(idx)}
                className={`text-left rounded-md border px-3 py-2 text-sm transition-colors ${
                  selected
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "hover:bg-gray-50"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}
      {question.type === "true-false" && (
        <div className="grid grid-cols-2 gap-2">
          {["True", "False"].map((opt, idx) => {
            const selected = answer === idx;
            return (
              <button
                key={opt}
                onClick={() => onAnswer(idx)}
                className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                  selected
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "hover:bg-gray-50"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function QuizDisplay({ quiz, roomId, onComplete }: QuizDisplayProps) {
  const [index, setIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<AnswerMap>({});
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [completed, setCompleted] = React.useState(false);
  const [result, setResult] = React.useState<{
    score: number;
    total: number;
    timeTaken: number;
  } | null>(null);
  const [startTime, setStartTime] = React.useState<number>(Date.now());
  const [saving, setSaving] = React.useState(false);
  
  // AI Feedback state
  const [answerFeedback, setAnswerFeedback] = React.useState<{
    questionId: string;
    isCorrect: boolean;
    explanation: string;
    showBubble: boolean;
  } | null>(null);
  
  // Auto-hide timer for correct answers
  const autoHideTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  
  // Wrong answers tracking
  const [wrongAnswers, setWrongAnswers] = React.useState<Array<{
    questionId: string;
    questionText: string;
    studentAnswer: string | number;
    correctAnswer: string | number;
    timestamp: number;
  }>>([]);

  // First-attempt tracking (used for scoring and analytics)
  const [firstAttemptAnswers, setFirstAttemptAnswers] = React.useState<Record<string, {
    answer: string | number;
    isCorrect: boolean;
  }>>({});

  // Debug logging
  console.log("QuizDisplay received quiz:", quiz);
  console.log("Quiz questions:", quiz?.questions);
  console.log("Current index:", index);

  // Early return if quiz data is invalid
  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    console.log("Quiz data is invalid, returning error");
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">❌</div>
          <p>Invalid quiz data</p>
        </div>
      </div>
    );
  }

  const current = quiz.questions[index];
  
  // Additional safety check for current question
  if (!current || !current.id) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">❌</div>
          <p>Invalid question data</p>
        </div>
      </div>
    );
  }

  const isLast = index === quiz.questions.length - 1;
  const isAnswered = answers[current.id] !== undefined;

  const handleAnswer = (value: string | number) => {
    if (!current) return;
    
    // Update answers
    const updated = { ...answers, [current.id]: value };
    setAnswers(updated);
    
    // Check if answer is correct
    const isCorrect = String(value) === String(current.correctAnswer);
    
    // Record first attempt only (for scoring and analytics)
    if (!firstAttemptAnswers[current.id]) {
      const firstAttempt = { answer: value, isCorrect };
      setFirstAttemptAnswers(prev => ({ ...prev, [current.id]: firstAttempt }));

      // Track only the first wrong answer per question
      if (!isCorrect) {
        const wrongAnswer = {
          questionId: current.id,
          questionText: current.question,
          studentAnswer: value,
          correctAnswer: current.correctAnswer,
          timestamp: Date.now()
        };
        setWrongAnswers(prev => [...prev, wrongAnswer]);
      }
    }
    
    // Get feedback message
    let explanation = "";
    if (current.feedback) {
      explanation = isCorrect ? current.feedback.correct : current.feedback.incorrect;
    } else if (current.explanations) {
      explanation = isCorrect ? current.explanations.correct : current.explanations.incorrect[0] || "No explanation available";
    } else {
      // Fallback for old quizzes
      explanation = isCorrect ? "✅ Correct!" : "❌ Incorrect.";
    }
    
    // Show AI feedback bubble
    setAnswerFeedback({
      questionId: current.id,
      isCorrect,
      explanation,
      showBubble: true
    });
    
    // Auto-hide for correct answers after 3 seconds
    if (isCorrect) {
      // Clear any existing timer
      if (autoHideTimerRef.current) {
        clearTimeout(autoHideTimerRef.current);
      }
      
      // Set new timer
      autoHideTimerRef.current = setTimeout(() => {
        setAnswerFeedback(null);
      }, 3000);
    }
  };

  const finishQuiz = async () => {
    const total = quiz.questions.length;
    let score = 0;
    for (const q of quiz.questions) {
      if (firstAttemptAnswers[q.id]?.isCorrect) score += 1;
    }
    
    const timeTaken = Math.floor((Date.now() - startTime) / 1000); // in seconds
    const result = { score, total, timeTaken };
    
    setSaving(true);
    
    // Save response to database if roomId is provided
    if (roomId) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const response = await fetch('/api/quiz-responses', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              quizId: quiz.id,
              roomId: roomId,
              answers: answers,
              score: score,
              totalQuestions: total,
              timeTaken: timeTaken,
              wrongAnswers: wrongAnswers,
            }),
          });
          
          if (!response.ok) {
            console.error('Failed to save quiz response');
          }
        }
      } catch (error) {
        console.error('Error saving quiz response:', error);
      }
    }
    
    setSaving(false);
    onComplete?.({ score, total, answers, timeTaken });
    setResult(result);
    setCompleted(true);
  };

  // Cleanup timer on unmount
  React.useEffect(() => {
    return () => {
      if (autoHideTimerRef.current) {
        clearTimeout(autoHideTimerRef.current);
      }
    };
  }, []);

  // Swipe navigation
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let startX = 0;
    let startY = 0;
    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };
    const onTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
        if (dx < 0 && index < quiz.questions.length - 1) setIndex((i) => i + 1);
        if (dx > 0 && index > 0) setIndex((i) => i - 1);
      }
    };
    el.addEventListener("touchstart", onTouchStart);
    el.addEventListener("touchend", onTouchEnd);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [index, quiz.questions.length]);

  if (completed && result) {
    return (
      <div className="w-full rounded-xl border bg-white p-6">
        <div className="mb-2 text-lg font-semibold text-gray-900">
          {quiz.title}
        </div>
        <div className="mb-6 text-sm text-gray-600">{quiz.description}</div>
        <div className="mb-6 rounded-md border bg-blue-50 p-4 text-blue-800">
          Score: <span className="font-semibold">{result.score}</span> /{" "}
          {result.total}
        </div>
        <div className="flex gap-2">
          <button
            className="rounded-md border px-3 py-2 text-sm"
            onClick={() => {
              setAnswers({});
              setIndex(0);
              setCompleted(false);
              setResult(null);
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold text-gray-900">
            {quiz.title}
          </div>
          <div className="text-sm text-gray-600">
            Question {index + 1} / {quiz.questions.length}
          </div>
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
              disabled={saving}
              className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
            >
              {saving ? "Saving..." : "Finish"}
            </button>
          ) : (
            <button
              aria-label="Next"
              onClick={() =>
                setIndex((i) => Math.min(quiz.questions.length - 1, i + 1))
              }
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

      {/* AI Feedback Bubble */}
      <AnimatePresence>
        {answerFeedback?.showBubble && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: "spring", bounce: 0.25 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-sm mx-auto"
          >
            <div className={`rounded-lg border p-4 shadow-lg ${
              answerFeedback.isCorrect 
                ? "border-emerald-100 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950"
                : "border-red-100 bg-red-50 dark:border-red-900 dark:bg-red-950"
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`flex-shrink-0 ${
                  answerFeedback.isCorrect ? "text-emerald-500" : "text-red-500"
                }`}>
                  {answerFeedback.isCorrect ? (
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className="font-medium text-sm">
                  {answerFeedback.isCorrect ? "Correct Answer" : "Incorrect Answer"}
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                {answerFeedback.explanation}
              </p>
              {!answerFeedback.isCorrect && (
                <button 
                  onClick={() => {
                    if (autoHideTimerRef.current) {
                      clearTimeout(autoHideTimerRef.current);
                    }
                    setAnswerFeedback(null);
                  }}
                  className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md transition-colors text-sm font-medium"
                >
                  Continue
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
