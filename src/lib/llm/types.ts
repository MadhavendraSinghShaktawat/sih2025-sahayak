// LLM Service Types and Interfaces

export interface LLMProvider {
  name: string;
  generateQuiz: (
    request: QuizGenerationRequest
  ) => Promise<QuizGenerationResponse>;
  isAvailable: () => boolean;
}

export interface QuizGenerationRequest {
  content: string;
  contentType: "text" | "pdf" | "image";
  options: QuizOptions;
}

export interface QuizOptions {
  subject?: string;
  class?: string;
  language?: string;
  difficulty?: "easy" | "medium" | "hard";
  type?: "mcq" | "t-f" | "fillups" | "mixup";
  questionCount?: number;
}

export interface QuizGenerationResponse {
  success: boolean;
  quiz?: Quiz;
  error?: string;
  provider: string;
  tokensUsed?: number;
  processingTime?: number;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  metadata: QuizMetadata;
}

export interface Question {
  id: string;
  type: "mcq" | "true-false" | "fill-in-blank" | "short-answer";
  question: string;
  options?: string[]; // For MCQ
  correctAnswer: string | number; // For MCQ: index, others: string
  explanation?: string;
  points?: number;
}

export interface QuizMetadata {
  subject: string;
  class: string;
  language: string;
  difficulty: string;
  estimatedTime: number; // in minutes
  createdAt: string;
  generatedBy: string;
}
