"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import RoomPassInput from "@/components/smoothui/ui/RoomPassInput";
import { retry } from "@/lib/retry";
import RoleLayout from "@/components/blocks/RoleLayout";
import StudentDashboard from "@/components/dashboard/StudentDashboard";
import SkillTree from "@/components/gamification/SkillTree";
import {
  BookOpen,
  Users,
  Video,
  FileText,
  Calendar,
  Award,
} from "lucide-react";
import Loading from "@/components/common/loading";

export default function StudentPage() {
  const router = useRouter();
  const [pass, setPass] = React.useState("");
  const [joining, setJoining] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [user, setUser] = React.useState<any>(null);
  const [view, setView] = React.useState<"dashboard" | "skill-tree">(
    "dashboard"
  );

  // Check authentication on mount
  React.useEffect(() => {
    async function checkAuth() {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (error || !user) {
          router.push("/auth/student");
          return;
        }

        // Check if user is a student
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, name")
          .eq("id", user.id)
          .single();

        if (!profile || profile.role !== "student") {
          router.push("/auth/student");
          return;
        }

        setUser(user);
      } catch (err) {
        console.error("Auth check failed:", err);
        router.push("/auth/student");
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [router]);

  async function handleComplete(value: string) {
    setJoining(true);
    setToast(null);
    try {
      const data = await retry(async () => {
        const { data, error } = await supabase
          .from("rooms")
          .select("id")
          .eq("passcode", value)
          .single();
        if (error) throw error;
        return data;
      });
      router.push(`/room/${data.id}`);
    } catch (err) {
      console.error("join_failed", err);
      setPass("");
      setToast("Invalid or expired passcode. Try again.");
      setTimeout(() => setToast(null), 2500);
    } finally {
      setJoining(false);
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
          <RoomPassInput
            value={pass}
            onChange={setPass}
            onComplete={handleComplete}
          />
          {joining && <p className="text-sm text-blue-600">Joining room...</p>}
        </div>
      ),
      bgColor: "bg-blue-50",
    },
    {
      title: "Learning Materials",
      description: "Access your textbooks and study resources",
      icon: <BookOpen className="w-8 h-8 text-green-600" />,
      content: <p className="text-gray-500">Coming soon...</p>,
      bgColor: "bg-green-50",
    },
    {
      title: "Video Lessons",
      description: "Watch recorded lessons and tutorials",
      icon: <Video className="w-8 h-8 text-purple-600" />,
      content: <p className="text-gray-500">Coming soon...</p>,
      bgColor: "bg-purple-50",
    },
    {
      title: "Assignments",
      description: "View and submit your homework",
      icon: <FileText className="w-8 h-8 text-orange-600" />,
      content: <p className="text-gray-500">Coming soon...</p>,
      bgColor: "bg-orange-50",
    },
    {
      title: "Schedule",
      description: "Check your class timetable",
      icon: <Calendar className="w-8 h-8 text-red-600" />,
      content: <p className="text-gray-500">Coming soon...</p>,
      bgColor: "bg-red-50",
    },
    {
      title: "Progress",
      description: "Track your learning achievements",
      icon: <Award className="w-8 h-8 text-yellow-600" />,
      content: <p className="text-gray-500">Coming soon...</p>,
      bgColor: "bg-yellow-50",
    },
  ];

  const handleSidebarAction = (action: string, data?: any) => {
    switch (action) {
      case "joinRoom":
        // Handle room joining
        console.log("Join room action");
        break;
      case "viewQuizzes":
        // Handle quiz viewing
        console.log("View quizzes action");
        break;
      case "viewSkillTree":
        setView("skill-tree");
        break;
      default:
        console.log("Sidebar action:", action, data);
    }
  };

  return (
    <RoleLayout role="student" onAction={handleSidebarAction}>
      {loading ? (
        <div className="flex items-center justify-center min-h-screen w-full">
          <Loading />
        </div>
      ) : (
        <>
          {toast && (
            <div className="fixed top-4 right-4 z-50 rounded-md bg-red-50 text-red-800 border border-red-200 px-3 py-2 text-sm">
              {toast}
            </div>
          )}
          {view === "dashboard" ? (
            <StudentDashboard onJoinRoom={(code) => handleComplete(code)} />
          ) : (
            <div className="max-w-7xl mx-auto space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Skill Tree</h1>
                <button
                  className="px-3 py-1 rounded-md border"
                  onClick={() => setView("dashboard")}
                >
                  Back
                </button>
              </div>
              <SkillTree />
            </div>
          )}
        </>
      )}
    </RoleLayout>
  );
}
