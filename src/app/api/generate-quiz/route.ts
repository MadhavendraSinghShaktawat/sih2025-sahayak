import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { content, contentType, options } = await request.json()
    
    // Get API key from server environment (not exposed to client)
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      )
    }

    // Build the prompt
    const prompt = `
You are an expert quiz generator for educational content. Generate a quiz based on the following content:

CONTENT TYPE: ${contentType.toUpperCase()}
CONTENT:
${content}

QUIZ REQUIREMENTS:
- Subject: ${options.subject || 'General'}
- Class Level: ${options.class || 'Any'}
- Language: ${options.language || 'English'}
- Difficulty: ${options.difficulty || 'medium'}
- Question Type: ${options.type || 'mcq'}
- Number of Questions: ${options.questionCount || 5}

Please generate a quiz in the following JSON format:
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
      "explanation": "Why this answer is correct",
      "points": 1
    }
  ],
  "metadata": {
    "subject": "${options.subject || 'General'}",
    "class": "${options.class || 'Any'}",
    "language": "${options.language || 'English'}",
    "difficulty": "${options.difficulty || 'medium'}",
    "estimatedTime": 10,
    "createdAt": "${new Date().toISOString()}",
    "generatedBy": "gemini"
  }
}

IMPORTANT:
- Return ONLY valid JSON, no additional text
- Ensure all questions are relevant to the provided content
- Make questions clear and unambiguous
- Provide good explanations for answers
- Use appropriate difficulty level for the class
`

    // Call Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
          responseMimeType: "application/json"
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    // Parse the quiz response
    const cleanResponse = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const quizData = JSON.parse(cleanResponse)
    
    // Generate unique IDs
    const quizId = `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const quiz = {
      id: quizId,
      title: quizData.title || 'Generated Quiz',
      description: quizData.description || '',
      questions: quizData.questions?.map((q: any, index: number) => ({
        id: q.id || `q${index + 1}`,
        type: q.type || 'mcq',
        question: q.question || '',
        options: q.options || [],
        correctAnswer: q.correctAnswer ?? 0,
        explanation: q.explanation || '',
        points: q.points || 1
      })) || [],
      metadata: {
        subject: quizData.metadata?.subject || 'General',
        class: quizData.metadata?.class || 'Any',
        language: quizData.metadata?.language || 'English',
        difficulty: quizData.metadata?.difficulty || 'medium',
        estimatedTime: quizData.metadata?.estimatedTime || 10,
        createdAt: quizData.metadata?.createdAt || new Date().toISOString(),
        generatedBy: 'gemini'
      }
    }

    return NextResponse.json({
      success: true,
      quiz,
      provider: 'gemini',
      processingTime: Date.now() - Date.now() // We'll calculate this properly
    })

  } catch (error) {
    console.error('Quiz generation error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'gemini'
      },
      { status: 500 }
    )
  }
}
