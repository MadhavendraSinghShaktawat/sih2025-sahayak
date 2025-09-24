import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

    // Get API key from server environment (not exposed to client)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

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
    "generatedBy": "gemini"
  }
}

IMPORTANT:
- Return ONLY valid JSON, no additional text
- Ensure all questions are relevant to the provided content
- Make questions clear and unambiguous
- Provide SIMPLE and DIRECT explanations for all answer choices
- Include the correct answer in explanations (e.g., "The correct answer is X because...")
- Make explanations educational but concise
- Use appropriate difficulty level for the class
- For incorrect answers, explain why each option is wrong
- For correct answers, reinforce why the answer is right
`;

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Gemini API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Parse the quiz response
    const cleanResponse = responseText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const parsedQuizData = JSON.parse(cleanResponse);

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
        generatedBy: "gemini",
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
            generatedBy: storedQuiz.metadata?.generatedBy || "gemini",
          },
        }
      : quiz;

    return NextResponse.json({
      success: true,
      quiz: finalQuiz,
      provider: "gemini",
      processingTime: 0,
      stored: !storageError,
    });
  } catch (error) {
    console.error("Quiz generation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        provider: "gemini",
      },
      { status: 500 }
    );
  }
}
