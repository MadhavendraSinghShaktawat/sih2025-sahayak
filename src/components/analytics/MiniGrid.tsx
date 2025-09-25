"use client";

import * as React from "react";
import * as echarts from "echarts";

type MiniGridProps = {
  title?: string;
  className?: string;
};

/**
 * MiniGrid (stacked area)
 * Purpose: Show trend evolution of multiple cohorts/metrics over time in one compact view.
 * Example in Sahayak: daily active students by grade, attempts per quiz category or room.
 * Stacking shows total load while individual series reveal cohort patterns.
 */
export default function MiniGrid({ title = "Classroom Trends", className }: MiniGridProps) {
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

    // Replace with a safe stacked area chart (multi-series) to avoid coord errors
    const categories = Array.from({ length: 20 }, (_, i) => `T${i + 1}`);
    const seriesColors = ["#60a5fa", "#34d399", "#f59e0b", "#ef4444", "#a78bfa"];
    const series = seriesColors.map((color) => ({
      type: "line",
      data: Array.from({ length: categories.length }, () => Math.round(Math.random() * 120)),
      areaStyle: { color: color + "22" },
      lineStyle: { color, width: 2 },
      showSymbol: false,
      smooth: true,
      stack: "total",
    } as echarts.SeriesOption));

    const option: echarts.EChartsOption = {
      title: { text: title, left: "center", textStyle: { fontSize: 13, color: "#374151" } },
      grid: { top: 36, left: 30, right: 20, bottom: 24 },
      tooltip: { trigger: "axis" },
      xAxis: { type: "category", boundaryGap: false, data: categories, axisLine: { show: false }, axisTick: { show: false } },
      yAxis: { type: "value", axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: "#f3f4f6" } } },
      series,
    };

    chartRef.current.setOption(option);
  }, [title]);

  return <div className={className} style={{ width: "100%", height: 360 }} ref={ref} />;
}


