import {
  LLMProvider,
  QuizGenerationRequest,
  QuizGenerationResponse,
} from "../types";
import { supabase } from "../../supabaseClient";

/**
 * Calls the server `/api/generate-quiz` route (OpenAI, Gemini, or Ollama on the server).
 */
export class QuizApiProvider implements LLMProvider {
  name = "openai";

  isAvailable(): boolean {
    return true;
  }

  async generateQuiz(
    request: QuizGenerationRequest
  ): Promise<QuizGenerationResponse> {
    const startTime = Date.now();
    try {
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
      const data = (await response.json()) as QuizGenerationResponse & {
        provider?: string;
      };
      return {
        success: Boolean(data.success),
        quiz: data.quiz,
        error: data.error,
        provider:
          typeof data.provider === "string" ? data.provider : this.name,
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
