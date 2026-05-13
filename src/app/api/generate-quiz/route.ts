import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createLLMService } from "@/lib/llm/LLMService";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: NextRequest) {
  try {
    // Auth: require bearer token and create RLS-aware client
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }
    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: authError } =
      await supabase.auth.getUser(token);
    const user = userData?.user;
    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    // Only teachers can create quizzes
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (!profile || profile.role !== "teacher") {
      return NextResponse.json(
        { error: "Only teachers can create quizzes" },
        { status: 403 }
      );
    }

    const { content, contentType, options } = await request.json();

    const llmService = createLLMService();

    // Build the prompt
    const prompt = `
You are an expert quiz generator for educational content. Generate a quiz based on the following content:

CONTENT TYPE: ${contentType.toUpperCase()}
CONTENT:
${content}

QUIZ REQUIREMENTS:
- Subject: ${options.subject || "General"}
- Class Level: ${options.class || "Any"}
- Language: ${options.language || "English"}
- Difficulty: ${options.difficulty || "medium"}
- Question Type: ${options.type || "mcq"}
- Number of Questions: ${options.questionCount || 5}

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
    "subject": "${options.subject || "General"}",
    "class": "${options.class || "Any"}",
    "language": "${options.language || "English"}",
    "difficulty": "${options.difficulty || "medium"}",
    "estimatedTime": 10,
    "createdAt": "${new Date().toISOString()}",
    "generatedBy": "openai"
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

    // Call LLM service (OpenAI preferred, then Gemini if configured, then Ollama)
    const startTime = Date.now();
    const { content: responseText, provider } = await llmService.generateContent(prompt);
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
          subject: options.subject || "General",
          class: options.class || "Any",
          language: options.language || "English",
          difficulty: options.difficulty || "medium",
          estimatedTime: 5,
          createdAt: new Date().toISOString(),
          generatedBy: provider,
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
        generatedBy: provider,
      },
    };

    // Persist quiz
    const toStore = {
      teacher_id: user.id,
      title: quiz.title,
      description: quiz.description,
      subject: quiz.metadata.subject,
      class_level: quiz.metadata.class,
      language: quiz.metadata.language,
      difficulty: quiz.metadata.difficulty,
      type: "mcq",
      questions: quiz.questions,
      metadata: quiz.metadata,
    };
    const { data: storedQuiz, error: storageError } = await supabase
      .from("quizzes")
      .insert(toStore)
      .select()
      .single();

    const finalQuiz = storedQuiz
      ? {
          id: storedQuiz.id,
          title: storedQuiz.title,
          description: storedQuiz.description,
          questions: storedQuiz.questions,
          metadata: {
            subject: storedQuiz.subject,
            class: storedQuiz.class_level,
            language: storedQuiz.language,
            difficulty: storedQuiz.difficulty,
            estimatedTime: storedQuiz.metadata?.estimatedTime || 10,
            createdAt: storedQuiz.created_at,
            generatedBy: storedQuiz.metadata?.generatedBy || provider,
          },
        }
      : quiz;

    return NextResponse.json({
      success: true,
      quiz: finalQuiz,
      provider: provider,
      processingTime: processingTime,
      stored: !storageError,
    });
  } catch (error) {
    console.error("Quiz generation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        provider: "unknown",
      },
      { status: 500 }
    );
  }
}
