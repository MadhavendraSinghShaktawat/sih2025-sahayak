"use client";

import * as React from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import ChatRoom from "@/components/ui/shadcn-io/ai/ChatRoom";
import BasicToast from "@/components/smoothui/ui/BasicToast";
import { AnimatePresence, motion } from "motion/react";
import AiInputDemo from "@/components/smoothui/examples/AiInputDemo";

export default function RoomPage() {
  const params = useParams<{ id: string }>();
  const roomId = params?.id;
  const search = useSearchParams();
  const router = useRouter();
  const isTeacher = search?.get("as") === "teacher";
  const teacherName = search?.get("name") || "Teacher";
  const [onlineCount, setOnlineCount] = React.useState<number>(1);
  const [ending, setEnding] = React.useState(false);
  const [showToast, setShowToast] = React.useState(false);
  const [otp, setOtp] = React.useState<string>("");
  const presenceRef = React.useRef<ReturnType<typeof supabase.channel> | null>(
    null
  );

  // Fetch passcode (OTP)
  React.useEffect(() => {
    if (!roomId) return;
    (async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("passcode")
        .eq("id", roomId)
        .single();
      if (!error && data?.passcode) {
        setOtp(String(data.passcode));
      }
    })();
  }, [roomId]);

  React.useEffect(() => {
    if (!roomId) return;

    async function setupPresence() {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      const presenceKey =
        uid || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

      const channel = supabase.channel(`presence:room:${roomId}`, {
        config: {
          presence: { key: presenceKey },
        },
      });
      presenceRef.current = channel;

      channel
        .on("presence", { event: "sync" }, () => {
          const state = channel.presenceState();
          // unique keys represent unique users
          const count = Object.keys(state).length;
          setOnlineCount(Math.max(1, count));
        })
        .on("broadcast", { event: "end" }, () => {
          setShowToast(true);
          setTimeout(() => {
            setShowToast(false);
            router.push("/student");
          }, 1200);
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await channel.track({ joined_at: Date.now() });
          }
        });
    }

    setupPresence();

    return () => {
      if (presenceRef.current) supabase.removeChannel(presenceRef.current);
      presenceRef.current = null;
    };
  }, [roomId]);

  // Listen for room deletion and notify participants
  React.useEffect(() => {
    if (!roomId) return;
    const delChannel = supabase
      .channel(`rooms-delete-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${roomId}`,
        },
        () => {
          setShowToast(true);
          setTimeout(() => {
            setShowToast(false);
            router.push("/student");
          }, 1500);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(delChannel);
    };
  }, [roomId, router]);

  return (
    <div className="min-h-screen h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {roomId && (
        <ChatRoom
          roomId={roomId as string}
          role={isTeacher ? "teacher" : "student"}
          name={isTeacher ? teacherName : undefined}
          onlineCount={onlineCount}
          otp={otp}
          onEndSession={
            isTeacher
              ? async () => {
                  if (!roomId) return;
                  const ok = window.confirm(
                    "End session and delete this room?"
                  );
                  if (!ok) return;
                  setEnding(true);
                  setShowToast(true);
                  try {
                    // Broadcast end to participants before deleting
                    await presenceRef.current?.send({
                      type: "broadcast",
                      event: "end",
                      payload: { by: "teacher" },
                    });
                  } catch (e) {
                    // ignore
                  }
                  const { error } = await supabase
                    .from("rooms")
                    .delete()
                    .eq("id", roomId);
                  if (error) {
                    console.error(error.message);
                    setEnding(false);
                    return;
                  }
                  setTimeout(() => {
                    setEnding(false);
                    setShowToast(false);
                    router.push("/teacher");
                  }, 1200);
                }
              : undefined
          }
        />
      )}

      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <BasicToast
              message="Session ended"
              type="warning"
              duration={1200}
              onClose={() => setShowToast(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
