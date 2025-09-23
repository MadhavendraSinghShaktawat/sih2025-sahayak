"use client"

import * as React from "react"
import { createClient } from "@supabase/supabase-js"
import MovingBorderButton from "@/components/blocks/moving-border-button"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
)

export default function TeacherSignUp() {
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [name, setName] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [message, setMessage] = React.useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name, role: "teacher" } } })
    if (error) {
      setLoading(false)
      setError(error.message)
      return
    }
    const userId = data.user?.id
    if (userId) {
      // upsert profile as teacher
      await supabase.from("profiles").upsert({ id: userId, role: "teacher", name }).select().single()
      setMessage("Account created. You can now sign in.")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-blue-50 p-6">
      <div className="w-full max-w-md rounded-2xl border bg-white shadow-sm p-8">
        <h1 className="text-xl font-semibold mb-4">Create Teacher Account</h1>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm">Name</label>
            <input className="w-full border rounded-md px-3 py-2" value={name} onChange={(e)=>setName(e.target.value)} required/>
          </div>
          <div className="space-y-2">
            <label className="text-sm">Email</label>
            <input className="w-full border rounded-md px-3 py-2" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required/>
          </div>
          <div className="space-y-2">
            <label className="text-sm">Password</label>
            <input className="w-full border rounded-md px-3 py-2" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required/>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-green-600">{message}</p>}
          <MovingBorderButton type="submit">{loading ? "Please wait..." : "Create account"}</MovingBorderButton>
        </form>
      </div>
    </div>
  )
}
