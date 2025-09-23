"use client"

import * as React from "react"
import { supabase } from "@/lib/supabaseClient"
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ui/shadcn-io/ai/conversation"
import { Message, MessageAvatar, MessageContent } from "@/components/ui/shadcn-io/ai/message"
import ButtonCopy from "@/components/smoothui/ui/ButtonCopy"

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
  onlineCount = 1,
  onEndSession,
  otp,
}: {
  roomId: string
  role: "teacher" | "student"
  name?: string
  avatar?: string
  onlineCount?: number
  onEndSession?: () => void
  otp?: string
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
    <div className="flex flex-col h-screen">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold text-lg">Teaching Session</h3>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-blue-100 text-sm">
                {role === "teacher" ? "Teaching Mode" : "Student Mode"}
              </p>
              {otp && (
                <span className="flex items-center gap-2 text-blue-100 text-xs font-mono bg-white/10 px-2 py-1 rounded">
                  OTP: {otp}
                  <ButtonCopy
                    onCopy={async () => {
                      try {
                        await navigator.clipboard.writeText(otp)
                      } catch {}
                    }}
                    className="ml-1 border-white/20 bg-white/10 text-white hover:bg-white/20"
                  />
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
              <span className="text-white text-sm font-medium">
                {onlineCount} online
              </span>
            </div>
            {role === "teacher" && onEndSession && (
              <button
                onClick={onEndSession}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200"
              >
                End Session
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 bg-gray-50 min-h-0">
        <Conversation className="relative h-full">
          <ConversationContent className="p-4 h-full">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-2">💬</div>
                  <p>No messages yet</p>
                  <p className="text-sm">Start a conversation!</p>
                </div>
              </div>
            ) : (
              messages.map((m) => (
                <Message key={m.id} from={m.role === "teacher" ? "user" : "assistant"}>
                  <MessageContent className="text-gray-800">{m.text}</MessageContent>
                  <MessageAvatar name={m.name} src={m.avatar || ""} />
                </Message>
              ))
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex gap-3 items-end">
          {/* Only show name field for students; teacher name comes from query */}
          {role === "student" && (
            <div className="flex-shrink-0">
              <input
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          )}
          <div className="flex-1 flex gap-2">
            <input
              placeholder="Type your message here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
            />
            <button 
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={sendMessage}
              disabled={!input.trim() || (role === "student" && !displayName.trim())}
            >
              Send
            </button>
          </div>
        </div>
        {role === "student" && !displayName.trim() && (
          <p className="text-xs text-gray-500 mt-2">Please enter your name to start chatting</p>
        )}
      </div>
    </div>
  )
}

export default ChatRoom


