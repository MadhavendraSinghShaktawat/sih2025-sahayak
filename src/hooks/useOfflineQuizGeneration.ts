"use client";

import { useEffect, useState } from "react";

interface QuizGenerationOptions {
  content: string;
  contentType: string;
  options: {
    subject?: string;
    class?: string;
    language?: string;
    difficulty?: string;
    type?: string;
    questionCount?: number;
  };
}

interface QuizGenerationResponse {
  success: boolean;
  quiz?: any;
  provider?: string;
  processingTime?: number;
  stored?: boolean;
  error?: string;
}

export function useOfflineQuizGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateQuizOffline = async (options: QuizGenerationOptions): Promise<QuizGenerationResponse> => {
    setIsGenerating(true);
    
    try {
      const ollamaUrl = process.env.NEXT_PUBLIC_OLLAMA_URL || "http://localhost:11434";
      const ollamaModel = process.env.NEXT_PUBLIC_OLLAMA_MODEL || "tinyllama";
      
      // Try to detect if we can reach Ollama by testing with a simple request
      let availableModel;
      try {
        const tagsResponse = await fetch(`${ollamaUrl}/api/tags`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!tagsResponse.ok) {
          throw new Error(`Ollama not responding: ${tagsResponse.status} ${tagsResponse.statusText}`);
        }

        const tagsData = await tagsResponse.json();
        availableModel = tagsData.models?.find((model: any) => 
          model.name === ollamaModel || 
          model.name === `${ollamaModel}:latest` ||
          model.name === `${ollamaModel}:7b` ||
          model.name === `${ollamaModel}:13b`
        );

        if (!availableModel) {
          throw new Error(`Model '${ollamaModel}' not found in Ollama`);
        }
      } catch (fetchError) {
        // If fetch fails (likely due to browser blocking localhost when offline), 
        // assume the model exists and try to generate directly
        console.log("Cannot reach Ollama API, assuming model exists:", fetchError);
        availableModel = { name: ollamaModel === "tinyllama" ? "tinyllama:latest" : ollamaModel };
      }

      // Build the prompt
      const prompt = `
You are an expert quiz generator for educational content. Generate a quiz based on the following content:

CONTENT TYPE: ${options.contentType.toUpperCase()}
CONTENT:
${options.content}

QUIZ REQUIREMENTS:
- Subject: ${options.options.subject || "General"}
- Class Level: ${options.options.class || "Any"}
- Language: ${options.options.language || "English"}
- Difficulty: ${options.options.difficulty || "medium"}
- Question Type: ${options.options.type || "mcq"}
- Number of Questions: ${options.options.questionCount || 5}

Please generate a quiz in the following JSON format with detailed explanations:
{
  "title": "Quiz Title",
  "description": "Brief description of the quiz",
  "questions": [
    {
      "id": "q1",
      "type": "mcq",
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanations": {
        "correct": "The correct answer is Option A because [simple, direct explanation]",
        "incorrect": [
          "Option B is incorrect because [simple explanation]",
          "Option C is incorrect because [simple explanation]", 
          "Option D is incorrect because [simple explanation]"
        ]
      },
      "feedback": {
        "correct": "✅ Correct! The answer is Option A because [brief reinforcement]",
        "incorrect": "❌ Incorrect. The correct answer is Option A because [simple explanation]"
      },
      "points": 1
    }
  ],
  "metadata": {
    "subject": "${options.options.subject || "General"}",
    "class": "${options.options.class || "Any"}",
    "language": "${options.options.language || "English"}",
    "difficulty": "${options.options.difficulty || "medium"}",
    "estimatedTime": 10,
    "createdAt": "${new Date().toISOString()}",
    "generatedBy": "ollama"
  }
}

IMPORTANT:
- Return ONLY valid JSON, no additional text or explanations
- Start your response with { and end with }
- Do not include any text before or after the JSON
- Ensure all questions are relevant to the provided content
- Make questions clear and unambiguous
- Provide SIMPLE and DIRECT explanations for all answer choices
- Include the correct answer in explanations (e.g., "The correct answer is X because...")
- Make explanations educational but concise
- Use appropriate difficulty level for the class
- For incorrect answers, explain why each option is wrong
- For correct answers, reinforce why the answer is right

EXAMPLE FORMAT:
{
  "title": "Quiz Title",
  "description": "Brief description",
  "questions": [
    {
      "id": "q1",
      "type": "mcq",
      "question": "Question text?",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "explanations": {
        "correct": "Explanation for correct answer",
        "incorrect": ["Wrong because...", "Wrong because...", "Wrong because..."]
      },
      "feedback": {
        "correct": "✅ Correct!",
        "incorrect": "❌ Incorrect."
      },
      "points": 1
    }
  ],
  "metadata": {
    "subject": "Subject",
    "class": "Class",
    "language": "English",
    "difficulty": "medium",
    "estimatedTime": 10,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "generatedBy": "ai"
  }
}
`;

      // Generate content with Ollama
      const startTime = Date.now();
      let response;
      let data;
      
      try {
        response = await fetch(`${ollamaUrl}/api/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: availableModel.name,
            prompt: prompt,
            stream: false,
            options: {
              temperature: 0.7,
              top_k: 40,
              top_p: 0.95,
            },
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Ollama API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        data = await response.json();
      } catch (generationError) {
        // If generation fails due to browser blocking, create a fallback quiz
        console.log("Ollama generation failed, creating fallback quiz:", generationError);
        throw new Error("Failed to fetch");
      }
      const responseText = data.response || "";
      const processingTime = Date.now() - startTime;

      // Parse the quiz response
      let parsedQuizData;
      try {
        const cleanResponse = responseText
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();
        
        // Try to extract JSON from the response if it's not pure JSON
        let jsonString = cleanResponse;
        
        // Look for JSON object in the response
        const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonString = jsonMatch[0];
        }
        
        parsedQuizData = JSON.parse(jsonString);
      } catch (parseError) {
        console.error("JSON parsing failed:", parseError);
        console.error("Raw response:", responseText);
        
        // If JSON parsing fails, create a fallback quiz
        parsedQuizData = {
          title: "Generated Quiz",
          description: "Quiz generated by AI",
          questions: [
            {
              id: "q1",
              type: "mcq",
              question: "What is the main topic of this content?",
              options: ["Option A", "Option B", "Option C", "Option D"],
              correctAnswer: 0,
              explanations: {
                correct: "This is the correct answer based on the content.",
                incorrect: [
                  "This option is incorrect.",
                  "This option is also incorrect.",
                  "This option is not correct."
                ]
              },
              feedback: {
                correct: "✅ Correct!",
                incorrect: "❌ Incorrect. Please try again."
              },
              points: 1
            }
          ],
          metadata: {
            subject: options.options.subject || "General",
            class: options.options.class || "Any",
            language: options.options.language || "English",
            difficulty: options.options.difficulty || "medium",
            estimatedTime: 5,
            createdAt: new Date().toISOString(),
            generatedBy: "ollama",
          }
        };
      }

      // Generate unique IDs
      const quizId = `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const quiz = {
        id: quizId,
        title: parsedQuizData.title || "Generated Quiz",
        description: parsedQuizData.description || "",
        questions:
          parsedQuizData.questions?.map((q: any, index: number) => ({
            id: q.id || `q${index + 1}`,
            type: q.type || "mcq",
            question: q.question || "",
            options: q.options || [],
            correctAnswer: q.correctAnswer ?? 0,
            explanation: q.explanation || "", // Keep for backward compatibility
            explanations: q.explanations || {
              correct: q.explanation || "No explanation provided",
              incorrect: []
            },
            feedback: q.feedback || {
              correct: "✅ Correct!",
              incorrect: "❌ Incorrect."
            },
            points: q.points || 1,
          })) || [],
        metadata: {
          subject: parsedQuizData.metadata?.subject || "General",
          class: parsedQuizData.metadata?.class || "Any",
          language: parsedQuizData.metadata?.language || "English",
          difficulty: parsedQuizData.metadata?.difficulty || "medium",
          estimatedTime: parsedQuizData.metadata?.estimatedTime || 10,
          createdAt:
            parsedQuizData.metadata?.createdAt || new Date().toISOString(),
          generatedBy: "ollama",
        },
        // Add the fields that ChatRoom expects for posting to chat
        quizId: quizId,
        subject: parsedQuizData.metadata?.subject || "General",
      };

      return {
        success: true,
        quiz: quiz,
        provider: "ollama",
        processingTime: processingTime,
        stored: false, // Not stored in database when generated offline
      };

    } catch (error) {
      console.error("Offline quiz generation error:", error);
      
      // If Ollama is not available, create a simple fallback quiz
      if (error instanceof Error && error.message.includes("Failed to fetch")) {
        console.log("Ollama not accessible, creating fallback quiz");
        
        const fallbackQuiz = {
          id: `fallback_quiz_${Date.now()}`,
          title: "Offline Quiz",
          description: "A simple quiz generated offline",
          questions: [
            {
              id: "q1",
              type: "mcq",
              question: `What is the main topic of "${options.content}"?`,
              options: ["Topic A", "Topic B", "Topic C", "Topic D"],
              correctAnswer: 0,
              explanation: "This is a fallback question when offline.",
              explanations: {
                correct: "This is the correct answer based on the content.",
                incorrect: [
                  "This option is incorrect.",
                  "This option is also incorrect.",
                  "This option is not correct."
                ]
              },
              feedback: {
                correct: "✅ Correct!",
                incorrect: "❌ Incorrect. Please try again."
              },
              points: 1,
            }
          ],
          metadata: {
            subject: options.options.subject || "General",
            class: options.options.class || "Any",
            language: options.options.language || "English",
            difficulty: options.options.difficulty || "medium",
            estimatedTime: 5,
            createdAt: new Date().toISOString(),
            generatedBy: "fallback",
          },
          // Add the fields that ChatRoom expects for posting to chat
          quizId: `fallback_quiz_${Date.now()}`,
          subject: options.options.subject || "General",
        };

        return {
          success: true,
          quiz: fallbackQuiz,
          provider: "fallback",
          processingTime: 0,
          stored: false,
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        provider: "ollama",
      };
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateQuizOffline,
    isGenerating,
  };
}
