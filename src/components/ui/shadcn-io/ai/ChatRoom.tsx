"use client";

import * as React from "react";
import { supabase } from "@/lib/supabaseClient";
import { retry } from "@/lib/retry";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ui/shadcn-io/ai/conversation";
import {
  Message,
  MessageAvatar,
  MessageContent,
} from "@/components/ui/shadcn-io/ai/message";
import ButtonCopy from "@/components/smoothui/ui/ButtonCopy";
import { QuizDisplay } from "@/components/QuizDisplay";
import { QuizGenerationModal } from "@/components/smoothui/ui/QuizGenerationModal";
import { SelectQuizModal } from "@/components/smoothui/ui/SelectQuizModal";
import BasicDropdown from "@/components/smoothui/ui/BasicDropdown";
import { BookOpen, UserPlus } from "lucide-react";

type ChatMessage = {
  id: string;
  text: string;
  name: string;
  avatar?: string;
  role: "teacher" | "student";
};

export function ChatRoom({
  roomId,
  role,
  name,
  avatar,
  onlineCount = 1,
  onEndSession,
  otp,
}: {
  roomId: string;
  role: "teacher" | "student";
  name?: string;
  avatar?: string;
  onlineCount?: number;
  onEndSession?: () => void;
  otp?: string;
}) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [quizModal, setQuizModal] = React.useState<{
    open: boolean;
    quizId?: string;
    quiz?: any;
  }>(() => ({ open: false }));
  const [showQuizModal, setShowQuizModal] = React.useState(false);
  const [showSelectQuiz, setShowSelectQuiz] = React.useState(false);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const channelRef = React.useRef<ReturnType<typeof supabase.channel> | null>(
    null
  );
  const [displayName, setDisplayName] = React.useState(name ?? "");
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load initial messages and set up real-time
  React.useEffect(() => {
    if (!roomId) return;

    async function loadMessages() {
      try {
        setLoading(true);
        const data = await retry(async () => {
          const result = await supabase
            .from("messages")
            .select("id, text, name, role, kind, data, created_at")
            .eq("room_id", roomId)
            .order("created_at", { ascending: true })
            .limit(50);
          if (result.error) throw result.error;
          return result.data;
        });

        // Convert database messages to ChatMessage format
        const dbMessages: ChatMessage[] = (data || []).map((msg: any) => ({
          id: msg.id,
          text: msg.text,
          name: msg.name,
          role: msg.role as "teacher" | "student",
        }));

        setMessages(dbMessages);
      } catch (err) {
        console.error("Failed to load messages:", err);
      } finally {
        setLoading(false);
      }
    }

    loadMessages();

    // Set up real-time channel for new messages
    const channel = supabase.channel(`room:${roomId}`);
    channelRef.current = channel;

    // Listen for new messages via postgres_changes
    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          console.log("Real-time message received:", payload);
          const newMsg = payload.new as any;
          const chatMsg: ChatMessage = {
            id: newMsg.id,
            text: newMsg.text,
            name: newMsg.name,
            role: newMsg.role as "teacher" | "student",
          };
          setMessages((prev) => {
            // Avoid duplicates by checking if message already exists
            const exists = prev.some((msg) => msg.id === chatMsg.id);
            if (exists) return prev;
            return [...prev, chatMsg];
          });
        }
      )
      .subscribe((status) => {
        console.log("Real-time subscription status:", status);
      });

    return () => {
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  // Fallback: Refresh messages every 3 seconds if real-time fails
  React.useEffect(() => {
    if (!roomId || loading) return;

    const interval = setInterval(async () => {
      try {
        const data = await supabase
          .from("messages")
          .select("id, text, name, role, kind, data, created_at")
          .eq("room_id", roomId)
          .order("created_at", { ascending: true })
          .limit(50);

        if (data.data) {
          const dbMessages: ChatMessage[] = data.data.map((msg: any) => ({
            id: msg.id,
            text: msg.text,
            name: msg.name,
            role: msg.role as "teacher" | "student",
          }));

          setMessages((prev) => {
            // Only update if we have new messages
            if (dbMessages.length > prev.length) {
              console.log("Fallback: Found new messages via polling");
              return dbMessages;
            }
            return prev;
          });
        }
      } catch (err) {
        console.error("Fallback polling failed:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [roomId, loading]);

  async function sendMessage() {
    const text = input.trim();
    if (!text) return;
    const who = displayName || (role === "teacher" ? "Teacher" : "Student");

    try {
      // Get current user for sender_id
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.error("User not authenticated");
        return;
      }

      // Generate a stable client id in case RLS prevents returning rows
      const messageId =
        (typeof globalThis !== "undefined" &&
          (globalThis as any).crypto &&
          typeof (globalThis as any).crypto.randomUUID === "function" &&
          (globalThis as any).crypto.randomUUID()) ||
        `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

      // Insert message to database
      await retry(async () => {
        const result = await supabase.from("messages").insert({
          id: messageId,
          room_id: roomId,
          sender_id: user.id,
          name: who,
          role: role,
          text: text,
        });
        if (result.error) {
          console.error("Failed to insert message:", result.error);
          throw result.error;
        }
        console.log("Message inserted successfully:", {
          messageId,
          roomId,
          text,
        });
        return true;
      });

      // Optimistically add to local state (will be confirmed by real-time update)
      const msg: ChatMessage = {
        id: messageId,
        text,
        name: who,
        avatar,
        role,
      };
      setMessages((prev) => [...prev, msg]);
      setInput("");
    } catch (err) {
      console.error("Failed to send message:", err);
      // Could add toast notification here
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      const trimmed = input.trim().toLowerCase();
      if (role === "teacher" && trimmed.startsWith("/quiz")) {
        e.preventDefault();
        setShowQuizModal(true);
        return;
      }
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold text-lg">
              Teaching Session
            </h3>
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
                        await navigator.clipboard.writeText(otp);
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
            {loading ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-2">⏳</div>
                  <p>Loading messages...</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-2">💬</div>
                  <p>No messages yet</p>
                  <p className="text-sm">Start a conversation!</p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((m) => (
                  <Message
                    key={m.id}
                    from={m.role === "teacher" ? "user" : "assistant"}
                  >
                    <MessageContent className="text-gray-800">
                      {m.text}
                    </MessageContent>
                    <MessageAvatar name={m.name} src={m.avatar || ""} />
                  </Message>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
        {quizModal.open && quizModal.quiz && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="max-w-3xl w-full rounded-xl bg-white p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold">Quiz</div>
                <button
                  className="rounded-md border px-3 py-1 text-sm"
                  onClick={() => setQuizModal({ open: false })}
                >
                  Close
                </button>
              </div>
              <QuizDisplay quiz={quizModal.quiz} />
            </div>
          </div>
        )}
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
          <div className="flex-1 flex gap-2 items-end">
            {role === "teacher" && (
              <BasicDropdown
                label="Actions"
                className="w-28"
                items={[
                  {
                    id: "create_quiz",
                    label: "Create Quiz",
                    icon: <BookOpen className="w-4 h-4" />,
                  },
                  {
                    id: "select_quiz",
                    label: "Select Quiz",
                    icon: <BookOpen className="w-4 h-4" />,
                  },
                  {
                    id: "invite_students",
                    label: "Invite Students",
                    icon: <UserPlus className="w-4 h-4" />,
                  },
                ]}
                highlightId={(() => {
                  const t = input.trim().toLowerCase();
                  if (t.startsWith("/quiz")) return "create_quiz";
                  if (t.startsWith("/selectquiz")) return "select_quiz";
                  return undefined;
                })()}
                onChange={(item) => {
                  if (item.id === "create_quiz") {
                    setShowQuizModal(true);
                  }
                  if (item.id === "select_quiz") {
                    setShowSelectQuiz(true);
                  }
                  if (item.id === "invite_students") {
                    window.open("/teacher", "_self");
                  }
                }}
              />
            )}
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
              disabled={
                !input.trim() || (role === "student" && !displayName.trim())
              }
            >
              Send
            </button>
          </div>
        </div>
        {role === "student" && !displayName.trim() && (
          <p className="text-xs text-gray-500 mt-2">
            Please enter your name to start chatting
          </p>
        )}
        {/* Quiz Modal trigger from dropdown or /quiz */}
        <QuizGenerationModal
          isOpen={showQuizModal}
          onClose={() => setShowQuizModal(false)}
          command="/quiz"
          roomId={roomId}
          onQuizGenerated={() => {}}
        />
        <SelectQuizModal
          isOpen={showSelectQuiz}
          onClose={() => setShowSelectQuiz(false)}
          roomId={roomId}
        />
      </div>
    </div>
  );
}

export default ChatRoom;
