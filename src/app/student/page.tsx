"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import RoomPassInput from "@/components/smoothui/ui/RoomPassInput"
import { retry } from "@/lib/retry"
import { BookOpen, Users, Video, FileText, Calendar, Award } from "lucide-react"

export default function StudentPage() {
  const router = useRouter()
  const [pass, setPass] = React.useState("")
  const [joining, setJoining] = React.useState(false)
  const [toast, setToast] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [user, setUser] = React.useState<any>(null)

  // Check authentication on mount
  React.useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error || !user) {
          router.push("/auth/student")
          return
        }
        
        // Check if user is a student
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, name")
          .eq("id", user.id)
          .single()
        
        if (!profile || profile.role !== "student") {
          router.push("/auth/student")
          return
        }
        
        setUser(user)
      } catch (err) {
        console.error("Auth check failed:", err)
        router.push("/auth/student")
      } finally {
        setLoading(false)
      }
    }
    
    checkAuth()
  }, [router])

  async function handleComplete(value: string) {
    setJoining(true)
    setToast(null)
    try {
      const data = await retry(async () => {
        const { data, error } = await supabase
          .from("rooms")
          .select("id")
          .eq("passcode", value)
          .single()
        if (error) throw error
        return data
      })
      router.push(`/room/${data.id}`)
    } catch (err) {
      console.error("join_failed", err)
      setPass("")
      setToast("Invalid or expired passcode. Try again.")
      setTimeout(() => setToast(null), 2500)
    } finally {
      setJoining(false)
    }
  }

  const gridCards = [
    {
      title: "Join a Room",
      description: "Enter your teacher's room code to join the class",
      icon: <Users className="w-8 h-8 text-blue-600" />,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Enter 6-digit room code</p>
          <RoomPassInput value={pass} onChange={setPass} onComplete={handleComplete} />
          {joining && <p className="text-sm text-blue-600">Joining room...</p>}
        </div>
      ),
      bgColor: "bg-blue-50",
    },
    { title: "Learning Materials", description: "Access your textbooks and study resources", icon: <BookOpen className="w-8 h-8 text-green-600" />, content: <p className="text-gray-500">Coming soon...</p>, bgColor: "bg-green-50" },
    { title: "Video Lessons", description: "Watch recorded lessons and tutorials", icon: <Video className="w-8 h-8 text-purple-600" />, content: <p className="text-gray-500">Coming soon...</p>, bgColor: "bg-purple-50" },
    { title: "Assignments", description: "View and submit your homework", icon: <FileText className="w-8 h-8 text-orange-600" />, content: <p className="text-gray-500">Coming soon...</p>, bgColor: "bg-orange-50" },
    { title: "Schedule", description: "Check your class timetable", icon: <Calendar className="w-8 h-8 text-red-600" />, content: <p className="text-gray-500">Coming soon...</p>, bgColor: "bg-red-50" },
    { title: "Progress", description: "Track your learning achievements", icon: <Award className="w-8 h-8 text-yellow-600" />, content: <p className="text-gray-500">Coming soon...</p>, bgColor: "bg-yellow-50" },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Loading...</div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome, Student!</h1>
            <p className="text-gray-600">Ready to learn? Join your teacher's room or explore learning materials.</p>
          </div>

          {toast && <div className="rounded-md bg-red-50 text-red-800 border border-red-200 px-3 py-2 text-sm w-fit mb-4">{toast}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gridCards.map((card, index) => (
              <div key={index} className={`${card.bgColor} rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200`}>
                <div className="flex items-start space-x-4 mb-4">
                  <div className="flex-shrink-0">{card.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{card.title}</h3>
                    <p className="text-sm text-gray-600">{card.description}</p>
                  </div>
                </div>
                <div className="mt-4">{card.content}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


