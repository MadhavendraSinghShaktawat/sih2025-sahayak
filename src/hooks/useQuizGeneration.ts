"use client";

import { useState, useCallback } from "react";
import { QuizOptions } from "@/lib/llm/types";
import { useOfflineQuizGeneration } from "./useOfflineQuizGeneration";
import { supabase } from "@/lib/supabaseClient";

export interface QuizGenerationRequest {
  content: string;
  contentType: "text" | "pdf" | "image";
  options: QuizOptions;
}

export interface QuizGenerationResponse {
  success: boolean;
  quiz?: any;
  provider?: string;
  processingTime?: number;
  stored?: boolean;
  error?: string;
}

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
  const { generateQuizOffline, isGenerating: isOfflineGenerating } = useOfflineQuizGeneration();

  const generateQuiz = useCallback(
    async (
      content: string,
      contentType: "text" | "pdf" | "image",
      options: QuizOptions = {}
    ): Promise<QuizGenerationResponse> => {
      setIsGenerating(true);
      setError(null);

      try {
        // First try server-side generation (online)
        try {
          // Get the current session token
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (!session?.access_token) {
            throw new Error("User not authenticated");
          }

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

          const response = await fetch("/api/generate-quiz", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${session.access_token}`,
            },
            body: JSON.stringify(request),
          });

          const data = await response.json();
          setLastQuiz(data);

          if (!data.success) {
            setError(data.error || "Quiz generation failed");
          }

          return data;
        } catch (serverError) {
          console.log("Server-side generation failed, trying local Ollama:", serverError);
          
          // If server fails, try local Ollama generation
          const offlineResponse = await generateQuizOffline({
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
          });
          
          setLastQuiz(offlineResponse);
          if (!offlineResponse.success) {
            setError(offlineResponse.error || "Both online and offline generation failed");
          }
          return offlineResponse;
        }
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
    [generateQuizOffline]
  );

  return {
    generateQuiz,
    isGenerating: isGenerating || isOfflineGenerating,
    error,
    lastQuiz,
    availableProviders: ["openai", "ollama"],
  };
}