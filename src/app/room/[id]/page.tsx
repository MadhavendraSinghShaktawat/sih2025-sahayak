"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

export default function RoomPage() {
  const params = useParams<{ id: string }>()
  const roomId = params?.id
  const [onlineCount, setOnlineCount] = React.useState<number>(1)

  React.useEffect(() => {
    if (!roomId) return

    const presenceKey =
      (typeof globalThis !== "undefined" && (globalThis as any).crypto &&
        typeof (globalThis as any).crypto.randomUUID === "function" &&
        (globalThis as any).crypto.randomUUID()) ||
      `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

    const channel = supabase.channel(`presence:room:${roomId}`, {
      config: {
        presence: { key: presenceKey },
      },
    })

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState()
        const count = Object.values(state).reduce((acc, arr) => acc + (arr as any[]).length, 0)
        setOnlineCount(Math.max(1, count))
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ joined_at: Date.now() })
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId])

  return (
    <div className="p-6 space-y-2">
      <p>Connected to room: {roomId}</p>
      <p>Users online: {onlineCount}</p>
    </div>
  )
}


