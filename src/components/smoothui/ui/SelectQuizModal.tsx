"use client"

import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useQuizzes } from "@/hooks/useQuizzes"
import { supabase } from "@/lib/supabaseClient"

interface SelectQuizModalProps {
  isOpen: boolean
  onClose: () => void
  roomId: string
}

export function SelectQuizModal({ isOpen, onClose, roomId }: SelectQuizModalProps) {
  const { quizzes, loading, error, refreshQuizzes } = useQuizzes()
  const [postingId, setPostingId] = React.useState<string | null>(null)
  const [search, setSearch] = React.useState("")

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return quizzes
    return quizzes.filter((x) =>
      (x.title || "").toLowerCase().includes(q) ||
      (x.metadata?.subject || "").toLowerCase().includes(q)
    )
  }, [quizzes, search])

  const postToChat = async (quiz: any) => {
    try {
      setPostingId(quiz.id)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Not authenticated')
      const resp = await fetch(`/api/rooms/${roomId}/post-quiz`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          quizId: quiz.id,
          title: quiz.title,
          subject: quiz.metadata?.subject,
          questions: quiz.questions?.length || 0,
        }),
      })
      const json = await resp.json().catch(() => ({} as any))
      if (!resp.ok) throw new Error(json.error || "Failed to post quiz")
      onClose()
    } catch (e) {
      console.error(e)
    } finally {
      setPostingId(null)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 12 }}
            transition={{ duration: 0.18 }}
            className="relative w-full max-w-3xl mx-4 bg-white rounded-2xl shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <div className="font-semibold">Select a Quiz</div>
              <button className="rounded-md border px-3 py-1 text-sm" onClick={onClose}>Close</button>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title or subject"
                  className="flex-1 px-3 py-2 border rounded-md"
                />
                <button className="rounded-md border px-3 py-2 text-sm" onClick={refreshQuizzes}>Refresh</button>
              </div>
              {loading ? (
                <div className="py-10 text-center text-gray-600">Loading quizzes...</div>
              ) : error ? (
                <div className="py-10 text-center text-red-600">{error}</div>
              ) : filtered.length === 0 ? (
                <div className="py-10 text-center text-gray-600">No quizzes found</div>
              ) : (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                  {filtered.map((q) => (
                    <div key={q.id} className="rounded-lg border p-4 flex items-start justify-between">
                      <div>
                        <div className="font-medium">{q.title}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Subject: {q.metadata.subject} • Class: {q.metadata.class} • Questions: {q.questions.length}
                        </div>
                      </div>
                      <button
                        disabled={postingId === q.id}
                        onClick={() => postToChat(q)}
                        className="rounded-md border px-3 py-1 text-sm disabled:opacity-50"
                      >
                        {postingId === q.id ? "Posting..." : "Post to Chat"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}


