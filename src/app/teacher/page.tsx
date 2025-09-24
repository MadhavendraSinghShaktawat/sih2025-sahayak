"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { supabase, hasSupabaseEnv } from "@/lib/supabaseClient";
import { retry } from "@/lib/retry";
import { QuizTestComponent } from "@/components/QuizTestComponent";
import { QuizDisplay } from "@/components/QuizDisplay";
import { useQuizzes } from "@/hooks/useQuizzes";
import RoleLayout from "@/components/blocks/RoleLayout";
import TeacherDashboard from "@/components/dashboard/TeacherDashboard";

export default function TeacherPage() {
  const router = useRouter();
  const { quizzes } = useQuizzes();
  const [name, setName] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const [roomId, setRoomId] = React.useState<string | null>(null);
  const [passcode, setPasscode] = React.useState<string | null>(null);
  const [qr, setQr] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [user, setUser] = React.useState<any>(null);

  // invite
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteLink, setInviteLink] = React.useState<string | null>(null);
  const [inviting, setInviting] = React.useState(false);

  // Check authentication on mount
  React.useEffect(() => {
    async function checkAuth() {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (error || !user) {
          router.push("/auth/teacher");
          return;
        }

        // Check if user is a teacher
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, name")
          .eq("id", user.id)
          .single();

        if (!profile || profile.role !== "teacher") {
          router.push("/auth/teacher");
          return;
        }

        setUser(user);
        if (profile.name) setName(profile.name);
      } catch (err) {
        console.error("Auth check failed:", err);
        router.push("/auth/teacher");
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [router]);

  async function onCreateRoom(e: React.FormEvent) {
    e.preventDefault();
    if (!hasSupabaseEnv) {
      setToast("Configuration error. Check Supabase env.");
      return;
    }
    setCreating(true);
    try {
      const result = await retry(async () => {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const { data, error } = await supabase
          .from("rooms")
          .insert({ passcode: code, created_by: name })
          .select("id, passcode")
          .single();
        if (error) throw error;
        return data;
      });

      const id = result.id as string;
      setRoomId(id);
      setPasscode(result.passcode as string);
      const envBase = (
        process.env.NEXT_PUBLIC_SITE_URL as string | undefined
      )?.replace(/\/$/, "");
      const origin =
        envBase ||
        (typeof window !== "undefined" ? window.location.origin : "");
      const joinUrl = `${origin}/room/${id}`;
      const { toDataURL } = await import("qrcode");
      const url = await toDataURL(joinUrl);
      setQr(url);
      setToast("Room created");
      console.log("room_created", { id });
    } catch (err) {
      console.error("room_create_failed", err);
      setToast("Failed to create room. Please try again.");
    } finally {
      setCreating(false);
      setTimeout(() => setToast(null), 2500);
    }
  }

  async function onEndSession() {
    if (!roomId) return;
    const ok = window.confirm("End session and delete this room?");
    if (!ok) return;
    try {
      await retry(async () => {
        const { error } = await supabase
          .from("rooms")
          .delete()
          .eq("id", roomId);
        if (error) throw error;
      });
      setRoomId(null);
      setPasscode(null);
      setQr(null);
      setToast("Session ended");
      console.log("room_deleted", { id: roomId });
    } catch (e) {
      console.error("room_delete_failed", e);
      setToast("Failed to end session. Try again.");
    } finally {
      setTimeout(() => setToast(null), 2500);
    }
  }

  async function onInviteStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      setToast("Please sign in first");
      return;
    }
    setInviting(true);
    try {
      // Whitelist the email for signup via invited_emails
      const { error } = await supabase
        .from("invited_emails")
        .upsert(
          { email: inviteEmail.trim().toLowerCase(), teacher_id: user.id },
          { onConflict: "email" }
        );

      if (error) throw error;
      setToast("Student email whitelisted");
      setInviteEmail(""); // Clear the input
    } catch (err: any) {
      console.error("invite_failed", err);
      setToast(err?.message ?? "Failed to invite student");
    } finally {
      setInviting(false);
      setTimeout(() => setToast(null), 3000);
    }
  }

  const handleSidebarAction = (action: string, data?: any) => {
    switch (action) {
      case 'createRoom':
        onCreateRoom({ preventDefault: () => {} } as React.FormEvent);
        break;
      case 'inviteStudents':
        onInviteStudent({ preventDefault: () => {} } as React.FormEvent);
        break;
      case 'generateQuiz':
        // Handle quiz generation
        console.log('Generate quiz action');
        break;
      default:
        console.log('Sidebar action:', action, data);
    }
  };

  return (
    <RoleLayout role="teacher" onAction={handleSidebarAction}>
      {loading ? (
        <div className="flex items-center justify-center min-h-screen w-full">
          <div className="text-lg">Loading...</div>
        </div>
      ) : (
        <>
          {toast && (
            <div className="fixed top-4 right-4 z-50 rounded-md bg-blue-50 text-blue-800 border border-blue-200 px-3 py-2 text-sm">
              {toast}
            </div>
          )}
          <TeacherDashboard 
            teacherId={user?.id}
            teacherName={name || undefined}
            onCreateRoom={() => onCreateRoom({ preventDefault: () => {} } as React.FormEvent)}
            onInviteStudent={(email) => {
              // set email state and reuse handler
              // lightweight path without exposing internal state elsewhere
              const evt = { preventDefault: () => {} } as React.FormEvent;
              // temporary set, then call
              // keep prior value to restore if needed
              const prev = inviteEmail;
              setInviteEmail(email);
              onInviteStudent(evt).finally(() => setInviteEmail(prev));
            }}
            onGenerateQuiz={() => {
              // surface sidebar action hook
              console.log('Generate quiz from dashboard');
              // Here you could open your existing QuizGenerationModal via sidebar action
            }}
            currentRoom={roomId ? { id: roomId, passcode, qr } : null}
            onEndSession={onEndSession}
            onGoToRoom={() => {
              if (!roomId) return;
              const displayName = name || 'Teacher';
              router.push(`/room/${roomId}?as=teacher&name=${encodeURIComponent(displayName)}`);
            }}
          />
        </>
      )}
    </RoleLayout>
  );
}
