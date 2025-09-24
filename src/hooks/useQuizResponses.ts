import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface QuizResponse {
  id: string;
  quiz_id: string;
  student_id: string;
  room_id: string;
  answers: Record<string, any>;
  score: number;
  total_questions: number;
  completed_at: string;
  time_taken: number;
  quiz: {
    title: string;
    subject: string;
    class_level: string;
    difficulty: string;
  };
  student: {
    name: string;
  };
  room: {
    passcode: string;
    created_by: string;
  };
}

interface QuizResponsesData {
  responses: QuizResponse[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useQuizResponses(studentId?: string): QuizResponsesData {
  const [responses, setResponses] = useState<QuizResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResponses = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const url = studentId 
        ? `/api/quiz-responses?studentId=${studentId}`
        : '/api/quiz-responses';

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch quiz responses');
      }

      const data = await response.json();
      setResponses(data.responses || []);
    } catch (err) {
      console.error('Error fetching quiz responses:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResponses();
  }, [studentId]);

  return {
    responses,
    loading,
    error,
    refetch: fetchResponses,
  };
}
