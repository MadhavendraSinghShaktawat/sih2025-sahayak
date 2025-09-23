"use client"

import * as React from "react"
import { supabase } from "@/lib/supabaseClient"
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ui/shadcn-io/ai/conversation"
import { Message, MessageAvatar, MessageContent } from "@/components/ui/shadcn-io/ai/message"

type ChatMessage = {
  id: string
  text: string
  name: string
  avatar?: string
  role: "teacher" | "student"
}

export function ChatRoom({
  roomId,
  role,
  name,
  avatar,
}: {
  roomId: string
  role: "teacher" | "student"
  name?: string
  avatar?: string
}) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [input, setInput] = React.useState("")
  const channelRef = React.useRef<ReturnType<typeof supabase.channel> | null>(null)
  const [displayName, setDisplayName] = React.useState(name ?? "")

  React.useEffect(() => {
    if (!roomId) return
    const channel = supabase.channel(`presence:room:${roomId}`)
    channelRef.current = channel
    channel
      .on("broadcast", { event: "chat" }, (payload) => {
        const msg = payload.payload as ChatMessage
        setMessages((prev) => [...prev, msg])
      })
      .subscribe()
    return () => {
      channelRef.current = null
      supabase.removeChannel(channel)
    }
  }, [roomId])

  function sendMessage() {
    const text = input.trim()
    if (!text) return
    const who = displayName || (role === "teacher" ? "Teacher" : "Student")
    const msg: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text,
      name: who,
      avatar,
      role,
    }
    channelRef.current?.send({ type: "broadcast", event: "chat", payload: msg })
    setMessages((prev) => [...prev, msg])
    setInput("")
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col gap-2 border rounded-md p-2">
      <Conversation className="relative size-full" style={{ height: "360px" }}>
        <ConversationContent>
          {messages.map((m) => (
            <Message key={m.id} from={m.role === "teacher" ? "user" : "assistant"}>
              <MessageContent>{m.text}</MessageContent>
              <MessageAvatar name={m.name} src={m.avatar || ""} />
            </Message>
          ))}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="flex gap-2">
        {!name && (
          <input
            placeholder="Your name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="border px-2 py-1 rounded-md"
          />
        )}
        <input
          placeholder="Type a message"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          className="flex-1 border px-2 py-1 rounded-md"
        />
        <button className="border px-3 py-1 rounded-md" onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  )
}

export default ChatRoom


