"use client";

import * as React from "react";
import * as echarts from "echarts";

type DonutCardProps = {
  title: string;
  correctPct: number; // 0-100
  className?: string;
};

export default function DonutCard({ title, correctPct, className }: DonutCardProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const chartRef = React.useRef<echarts.ECharts | null>(null);

  React.useEffect(() => {
    if (!ref.current) return;
    chartRef.current?.dispose();
    chartRef.current = echarts.init(ref.current);
    return () => chartRef.current?.dispose();
  }, []);

  React.useEffect(() => {
    if (!chartRef.current) return;
    const option: echarts.EChartsOption = {
      title: { text: title, left: "center", textStyle: { fontSize: 12, color: "#374151" } },
      tooltip: { trigger: "item" },
      legend: { show: false },
      series: [
        {
          type: "pie",
          radius: ["60%", "85%"],
          avoidLabelOverlap: false,
          label: { show: false },
          data: [
            { value: correctPct, name: "Correct", itemStyle: { color: "#10b981" } },
            { value: 100 - correctPct, name: "Wrong", itemStyle: { color: "#ef4444" } },
          ],
        },
      ],
      graphic: [
        {
          type: "text",
          left: "center",
          top: "center",
          style: {
            text: `${correctPct}%`,
            textAlign: "center",
            fill: "#111827",
            fontSize: 18,
            fontWeight: 600,
          },
        },
      ],
    };
    chartRef.current.setOption(option);
  }, [title, correctPct]);

  return <div className={className} style={{ width: "100%", height: 200 }} ref={ref} />;
}


