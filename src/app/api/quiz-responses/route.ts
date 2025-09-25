import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      quizId, 
      roomId, 
      answers, 
      score, 
      totalQuestions, 
      timeTaken,
      wrongAnswers 
    } = body;

    if (!quizId || !roomId || !answers || score === undefined || totalQuestions === undefined || timeTaken === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

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

    if (!profile || profile.role !== "student") {
      return NextResponse.json(
        { error: "Only students can submit quiz responses" },
        { status: 403 }
      );
    }

    // Insert quiz response
    const { data: response, error: insertError } = await supabase
      .from("quiz_responses")
      .insert({
        quiz_id: quizId,
        student_id: user.id,
        room_id: roomId,
        answers: answers,
        score: score,
        total_questions: totalQuestions,
        time_taken: timeTaken,
        wrong_answers: wrongAnswers || [],
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting quiz response:", insertError);
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      responseId: response.id 
    });

  } catch (error) {
    console.error("Quiz response error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get("quizId");
    const studentId = searchParams.get("studentId");
    const roomId = searchParams.get("roomId");

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

    // Verify user
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

    if (!profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    let query = supabase
      .from("quiz_responses")
      .select(`
        *,
        quiz:quizzes(title, subject, class_level, difficulty, teacher_id),
        student:profiles!quiz_responses_student_id_fkey(name),
        room:rooms(passcode, created_by)
      `)
      .order("completed_at", { ascending: false });

    // RLS policies will handle role-based filtering automatically
    // Only apply additional filters if needed

    if (quizId) {
      query = query.eq("quiz_id", quizId);
    }
    if (studentId) {
      query = query.eq("student_id", studentId);
    }
    if (roomId) {
      query = query.eq("room_id", roomId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching quiz responses:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      responses: data || []
    });

  } catch (error) {
    console.error("Quiz responses fetch error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
