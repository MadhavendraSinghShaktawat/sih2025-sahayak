"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import RoomPassInput from "@/components/smoothui/ui/RoomPassInput"

export default function StudentPage() {
  const router = useRouter()
  const [pass, setPass] = React.useState("")
  const [joining, setJoining] = React.useState(false)

  async function handleComplete(value: string) {
    setJoining(true)
    try {
      // Find room by passcode
      const { data, error } = await supabase
        .from("rooms")
        .select("id")
        .eq("passcode", value)
        .single()

      if (error) throw error
      router.push(`/room/${data.id}`)
    } catch (err) {
      console.error(err)
      setPass("")
    } finally {
      setJoining(false)
    }
  }

  return (
    <div className="p-6 space-y-4">
      <h1>Student</h1>
      <p>Enter 6-digit room pass</p>
      <RoomPassInput value={pass} onChange={setPass} onComplete={handleComplete} />
      {joining && <p>Joining...</p>}
    </div>
  )
}


