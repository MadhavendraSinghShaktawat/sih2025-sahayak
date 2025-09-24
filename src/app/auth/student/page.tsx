"use client";

import * as React from "react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/context/i18n-provider";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

export default function StudentSignIn() {
  const { t } = useI18n();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [mode, setMode] = React.useState<"signin" | "signup">("signin");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    if (mode === "signin") {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }

      if (data.user) {
        const { data: prof, error: profErr } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .maybeSingle();

        if (profErr) {
          setError(profErr.message);
          return;
        }

        if (!prof) {
          const emailLc = email.trim().toLowerCase();
          const { data: invited } = await supabase
            .from("invited_emails")
            .select("teacher_id")
            .eq("email", emailLc)
            .maybeSingle();

          if (!invited) {
            setError(t("auth.student.notInvited"));
            return;
          }

          const { error: insertErr } = await supabase.from("profiles").insert({
            id: data.user.id,
            role: "student",
            name: emailLc.split("@")[0],
            teacher_id: invited.teacher_id,
          });

          if (insertErr) {
            setError(insertErr.message);
            return;
          }
        } else if (prof.role !== "student") {
          setError(t("auth.student.notStudent"));
          return;
        }

        window.location.href = "/student";
      }
    } else {
      const emailLc = email.trim().toLowerCase();
      const { data: invited, error: invitedErr } = await supabase
        .from("invited_emails")
        .select("teacher_id")
        .eq("email", emailLc)
        .maybeSingle();

      if (invitedErr) {
        setLoading(false);
        setError(invitedErr.message);
        return;
      }
      if (!invited) {
        setLoading(false);
        setError(t("auth.student.notInvited"));
        return;
      }

      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp(
        {
          email: emailLc,
          password,
          options: {
            data: { role: "student", teacher_id: invited.teacher_id },
          },
        }
      );
      if (signUpErr) {
        setLoading(false);
        setError(signUpErr.message);
        return;
      }

      setLoading(false);
      setSuccess(t("auth.student.accountCreated"));
      setMode("signin");
    }
  }

  return (
    <div className="flex flex-col gap-6 items-center justify-center min-h-screen bg-gradient-to-b from-white to-blue-50 p-6">
      <Card className="overflow-hidden p-0 w-full max-w-2xl">
        <CardContent className="grid p-0 md:grid-cols-2">
          {/* Form */}
          <form onSubmit={onSubmit} className="p-6 md:p-8 flex flex-col gap-6">
            <div className="flex flex-col items-center text-center">
              <h1 className="text-2xl font-bold">
                {mode === "signin"
                  ? t("auth.student.signinTitle")
                  : t("auth.student.signupTitle")}
              </h1>
              <p className="text-muted-foreground text-balance">
                {t("auth.student.helper")}
              </p>
            </div>
            <div className="grid gap-3">
              <Label htmlFor="email">{t("auth.student.emailLabel")}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                placeholder="m@example.com"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-3">
              <div className="flex items-center">
                <Label htmlFor="password">
                  {t("auth.student.passwordLabel")}
                </Label>
                {mode === "signin" && (
                  <a
                    href="#"
                    className="ml-auto text-sm underline-offset-2 hover:underline"
                  >
                    {t("auth.common.forgotPassword")}
                  </a>
                )}
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && <p className="text-sm text-green-600">{success}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("auth.common.pleaseWait") : t("actions.continue")}
            </Button>

            <div className="text-center text-sm">
              {mode === "signin"
                ? t("auth.student.noAccount")
                : t("auth.student.haveAccount")}{" "}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "signin" ? "signup" : "signin");
                  setError(null);
                  setSuccess(null);
                }}
                className="underline underline-offset-4"
              >
                {mode === "signin"
                  ? t("actions.createAccount")
                  : t("actions.haveAccountSignIn")}
              </button>
            </div>
          </form>

          {/* Right Side Image */}
          <div className="bg-muted relative hidden md:block">
            <img
              src="/placeholder.svg"
              alt="Auth image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        {t("auth.common.agree")}{" "}
        <a href="#">{t("auth.common.termsOfService")}</a> {t("auth.common.and")}{" "}
        <a href="#">{t("auth.common.privacyPolicy")}</a>.
      </div>
    </div>
  );
}
