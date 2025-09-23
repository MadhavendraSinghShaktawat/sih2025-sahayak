"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { supabase, hasSupabaseEnv } from "@/lib/supabaseClient"

export default function TeacherPage() {
  const router = useRouter()
  const [name, setName] = React.useState("")
  const [creating, setCreating] = React.useState(false)
  const [roomId, setRoomId] = React.useState<string | null>(null)
  const [passcode, setPasscode] = React.useState<string | null>(null)
  const [qr, setQr] = React.useState<string | null>(null)

  async function onCreateRoom(e: React.FormEvent) {
    e.preventDefault()
    if (!name) return
    if (!hasSupabaseEnv) {
      console.error("Supabase env missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.")
      return
    }
    setCreating(true)
    try {
      // Create a simple 6-digit numeric passcode
      const code = Math.floor(100000 + Math.random() * 900000).toString()

      // Insert room into Supabase (assumes rooms table exists)
      const { data, error } = await supabase
        .from("rooms")
        .insert({ passcode: code, created_by: name })
        .select("id, passcode")
        .single()

      if (error) throw new Error(`Supabase error inserting room: ${error.message}`)
      const id = data.id as string
      setRoomId(id)
      setPasscode(data.passcode as string)

      const envBase = (process.env.NEXT_PUBLIC_SITE_URL as string | undefined)?.replace(/\/$/, "")
      const origin = envBase || (typeof window !== "undefined" ? window.location.origin : "")
      const joinUrl = `${origin}/room/${id}`
      const { toDataURL } = await import("qrcode")
      const url = await toDataURL(joinUrl)
      setQr(url)
    } catch (err: any) {
      console.error(err?.message ?? err ?? "Unknown error")
    } finally {
      setCreating(false)
    }
  }

  async function onEndSession() {
    if (!roomId) return
    if (!hasSupabaseEnv) {
      console.error("Supabase env missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.")
      return
    }
    const ok = window.confirm("End session and delete this room?")
    if (!ok) return
    try {
      // Broadcast an end signal to participants
      const channel = supabase.channel(`presence:room:${roomId}`)
      await channel.subscribe()
      await channel.send({ type: "broadcast", event: "end", payload: { by: "teacher" } })
      await supabase.removeChannel(channel)

      const { error } = await supabase.from("rooms").delete().eq("id", roomId)
      if (error) throw new Error(`Supabase error deleting room: ${error.message}`)
      setRoomId(null)
      setPasscode(null)
      setQr(null)
    } catch (err: any) {
      console.error(err?.message ?? err)
    }
  }

  return (
    <div className="p-6 space-y-4">
      <h1>Teacher</h1>
      <form onSubmit={onCreateRoom} className="space-y-2">
        <input
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border px-2 py-1"
        />
        <button type="submit" disabled={creating} className="border px-2 py-1">
          {creating ? "Creating..." : "Create Room"}
        </button>
      </form>

      {roomId && (
        <div className="space-y-2">
          <p>Room created: {roomId}</p>
          <p>Room pass: {passcode}</p>
          {qr && (
            <div>
              <img alt="Room QR" src={qr} />
            </div>
          )}
          <button className="border px-2 py-1" onClick={() => router.push(`/room/${roomId}?as=teacher`)}>
            Go to Room
          </button>
          <button className="border px-2 py-1" onClick={onEndSession}>
            End Session
          </button>
        </div>
      )}
    </div>
  )
}


