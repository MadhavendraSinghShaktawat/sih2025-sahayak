"use client"

import * as React from "react"
import { createClient } from "@supabase/supabase-js"
import MovingBorderButton from "@/components/blocks/moving-border-button"
import Link from "next/link"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
)

export default function TeacherSignIn() {
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [needsVerify, setNeedsVerify] = React.useState(false)
  const [info, setInfo] = React.useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setNeedsVerify(false)
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setLoading(false)
      setError(error.message)
      if (/confirm/i.test(error.message)) setNeedsVerify(true)
      return
    }

    const userId = data.user?.id
    const name = (data.user?.user_metadata as any)?.name as string | undefined

    // Ensure profile exists
    let { data: prof } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle()

    if (!prof) {
      const { data: inserted, error: upErr } = await supabase
        .from("profiles")
        .upsert({ id: userId, role: "teacher", name })
        .select("role")
        .single()
      if (upErr) {
        setLoading(false)
        setError(upErr.message)
        return
      }
      prof = inserted
    }

    setLoading(false)

    if (!prof || prof.role !== "teacher") {
      setError("This account is not a teacher.")
      return
    }
    window.location.href = "/teacher"
  }

  async function resendVerification() {
    setInfo(null)
    const { error } = await supabase.auth.resend({ type: "signup", email })
    if (error) setError(error.message)
    else setInfo("Verification email sent. Please check your inbox.")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-blue-50 p-6">
      <div className="w-full max-w-md rounded-2xl border bg-white shadow-sm p-8">
        <h1 className="text-xl font-semibold mb-4">Teacher Sign In</h1>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm">Email</label>
            <input className="w-full border rounded-md px-3 py-2" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required/>
          </div>
          <div className="space-y-2">
            <label className="text-sm">Password</label>
            <input className="w-full border rounded-md px-3 py-2" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required/>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {info && <p className="text-sm text-green-600">{info}</p>}
          <MovingBorderButton type="submit">{loading ? "Please wait..." : "Continue"}</MovingBorderButton>
        </form>
        {needsVerify && (
          <div className="mt-3">
            <button onClick={resendVerification} className="text-xs underline">Resend verification email</button>
          </div>
        )}
        <div className="text-xs text-gray-500 mt-4 flex items-center justify-between">
          <span>Invites are required for student accounts. <Link href="/auth/student" className="underline">Sign in as student</Link></span>
          <Link href="/auth/teacher/signup" className="underline">Create teacher account</Link>
        </div>
      </div>
    </div>
  )
}
