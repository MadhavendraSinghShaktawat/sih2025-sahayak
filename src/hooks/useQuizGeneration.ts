import { useState, useCallback } from "react";
import { llmService } from "@/lib/llm/service";
import {
  QuizGenerationRequest,
  QuizGenerationResponse,
  QuizOptions,
} from "@/lib/llm/types";

export interface UseQuizGenerationReturn {
  generateQuiz: (
    content: string,
    contentType: "text" | "pdf" | "image",
    options?: QuizOptions
  ) => Promise<QuizGenerationResponse>;
  isGenerating: boolean;
  error: string | null;
  lastQuiz: QuizGenerationResponse | null;
  availableProviders: string[];
}

export function useQuizGeneration(): UseQuizGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastQuiz, setLastQuiz] = useState<QuizGenerationResponse | null>(null);

  const generateQuiz = useCallback(
    async (
      content: string,
      contentType: "text" | "pdf" | "image",
      options: QuizOptions = {}
    ): Promise<QuizGenerationResponse> => {
      setIsGenerating(true);
      setError(null);

      try {
        const request: QuizGenerationRequest = {
          content,
          contentType,
          options: {
            subject: options.subject || "General",
            class: options.class || "Any",
            language: options.language || "English",
            difficulty: options.difficulty || "medium",
            type: options.type || "mcq",
            questionCount: options.questionCount || 5,
            ...options,
          },
        };

        const response = await llmService.generateQuiz(request);
        setLastQuiz(response);

        if (!response.success) {
          setError(response.error || "Quiz generation failed");
        }

        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
        setError(errorMessage);

        const errorResponse: QuizGenerationResponse = {
          success: false,
          error: errorMessage,
          provider: "unknown",
        };

        setLastQuiz(errorResponse);
        return errorResponse;
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  const availableProviders = llmService.getAvailableProviders();

  return {
    generateQuiz,
    isGenerating,
    error,
    lastQuiz,
    availableProviders,
  };
}
