"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { supabase, hasSupabaseEnv } from "@/lib/supabaseClient";
import { retry } from "@/lib/retry";
import { QuizTestComponent } from "@/components/QuizTestComponent";
import { QuizDisplay } from "@/components/QuizDisplay";
import { useQuizzes } from "@/hooks/useQuizzes";

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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Loading...</div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Teacher Dashboard
          </h1>
          {toast && (
            <div className="rounded-md bg-blue-50 text-blue-800 border border-blue-200 px-3 py-2 text-sm w-fit">
              {toast}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Room creation card */}
            <div className="rounded-xl border bg-white p-6">
              <h2 className="font-semibold mb-2">Create a Room</h2>
              <p className="text-sm text-gray-600 mb-4">
                Generate a room pass and share the QR with students.
              </p>
              <form onSubmit={onCreateRoom} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-sm">Your name (optional)</label>
                  <input
                    placeholder="e.g., Ms. Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border rounded-md px-3 py-2"
                  />
                </div>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center justify-center rounded-md bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create Room"}
                </button>
              </form>

              {roomId && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm">
                    Room ID: <span className="font-mono">{roomId}</span>
                  </p>
                  <p className="text-sm">
                    Passcode:{" "}
                    <span className="font-mono font-semibold">{passcode}</span>
                  </p>
                  {qr && (
                    <img
                      alt="Room QR"
                      src={qr}
                      className="w-40 h-40 border rounded"
                    />
                  )}
                  <div className="flex gap-2">
                    <button
                      className="rounded-md border px-3 py-1 text-sm"
                      onClick={() =>
                        router.push(
                          `/room/${roomId}?as=teacher&name=${encodeURIComponent(name || "Teacher")}`
                        )
                      }
                    >
                      Go to Room
                    </button>
                    <button
                      className="rounded-md border px-3 py-1 text-sm"
                      onClick={onEndSession}
                    >
                      End Session
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Invite students card */}
            <div className="rounded-xl border bg-white p-6">
              <h2 className="font-semibold mb-2">Invite Students</h2>
              <p className="text-sm text-gray-600 mb-4">
                Add student email to whitelist. Students can sign up using this
                email.
              </p>
              <form onSubmit={onInviteStudent} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-sm">Student email</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    placeholder="student@example.com"
                    className="w-full border rounded-md px-3 py-2"
                  />
                </div>
                <button
                  type="submit"
                  disabled={inviting}
                  className="inline-flex items-center justify-center rounded-md bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {inviting ? "Saving..." : "Add to Whitelist"}
                </button>
              </form>
            </div>

            {/* Placeholder */}
            <div className="rounded-xl border bg-white p-6 text-gray-500">
              Resources (coming soon)
            </div>
          </div>

          {/* Quiz Database Test Section */}
          <div className="mt-8">
            <QuizTestComponent />
          </div>

          {/* Quick preview of latest quiz */}
          {quizzes && quizzes.length > 0 && (
            <div className="mt-8 rounded-xl border bg-white p-6">
              <h2 className="font-semibold mb-2">Preview Latest Quiz</h2>
              <QuizDisplay quiz={quizzes[0]} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
