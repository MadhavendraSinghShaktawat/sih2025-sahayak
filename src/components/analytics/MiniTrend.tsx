"use client";

import * as React from "react";
import * as echarts from "echarts";

type MiniTrendProps = {
  data: number[];
  type?: "line" | "bar" | "area";
  color?: string;
  height?: number;
  className?: string;
};

export default function MiniTrend({
  data,
  type = "line",
  color = "#4f46e5",
  height = 36,
  className,
}: MiniTrendProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const chartRef = React.useRef<echarts.ECharts | null>(null);

  React.useEffect(() => {
    if (!ref.current) return;
    chartRef.current?.dispose();
    chartRef.current = echarts.init(ref.current);
    return () => {
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    if (!chartRef.current) return;
    const isArea = type === "area";
    const option: echarts.EChartsOption = {
      animation: false,
      grid: { left: 0, right: 0, top: 2, bottom: 0 },
      xAxis: { type: "category", show: false, data: data.map((_, i) => String(i + 1)) },
      yAxis: { type: "value", show: false },
      series: [
        type === "bar"
          ? {
              type: "bar",
              data,
              itemStyle: { color },
              barWidth: "60%",
            }
          : {
              type: "line",
              data,
              smooth: true,
              showSymbol: false,
              lineStyle: { color, width: 2 },
              areaStyle: isArea ? { color: color + "33" } : undefined,
            },
      ],
      tooltip: { show: false },
    };
    chartRef.current.setOption(option);
  }, [data, type, color]);

  return <div className={className} style={{ width: "100%", height }} ref={ref} />;
}


