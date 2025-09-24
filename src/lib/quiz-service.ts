import { supabase } from "./supabaseClient";
import { Quiz, Question, QuizMetadata } from "./llm/types";

export interface QuizStorageRequest {
  title: string;
  description?: string;
  subject?: string;
  classLevel?: string;
  language?: string;
  difficulty?: "easy" | "medium" | "hard";
  type?: "mcq" | "t-f" | "fillups" | "mixup";
  questions: Question[];
  metadata?: QuizMetadata;
}

export interface QuizStorageResponse {
  success: boolean;
  quiz?: Quiz;
  error?: string;
}

export interface QuizRetrievalResponse {
  success: boolean;
  quizzes?: Quiz[];
  error?: string;
}

export class QuizService {
  /**
   * Store a quiz in the database
   */
  static async storeQuiz(
    request: QuizStorageRequest
  ): Promise<QuizStorageResponse> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return {
          success: false,
          error: "User not authenticated",
        };
      }

      // Check if user is a teacher
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profile || profile.role !== "teacher") {
        return {
          success: false,
          error: "Only teachers can create quizzes",
        };
      }

      const quizData = {
        teacher_id: user.id,
        title: request.title,
        description: request.description || "",
        subject: request.subject || "General",
        class_level: request.classLevel || "Any",
        language: request.language || "English",
        difficulty: request.difficulty || "medium",
        type: request.type || "mcq",
        questions: request.questions,
        metadata: request.metadata || {},
      };

      const { data, error } = await supabase
        .from("quizzes")
        .insert(quizData)
        .select()
        .single();

      if (error) {
        console.error("Error storing quiz:", error);
        return {
          success: false,
          error: `Database error: ${error.message}`,
        };
      }

      // Convert database format to Quiz format
      const quiz: Quiz = {
        id: data.id,
        title: data.title,
        description: data.description,
        questions: data.questions,
        metadata: {
          subject: data.subject,
          class: data.class_level,
          language: data.language,
          difficulty: data.difficulty,
          estimatedTime: data.metadata?.estimatedTime || 10,
          createdAt: data.created_at,
          generatedBy: data.metadata?.generatedBy || "unknown",
        },
      };

      return {
        success: true,
        quiz,
      };
    } catch (error) {
      console.error("Quiz storage error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Retrieve quizzes for the current user
   */
  static async getQuizzes(): Promise<QuizRetrievalResponse> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return {
          success: false,
          error: "User not authenticated",
        };
      }

      // Get user profile to determine role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, teacher_id")
        .eq("id", user.id)
        .single();

      if (!profile) {
        return {
          success: false,
          error: "User profile not found",
        };
      }

      let query = supabase
        .from("quizzes")
        .select("*")
        .order("created_at", { ascending: false });

      // Teachers see their own quizzes, students see their teacher's quizzes
      if (profile.role === "teacher") {
        query = query.eq("teacher_id", user.id);
      } else if (profile.role === "student" && profile.teacher_id) {
        query = query.eq("teacher_id", profile.teacher_id);
      } else {
        return {
          success: false,
          error: "Invalid user role or no teacher assigned",
        };
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error retrieving quizzes:", error);
        return {
          success: false,
          error: `Database error: ${error.message}`,
        };
      }

      // Convert database format to Quiz format
      const quizzes: Quiz[] = data.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        questions: item.questions,
        metadata: {
          subject: item.subject,
          class: item.class_level,
          language: item.language,
          difficulty: item.difficulty,
          estimatedTime: item.metadata?.estimatedTime || 10,
          createdAt: item.created_at,
          generatedBy: item.metadata?.generatedBy || "unknown",
        },
      }));

      return {
        success: true,
        quizzes,
      };
    } catch (error) {
      console.error("Quiz retrieval error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get a specific quiz by ID
   */
  static async getQuizById(quizId: string): Promise<QuizStorageResponse> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return {
          success: false,
          error: "User not authenticated",
        };
      }

      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", quizId)
        .single();

      if (error) {
        console.error("Error retrieving quiz:", error);
        return {
          success: false,
          error: `Database error: ${error.message}`,
        };
      }

      if (!data) {
        return {
          success: false,
          error: "Quiz not found",
        };
      }

      // Convert database format to Quiz format
      const quiz: Quiz = {
        id: data.id,
        title: data.title,
        description: data.description,
        questions: data.questions,
        metadata: {
          subject: data.subject,
          class: data.class_level,
          language: data.language,
          difficulty: data.difficulty,
          estimatedTime: data.metadata?.estimatedTime || 10,
          createdAt: data.created_at,
          generatedBy: data.metadata?.generatedBy || "unknown",
        },
      };

      return {
        success: true,
        quiz,
      };
    } catch (error) {
      console.error("Quiz retrieval error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Delete a quiz
   */
  static async deleteQuiz(
    quizId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return {
          success: false,
          error: "User not authenticated",
        };
      }

      // Check if user is a teacher
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profile || profile.role !== "teacher") {
        return {
          success: false,
          error: "Only teachers can delete quizzes",
        };
      }

      const { error } = await supabase
        .from("quizzes")
        .delete()
        .eq("id", quizId)
        .eq("teacher_id", user.id); // Ensure teacher can only delete their own quizzes

      if (error) {
        console.error("Error deleting quiz:", error);
        return {
          success: false,
          error: `Database error: ${error.message}`,
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error("Quiz deletion error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
