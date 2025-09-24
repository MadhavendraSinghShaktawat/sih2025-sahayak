import {
  LLMProvider,
  QuizGenerationRequest,
  QuizGenerationResponse,
  Quiz,
  Question,
  QuizMetadata,
} from "../types";
import { supabase } from "../../supabaseClient";

export class GeminiProvider implements LLMProvider {
  name = "gemini";

  constructor() {
    // No need for API key on client side - handled by server
  }

  isAvailable(): boolean {
    // Always available since we use server-side API route
    return true;
  }

  async generateQuiz(
    request: QuizGenerationRequest
  ): Promise<QuizGenerationResponse> {
    const startTime = Date.now();

    try {
      // Get the current session token
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("User not authenticated");
      }

      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: data.success,
        quiz: data.quiz,
        error: data.error,
        provider: this.name,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        provider: this.name,
        processingTime: Date.now() - startTime,
      };
    }
  }
}
