import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface WrongAnswerStats {
  totalWrongAnswers: number;
  mostCommonWrongAnswers: Array<{
    questionId: string;
    questionText: string;
    quizId: string;
    quizTitle: string;
    totalWrong: number;
    wrongAnswers: Array<{
      studentAnswer: string | number;
      correctAnswer: string | number;
      studentName: string;
      timestamp: number;
    }>;
  }>;
  studentWrongAnswers: Array<{
    studentId: string;
    studentName: string;
    totalWrongAnswers: number;
    wrongAnswers: Array<{
      questionId: string;
      questionText: string;
      studentAnswer: string | number;
      correctAnswer: string | number;
      timestamp: number;
      quizTitle: string;
    }>;
  }>;
  quizWrongAnswers: Array<{
    quizId: string;
    quizTitle: string;
    totalWrongAnswers: number;
    wrongAnswers: Array<{
      questionId: string;
      questionText: string;
      studentAnswer: string | number;
      correctAnswer: string | number;
      timestamp: number;
      studentName: string;
    }>;
  }>;
}

interface QuizAnalytics {
  totalResponses: number;
  averageScore: number;
  averageTime: number;
  completionRate: number;
  quizStats: Array<{
    quizId: string;
    quizTitle: string;
    totalResponses: number;
    averageScore: number;
    averageTime: number;
    uniqueStudents: number;
  }>;
  studentStats: Array<{
    studentId: string;
    studentName: string;
    totalQuizzes: number;
    averageScore: number;
    averageTime: number;
  }>;
  recentActivity: Array<{
    id: string;
    studentName: string;
    quizTitle: string;
    score: number;
    totalQuestions: number;
    timeTaken: number;
    completedAt: string;
    roomName: string;
  }>;
  wrongAnswerStats?: WrongAnswerStats;
}

interface QuizAnalyticsData {
  analytics: QuizAnalytics | null;
  responses: any[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseQuizAnalyticsOptions {
  quizId?: string;
  roomId?: string;
  timeRange?: '7d' | '30d' | '90d' | 'all';
}

export function useQuizAnalytics(options: UseQuizAnalyticsOptions = {}): QuizAnalyticsData {
  const [analytics, setAnalytics] = useState<QuizAnalytics | null>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { quizId, roomId, timeRange = '7d' } = options;

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const params = new URLSearchParams();
      if (quizId) params.append('quizId', quizId);
      if (roomId) params.append('roomId', roomId);
      if (timeRange) params.append('timeRange', timeRange);

      const url = `/api/quiz-analytics?${params.toString()}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch quiz analytics');
      }

      const data = await response.json();
      setAnalytics(data.analytics);
      setResponses(data.responses || []);
    } catch (err) {
      console.error('Error fetching quiz analytics:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [quizId, roomId, timeRange]);

  return {
    analytics,
    responses,
    loading,
    error,
    refetch: fetchAnalytics,
  };
}
