"use client";

import * as React from "react";
import * as echarts from "echarts";
import { supabase } from "@/lib/supabaseClient";

type TimeRange = "7d" | "30d" | "90d" | "all";

interface OptionsHeatmapProps {
  teacherId?: string;
  className?: string;
}

interface QuizRow {
  id: string;
  title: string;
  questions: Array<{
    id: string;
    question: string;
    options?: string[];
    correctAnswer: string | number;
  }>;
}

interface ResponseRow {
  room_id: string;
  completed_at: string;
  answers: Record<string, string | number>;
  room?: { passcode?: string | null };
  quiz?: { id: string; teacher_id?: string };
}

const OPTION_KEYS = ["A", "B", "C", "D"] as const;

export default function OptionsHeatmap({ teacherId, className }: OptionsHeatmapProps) {
  const chartRef = React.useRef<HTMLDivElement | null>(null);
  const chartInstanceRef = React.useRef<echarts.ECharts | null>(null);

  const [timeRange, setTimeRange] = React.useState<TimeRange>("7d");
  const [rooms, setRooms] = React.useState<Array<{ id: string; label: string }>>([]);
  const [selectedRoomId, setSelectedRoomId] = React.useState<string>("all");
  const [quizzes, setQuizzes] = React.useState<QuizRow[]>([]);
  const [selectedQuizId, setSelectedQuizId] = React.useState<string>("auto");
  const [questions, setQuestions] = React.useState<QuizRow["questions"]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = React.useState<string>("auto");
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  // Initialize chart
  React.useEffect(() => {
    if (!chartRef.current) return;
    const instance = echarts.init(chartRef.current, undefined, { renderer: "canvas" });
    chartInstanceRef.current = instance;
    return () => {
      instance.dispose();
      chartInstanceRef.current = null;
    };
  }, []);

  // Load quizzes (for teacher scope) and seed selectors
  React.useEffect(() => {
    const loadQuizzes = async () => {
      try {
        setError(null);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) throw new Error("Not authenticated");

        let query = supabase
          .from("quizzes")
          .select("id, title, questions, teacher_id")
          .order("created_at", { ascending: false })
          .limit(25);

        if (teacherId) query = query.eq("teacher_id", teacherId);

        const { data, error } = await query;
        if (error) throw error;
        const typed = (data || []).map((q: any) => ({
          id: q.id,
          title: q.title,
          questions: Array.isArray(q.questions) ? q.questions : [],
        })) as QuizRow[];
        setQuizzes(typed);

        // Default quiz/question selection
        if (typed.length > 0 && (selectedQuizId === "auto" || !typed.find(q => q.id === selectedQuizId))) {
          setSelectedQuizId(typed[0].id);
          setQuestions(typed[0].questions);
          if (typed[0].questions.length > 0) setSelectedQuestionId(typed[0].questions[0].id);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load quizzes");
      }
    };
    loadQuizzes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherId]);

  // Update question list if quiz changes
  React.useEffect(() => {
    const quiz = quizzes.find(q => q.id === selectedQuizId);
    setQuestions(quiz?.questions || []);
    if (quiz?.questions?.length) {
      if (selectedQuestionId === "auto" || !quiz.questions.find(qq => qq.id === selectedQuestionId)) {
        setSelectedQuestionId(quiz.questions[0].id);
      }
    }
  }, [quizzes, selectedQuizId]);

  // Fetch and render data
  const fetchAndRender = React.useCallback(async () => {
    if (!selectedQuizId || !selectedQuestionId || !chartInstanceRef.current) return;
    try {
      setLoading(true);
      setError(null);

      // Time filter
      let fromIso: string | null = null;
      if (timeRange !== "all") {
        const now = new Date();
        const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
        const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        fromIso = from.toISOString();
      }

      // Query quiz_responses joined with room
      let query = supabase
        .from("quiz_responses")
        .select("room_id, completed_at, answers, room:rooms(passcode), quiz:quizzes(id, teacher_id)")
        .eq("quiz_id", selectedQuizId)
        .order("completed_at", { ascending: true });

      if (fromIso) query = query.gte("completed_at", fromIso);
      if (selectedRoomId !== "all") query = query.eq("room_id", selectedRoomId);

      const { data, error } = await query;
      if (error) throw error;

      const rows: ResponseRow[] = (data || []) as any;

      // Build room labels
      const xLabels: string[] = [];
      const roomIdToIndex = new Map<string, number>();
      rows.forEach((r) => {
        if (!roomIdToIndex.has(r.room_id)) {
          const label = `Room ${r.room?.passcode ?? "-"} • ${new Date(r.completed_at).toLocaleString()}`;
          roomIdToIndex.set(r.room_id, xLabels.length);
          xLabels.push(label);
        }
      });

      // Aggregate counts per room for the selected question
      const countsPerRoom: Array<{ a: number; b: number; c: number; d: number; total: number }> =
        Array.from({ length: xLabels.length }, () => ({ a: 0, b: 0, c: 0, d: 0, total: 0 }));

      rows.forEach((r) => {
        const idx = roomIdToIndex.get(r.room_id);
        if (idx === undefined) return;
        const ans = r.answers?.[selectedQuestionId];
        countsPerRoom[idx].total += 1;
        if (String(ans) === "0") countsPerRoom[idx].a += 1;
        else if (String(ans) === "1") countsPerRoom[idx].b += 1;
        else if (String(ans) === "2") countsPerRoom[idx].c += 1;
        else if (String(ans) === "3") countsPerRoom[idx].d += 1;
      });

      // Build heatmap data points (row = option, col = room)
      // value = percent of students selecting that option
      const seriesData: Array<[number, number, number]> = [];
      countsPerRoom.forEach((c, x) => {
        const denom = c.total || 1;
        // ECharts heatmap expects [xIndex, yIndex, value]
        seriesData.push([x, 0, Math.round((c.a / denom) * 100)]);
        seriesData.push([x, 1, Math.round((c.b / denom) * 100)]);
        seriesData.push([x, 2, Math.round((c.c / denom) * 100)]);
        seriesData.push([x, 3, Math.round((c.d / denom) * 100)]);
      });

      const option: echarts.EChartsOption = {
        tooltip: {
          position: "top",
          formatter: (params: any) => {
            const row = OPTION_KEYS[params.data[1]];
            const label = xLabels[params.data[0]];
            return `${label}<br/>Option ${row}: ${params.data[2]}%`;
          },
        },
        grid: { top: 40, right: 20, bottom: 60, left: 60 },
        xAxis: {
          type: "category",
          data: xLabels,
          axisLabel: { interval: 0, rotate: 30 },
        },
        yAxis: {
          type: "category",
          data: [...OPTION_KEYS],
        },
        visualMap: {
          min: 0,
          max: 100,
          calculable: true,
          orient: "horizontal",
          left: "center",
          bottom: 10,
        },
        series: [
          {
            name: "Option Distribution",
            type: "heatmap",
            data: seriesData,
            label: { show: true, formatter: ({ data }: any) => `${data[2]}%` },
            emphasis: { itemStyle: { shadowBlur: 8, shadowColor: "rgba(0,0,0,0.3)" } },
          },
        ],
      };

      chartInstanceRef.current.setOption(option);

      // Rooms dropdown options (unique by room_id, pick first label seen)
      const roomOpts: Array<{ id: string; label: string }> = [];
      const seen = new Set<string>();
      rows.forEach((r) => {
        if (!seen.has(r.room_id)) {
          seen.add(r.room_id);
          roomOpts.push({ id: r.room_id, label: `Room ${r.room?.passcode ?? "-"}` });
        }
      });
      setRooms(roomOpts);

    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load heatmap data");
    } finally {
      setLoading(false);
    }
  }, [selectedQuizId, selectedQuestionId, selectedRoomId, timeRange]);

  React.useEffect(() => {
    fetchAndRender();
  }, [fetchAndRender]);

  // Realtime subscription: refetch on new quiz_responses rows
  React.useEffect(() => {
    const channel = supabase
      .channel("quiz_responses_heatmap")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "quiz_responses" },
        () => {
          // Debounced refetch to avoid rapid bursts
          fetchAndRender();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAndRender]);

  const selectedQuiz = quizzes.find(q => q.id === selectedQuizId);

  return (
    <div className={className}>
      {/* Controls */}
      <div className="mb-3 flex flex-wrap gap-2 items-center">
        <select
          aria-label="Time Range"
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as TimeRange)}
          className="rounded-md border px-2 py-1 text-sm"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="all">All time</option>
        </select>

        <select
          aria-label="Room"
          value={selectedRoomId}
          onChange={(e) => setSelectedRoomId(e.target.value)}
          className="rounded-md border px-2 py-1 text-sm"
        >
          <option value="all">All rooms</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>{r.label}</option>
          ))}
        </select>

        <select
          aria-label="Quiz"
          value={selectedQuizId}
          onChange={(e) => setSelectedQuizId(e.target.value)}
          className="rounded-md border px-2 py-1 text-sm"
        >
          {quizzes.map((q) => (
            <option key={q.id} value={q.id}>{q.title}</option>
          ))}
        </select>

        <select
          aria-label="Question"
          value={selectedQuestionId}
          onChange={(e) => setSelectedQuestionId(e.target.value)}
          className="min-w-[200px] rounded-md border px-2 py-1 text-sm"
        >
          {questions.map((q) => (
            <option key={q.id} value={q.id}>
              {q.question.length > 60 ? q.question.slice(0, 60) + "…" : q.question}
            </option>
          ))}
        </select>

        {selectedQuiz && questions.length > 0 && (
          <span className="ml-auto text-xs text-gray-500">Realtime • Updates on new responses</span>
        )}
      </div>

      {/* Chart */}
      <div className="w-full h-[360px] rounded-md border" ref={chartRef} />

      {/* States */}
      {loading && (
        <div className="mt-2 text-sm text-gray-500">Loading…</div>
      )}
      {error && (
        <div className="mt-2 text-sm text-red-600">{error}</div>
      )}
    </div>
  );
}


