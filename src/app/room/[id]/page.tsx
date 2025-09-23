"use client"

import * as React from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import ChatRoom from "@/components/ui/shadcn-io/ai/ChatRoom"
import BasicToast from "@/components/smoothui/ui/BasicToast"
import { AnimatePresence } from "motion/react"

export default function RoomPage() {
  const params = useParams<{ id: string }>()
  const roomId = params?.id
  const search = useSearchParams()
  const router = useRouter()
  const isTeacher = search?.get("as") === "teacher"
  const [onlineCount, setOnlineCount] = React.useState<number>(1)
  const [ending, setEnding] = React.useState(false)
  const [showToast, setShowToast] = React.useState(false)
  const presenceRef = React.useRef<ReturnType<typeof supabase.channel> | null>(null)

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
    presenceRef.current = channel

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState()
        const count = Object.values(state).reduce((acc, arr) => acc + (arr as any[]).length, 0)
        setOnlineCount(Math.max(1, count))
      })
      .on("broadcast", { event: "end" }, () => {
        setShowToast(true)
        setTimeout(() => {
          setShowToast(false)
          router.push("/student")
        }, 1200)
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ joined_at: Date.now() })
        }
      })

    return () => {
      presenceRef.current = null
      supabase.removeChannel(channel)
    }
  }, [roomId])

  // Listen for room deletion and notify participants
  React.useEffect(() => {
    if (!roomId) return
    const delChannel = supabase
      .channel(`rooms-delete-${roomId}`)
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
        () => {
          setShowToast(true)
          setTimeout(() => {
            setShowToast(false)
            router.push("/student")
          }, 1500)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(delChannel)
    }
  }, [roomId, router])

  return (
    <div className="p-6 space-y-2">
      <p>Connected to room: {roomId}</p>
      <p>Users online: {onlineCount}</p>
      {isTeacher && (
        <button
          className="border px-2 py-1"
          disabled={ending}
          onClick={async () => {
            if (!roomId) return
            const ok = window.confirm("End session and delete this room?")
            if (!ok) return
            setEnding(true)
            setShowToast(true)
            try {
              // Broadcast end to participants before deleting
              await presenceRef.current?.send({ type: "broadcast", event: "end", payload: { by: "teacher" } })
            } catch (e) {
              // ignore
            }
            const { error } = await supabase.from("rooms").delete().eq("id", roomId)
            if (error) {
              console.error(error.message)
              setEnding(false)
              return
            }
            setTimeout(() => {
              setEnding(false)
              setShowToast(false)
              router.push("/teacher")
            }, 1200)
          }}
        >
          {ending ? "Ending..." : "End Session"}
        </button>
      )}
      {roomId && (
        <div className="pt-4">
          <ChatRoom roomId={roomId as string} role={isTeacher ? "teacher" : "student"} />
        </div>
      )}
      <AnimatePresence>
        {showToast && (
          <BasicToast
            message="Session ended"
            type="warning"
            duration={1200}
            onClose={() => setShowToast(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}


