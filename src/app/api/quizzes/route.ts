import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get("id");
    // Get the authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Create Supabase client for server-side with user's token so RLS applies
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Set the session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get user profile to determine role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, teacher_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: "Invalid user role or no teacher assigned" },
        { status: 400 }
      );
    }

    if (quizId) {
      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", quizId)
        .single();

      if (error) {
        console.error("Error retrieving quiz:", error);
        return NextResponse.json(
          { error: `Database error: ${error.message}` },
          { status: 500 }
        );
      }

      if (!data) {
        return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
      }

      const quiz = {
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

      return NextResponse.json({ success: true, quiz });
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error retrieving quizzes:", error);
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    // Convert database format to Quiz format
    const quizzes = data.map((item) => ({
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

    return NextResponse.json({
      success: true,
      quizzes,
    });
  } catch (error) {
    console.error("Quiz retrieval error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get("id");

    if (!quizId) {
      return NextResponse.json(
        { error: "Quiz ID is required" },
        { status: 400 }
      );
    }

    // Get the authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Create Supabase client for server-side with user's token so RLS applies
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Set the session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Check if user is a teacher
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "teacher") {
      return NextResponse.json(
        { error: "Only teachers can delete quizzes" },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from("quizzes")
      .delete()
      .eq("id", quizId)
      .eq("teacher_id", user.id); // Ensure teacher can only delete their own quizzes

    if (error) {
      console.error("Error deleting quiz:", error);
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Quiz deleted successfully",
    });
  } catch (error) {
    console.error("Quiz deletion error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
