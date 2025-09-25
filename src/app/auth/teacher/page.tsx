"use client";

import * as React from "react";
import { createClient } from "@supabase/supabase-js";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

export default function TeacherSignIn() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [needsVerify, setNeedsVerify] = React.useState(false);
  const [info, setInfo] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setNeedsVerify(false);
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setLoading(false);
      setError(error.message);
      if (/confirm/i.test(error.message)) setNeedsVerify(true);
      return;
    }

    const userId = data.user?.id;
    const name = (data.user?.user_metadata as any)?.name as string | undefined;

    // Ensure profile exists
    let { data: prof } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (!prof) {
      const { data: inserted, error: upErr } = await supabase
        .from("profiles")
        .upsert({ id: userId, role: "teacher", name })
        .select("role")
        .single();
      if (upErr) {
        setLoading(false);
        setError(upErr.message);
        return;
      }
      prof = inserted;
    }

    setLoading(false);

    if (!prof || prof.role !== "teacher") {
      setError("This account is not a teacher.");
      return;
    }
    window.location.href = "/teacher";
  }

  async function resendVerification() {
    setInfo(null);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) setError(error.message);
    else setInfo("Verification email sent. Please check your inbox.");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b p-6">
      <div className="w-full max-w-md rounded-2xl border shadow-sm p-8">
        <form onSubmit={onSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-2xl font-bold">Teacher Sign In</h1>
            <p className="text-muted-foreground text-sm text-balance">
              Enter your credentials to access your teacher dashboard
            </p>
          </div>

          <div className="grid gap-6">
            <div className="grid gap-3">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="teacher@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-3">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <a
                  href="#"
                  className="ml-auto text-sm underline-offset-4 hover:underline"
                >
                  Forgot your password?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {info && <p className="text-sm text-green-600">{info}</p>}

            <Button type="submit" className="w-full">
              {loading ? "Please wait..." : "Continue"}
            </Button>

            {needsVerify && (
              <div className="mt-2 text-center">
                <button
                  type="button"
                  onClick={resendVerification}
                  className="text-xs underline underline-offset-4 hover:text-blue-600"
                >
                  Resend verification email
                </button>
              </div>
            )}
          </div>

          <div className="text-center text-sm text-gray-600 mt-2">
            Invites are required for student accounts.{" "}
            <Link href="/auth/student" className="underline underline-offset-4">
              Sign in as student
            </Link>
          </div>
          <div className="text-center text-sm">
            Don’t have a teacher account?{" "}
            <Link
              href="/auth/teacher/signup"
              className="underline underline-offset-4"
            >
              Create teacher account
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
