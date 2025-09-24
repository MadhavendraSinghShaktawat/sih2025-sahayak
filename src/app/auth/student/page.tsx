"use client"

import * as React from "react"
import { createClient } from "@supabase/supabase-js"
import MovingBorderButton from "@/components/blocks/moving-border-button"
import LanguageSwitcher from "@/components/ui/language-switcher"
import { useI18n } from "@/context/i18n-provider"
import Link from "next/link"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
)

export default function StudentSignIn() {
  const { t } = useI18n()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [mode, setMode] = React.useState<"signin" | "signup">("signin")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)
    if (mode === "signin") {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      setLoading(false)
      if (error) {
        setError(error.message)
        return
      }
      
      if (data.user) {
        // Check if profile exists
        const { data: prof, error: profErr } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle()
        
        if (profErr) {
          setError(profErr.message)
          return
        }
        
        if (!prof) {
          // Profile doesn't exist, check if email is whitelisted and create profile
          const emailLc = email.trim().toLowerCase()
          const { data: invited } = await supabase
            .from("invited_emails")
            .select("teacher_id")
            .eq("email", emailLc)
            .maybeSingle()
          
          if (!invited) {
            setError(t("auth.student.notInvited"))
            return
          }
          
          // Create profile
          const { error: insertErr } = await supabase
            .from("profiles")
            .insert({ 
              id: data.user.id, 
              role: "student", 
              name: emailLc.split("@")[0], 
              teacher_id: invited.teacher_id 
            })
          
          if (insertErr) {
            setError(insertErr.message)
            return
          }
        } else if (prof.role !== "student") {
          setError(t("auth.student.notStudent"))
          return
        }
        
        window.location.href = "/student"
      }
    } else {
      // signup flow with whitelist check
      const emailLc = email.trim().toLowerCase()
      console.log("Checking whitelist for email:", emailLc)
      const { data: invited, error: invitedErr } = await supabase
        .from("invited_emails")
        .select("teacher_id")
        .eq("email", emailLc)
        .maybeSingle()
      console.log("Whitelist check result:", { invited, invitedErr })
      if (invitedErr) {
        setLoading(false)
        setError(invitedErr.message)
        return
      }
      if (!invited) {
        setLoading(false)
        setError(t("auth.student.notInvited"))
        return
      }

      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: emailLc,
        password,
        options: { data: { role: "student", teacher_id: invited.teacher_id } },
      })
      if (signUpErr) {
        setLoading(false)
        setError(signUpErr.message)
        return
      }

      setLoading(false)
      setSuccess(t("auth.student.accountCreated"))
      setMode("signin")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-blue-50 p-6">
      <div className="w-full max-w-md rounded-2xl border bg-white shadow-sm p-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">{mode === "signin" ? t("auth.student.signinTitle") : t("auth.student.signupTitle")}</h1>
          <button
            className="text-sm underline"
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin")
              setError(null)
              setSuccess(null)
            }}
          >
            {mode === "signin" ? t("actions.createAccount") : t("actions.haveAccountSignIn")}
          </button>
        </div>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm">{t("auth.student.emailLabel")}</label>
            <input className="w-full border rounded-md px-3 py-2" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required/>
          </div>
          <div className="space-y-2">
            <label className="text-sm">{t("auth.student.passwordLabel")}</label>
            <input className="w-full border rounded-md px-3 py-2" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required/>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}
          <MovingBorderButton type="submit">{loading ? t("auth.common.pleaseWait") : t("actions.continue")}</MovingBorderButton>
        </form>
        <p className="text-xs text-gray-500 mt-4">{t("auth.student.helper")} <Link href="/auth/teacher" className="underline">{t("auth.student.teacherCta")}</Link></p>
        <div className="mt-6 flex justify-end">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  )
}
