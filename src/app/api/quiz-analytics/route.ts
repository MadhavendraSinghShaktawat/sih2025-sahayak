import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get("quizId");
    const roomId = searchParams.get("roomId");
    const timeRange = searchParams.get("timeRange") || "7d"; // 7d, 30d, 90d, all

    // Auth header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }
    const token = authHeader.replace("Bearer ", "");

    // Supabase client as user
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    // Verify user and role
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "teacher") {
      return NextResponse.json(
        { error: "Only teachers can access analytics" },
        { status: 403 }
      );
    }

    // Calculate date filter based on timeRange
    let dateFilter = "";
    const now = new Date();
    switch (timeRange) {
      case "7d":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = `completed_at >= '${weekAgo.toISOString()}'`;
        break;
      case "30d":
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFilter = `completed_at >= '${monthAgo.toISOString()}'`;
        break;
      case "90d":
        const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        dateFilter = `completed_at >= '${quarterAgo.toISOString()}'`;
        break;
      default:
        dateFilter = "1=1"; // All time
    }

    // Fetch quiz responses with related data
    let query = supabase
      .from("quiz_responses")
      .select(`
        *,
        quiz:quizzes!inner(title, subject, class_level, difficulty, teacher_id),
        student:profiles!quiz_responses_student_id_fkey(name),
        room:rooms(passcode, created_by)
      `)
      .eq("quiz.teacher_id", user.id)
      .order("completed_at", { ascending: false });

    if (quizId) {
      query = query.eq("quiz_id", quizId);
    }
    if (roomId) {
      query = query.eq("room_id", roomId);
    }

    // Apply time filter
    if (timeRange !== "all") {
      const now = new Date();
      let filterDate: Date;
      
      switch (timeRange) {
        case "7d":
          filterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30d":
          filterDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "90d":
          filterDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          filterDate = new Date(0); // All time
      }
      
      query = query.gte("completed_at", filterDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching analytics:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Calculate analytics from the data
    const analytics = calculateAnalytics(data || []);
    return NextResponse.json({
      success: true,
      analytics,
      responses: data || []
    });

  } catch (error) {
    console.error("Quiz analytics error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

function calculateAnalytics(responses: any[]) {
  if (responses.length === 0) {
    return {
      totalResponses: 0,
      averageScore: 0,
      averageTime: 0,
      completionRate: 0,
      quizStats: [],
      studentStats: [],
      recentActivity: []
    };
  }

  // Basic stats
  const totalResponses = responses.length;
  const totalScore = responses.reduce((sum, r) => sum + (r.score || 0), 0);
  const totalQuestions = responses.reduce((sum, r) => sum + (r.total_questions || 0), 0);
  const totalTime = responses.reduce((sum, r) => sum + (r.time_taken || 0), 0);

  const averageScore = totalQuestions > 0 ? (totalScore / totalQuestions) * 100 : 0;
  const averageTime = totalResponses > 0 ? totalTime / totalResponses : 0;

  // Quiz-wise stats
  const quizStatsMap = new Map();
  responses.forEach(response => {
    const quizId = response.quiz_id;
    const quizTitle = response.quiz_title || response.quiz?.title || "Unknown Quiz";
    
    if (!quizStatsMap.has(quizId)) {
      quizStatsMap.set(quizId, {
        quizId,
        quizTitle,
        totalResponses: 0,
        totalScore: 0,
        totalQuestions: 0,
        totalTime: 0,
        students: new Set()
      });
    }
    
    const stats = quizStatsMap.get(quizId);
    stats.totalResponses++;
    stats.totalScore += response.score || 0;
    stats.totalQuestions += response.total_questions || 0;
    stats.totalTime += response.time_taken || 0;
    stats.students.add(response.student_id);
  });

  const quizStats = Array.from(quizStatsMap.values()).map(stats => ({
    ...stats,
    averageScore: stats.totalQuestions > 0 ? (stats.totalScore / stats.totalQuestions) * 100 : 0,
    averageTime: stats.totalResponses > 0 ? stats.totalTime / stats.totalResponses : 0,
    uniqueStudents: stats.students.size,
    students: undefined // Remove Set from response
  }));

  // Student-wise stats
  const studentStatsMap = new Map();
  responses.forEach(response => {
    const studentId = response.student_id;
    const studentName = response.student_name || response.student?.name || "Unknown Student";
    
    if (!studentStatsMap.has(studentId)) {
      studentStatsMap.set(studentId, {
        studentId,
        studentName,
        totalQuizzes: 0,
        totalScore: 0,
        totalQuestions: 0,
        totalTime: 0
      });
    }
    
    const stats = studentStatsMap.get(studentId);
    stats.totalQuizzes++;
    stats.totalScore += response.score || 0;
    stats.totalQuestions += response.total_questions || 0;
    stats.totalTime += response.time_taken || 0;
  });

  const studentStats = Array.from(studentStatsMap.values()).map(stats => ({
    ...stats,
    averageScore: stats.totalQuestions > 0 ? (stats.totalScore / stats.totalQuestions) * 100 : 0,
    averageTime: stats.totalQuizzes > 0 ? stats.totalTime / stats.totalQuizzes : 0
  }));

  // Recent activity (last 10 responses)
  const recentActivity = responses
    .slice(0, 10)
    .map(response => ({
      id: response.id,
      studentName: response.student_name || response.student?.name || "Unknown Student",
      quizTitle: response.quiz_title || response.quiz?.title || "Unknown Quiz",
      score: response.score,
      totalQuestions: response.total_questions,
      timeTaken: response.time_taken,
      completedAt: response.completed_at,
      roomName: response.room?.passcode ? `Room ${response.room.passcode}` : "Unknown Room"
    }));

  // Wrong answer analytics
  const wrongAnswerStats = calculateWrongAnswerStats(responses);

  return {
    totalResponses,
    averageScore: Math.round(averageScore * 100) / 100,
    averageTime: Math.round(averageTime),
    completionRate: 100, // All responses are completed
    quizStats: quizStats.sort((a, b) => b.totalResponses - a.totalResponses),
    studentStats: studentStats.sort((a, b) => b.averageScore - a.averageScore),
    recentActivity,
    wrongAnswerStats
  };
}

function calculateWrongAnswerStats(responses: any[]) {
  const wrongAnswerMap = new Map();
  const studentWrongAnswers = new Map();
  const quizWrongAnswers = new Map();
  
  let totalWrongAnswers = 0;
  
  responses.forEach(response => {
    // Handle both wrong_answers and wrongAnswers (for backward compatibility)
    const wrongAnswers = response.wrong_answers || response.wrongAnswers || [];
    totalWrongAnswers += wrongAnswers.length;
    
    // Track wrong answers by question
    wrongAnswers.forEach((wrongAnswer: any) => {
      const key = `${response.quiz_id}-${wrongAnswer.questionId}`;
      if (!wrongAnswerMap.has(key)) {
        wrongAnswerMap.set(key, {
          questionId: wrongAnswer.questionId,
          questionText: wrongAnswer.questionText,
          quizId: response.quiz_id,
          quizTitle: response.quiz?.title || "Unknown Quiz",
          totalWrong: 0,
          wrongAnswers: []
        });
      }
      
      const questionStats = wrongAnswerMap.get(key);
      questionStats.totalWrong++;
      questionStats.wrongAnswers.push({
        studentAnswer: wrongAnswer.studentAnswer,
        correctAnswer: wrongAnswer.correctAnswer,
        studentName: response.student?.name || "Unknown Student",
        timestamp: wrongAnswer.timestamp
      });
    });
    
    // Track wrong answers by student
    const studentId = response.student_id;
    const studentName = response.student?.name || "Unknown Student";
    if (!studentWrongAnswers.has(studentId)) {
      studentWrongAnswers.set(studentId, {
        studentId,
        studentName,
        totalWrongAnswers: 0,
        wrongAnswers: []
      });
    }
    
    const studentStats = studentWrongAnswers.get(studentId);
    studentStats.totalWrongAnswers += wrongAnswers.length;
    studentStats.wrongAnswers.push(...wrongAnswers.map((wa: any) => ({
      ...wa,
      quizTitle: response.quiz?.title || "Unknown Quiz"
    })));
    
    // Track wrong answers by quiz
    const quizId = response.quiz_id;
    const quizTitle = response.quiz?.title || "Unknown Quiz";
    if (!quizWrongAnswers.has(quizId)) {
      quizWrongAnswers.set(quizId, {
        quizId,
        quizTitle,
        totalWrongAnswers: 0,
        wrongAnswers: []
      });
    }
    
    const quizStats = quizWrongAnswers.get(quizId);
    quizStats.totalWrongAnswers += wrongAnswers.length;
    quizStats.wrongAnswers.push(...wrongAnswers.map((wa: any) => ({
      ...wa,
      studentName: response.student?.name || "Unknown Student"
    })));
  });
  
  return {
    totalWrongAnswers,
    mostCommonWrongAnswers: Array.from(wrongAnswerMap.values())
      .sort((a, b) => b.totalWrong - a.totalWrong)
      .slice(0, 10),
    studentWrongAnswers: Array.from(studentWrongAnswers.values())
      .sort((a, b) => b.totalWrongAnswers - a.totalWrongAnswers),
    quizWrongAnswers: Array.from(quizWrongAnswers.values())
      .sort((a, b) => b.totalWrongAnswers - a.totalWrongAnswers)
  };
}
