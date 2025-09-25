"use client";

import * as React from "react";
import * as echarts from "echarts";

/**
 * AxisBreakBar
 * Purpose: Show distributions with extreme outliers without losing detail in normal ranges.
 * Example use in Sahayak: scores/time-taken per question or response sizes where a few rooms
 * have very large counts. Axis breaks keep small values readable while still displaying outliers.
 */
type AxisBreakBarProps = {
  className?: string;
  title?: string;
  subtitle?: string;
  categories?: string[]; // e.g., weekdays or room labels
  series?: Array<{ name: string; data: number[] }>;
  breaks?: Array<{ start: number; end: number; gap?: string }>;
};

export default function AxisBreakBar({
  className,
  title = "Outlier Distribution with Axis Breaks",
  subtitle = "Click break area to expand — great for outliers (e.g., very active rooms)",
  categories = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  series,
  breaks,
}: AxisBreakBarProps) {
  const elRef = React.useRef<HTMLDivElement | null>(null);
  const chartRef = React.useRef<echarts.ECharts | null>(null);

  React.useEffect(() => {
    if (!elRef.current) return;
    chartRef.current?.dispose();
    chartRef.current = echarts.init(elRef.current);

    const _currentAxisBreaks =
      breaks || [
        { start: 5000, end: 100000, gap: "1.5%" },
        { start: 105000, end: 3100000, gap: "1.5%" },
      ];

    const option: any = {
      title: {
        text: title,
        subtext: subtitle,
        left: "center",
        textStyle: { fontSize: 16 },
        subtextStyle: { color: "#175ce5", fontSize: 12, fontWeight: "bold" },
      },
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      legend: {},
      grid: { top: 84, left: 40, right: 16, bottom: 20 },
      xAxis: [{ type: "category", data: categories }],
      yAxis: [
        {
          type: "value",
          breaks: _currentAxisBreaks,
          breakArea: { itemStyle: { opacity: 1 }, zigzagZ: 200 },
        },
      ],
      series:
        (series && series.length)
          ? series.map(s => ({ ...s, type: "bar", emphasis: { focus: "series" } }))
          : [
              // Demo mapping: rooms with normal/high/extreme message counts per day
              { name: "Normal Activity", type: "bar", emphasis: { focus: "series" }, data: [1500, 2032, 2001, 3154, 2190, 4330, 2410] },
              { name: "High Activity", type: "bar", emphasis: { focus: "series" }, data: [1200, 1320, 1010, 1340, 900, 2300, 2100] },
              { name: "Very High (Outliers)", type: "bar", emphasis: { focus: "series" }, data: [103200, 100320, 103010, 102340, 103900, 103300, 103200] },
              { name: "Extreme (1–3M)", type: "bar", emphasis: { focus: "series" }, data: [3106212, 3102118, 3102643, 3104631, 3106679, 3100130, 3107022] },
            ],
    };

    chartRef.current.setOption(option);

    // Interaction helpers
    function updateCollapseButton(params: any) {
      let needReset = false;
      for (let i = 0; i < params.breaks.length; i++) {
        if (params.breaks[i].isExpanded) { needReset = true; break; }
      }
      chartRef.current?.setOption({
        graphic: [
          {
            elements: [
              {
                type: "rect",
                ignore: !needReset,
                name: "collapseAxisBreakBtn",
                top: 5,
                left: 5,
                shape: { r: 3, width: 160, height: 24 },
                style: { fill: "#eee", stroke: "#999", lineWidth: 1 },
                textContent: { type: "text", style: { text: "Collapse Axis Breaks", fontSize: 12, fontWeight: "bold" } },
                textConfig: { position: "inside" },
              },
            ],
          },
        ],
      } as any);
    }

    function collapseAxisBreak() {
      (chartRef.current as any)?.dispatchAction({ type: "collapseAxisBreak", yAxisIndex: 0, breaks: _currentAxisBreaks });
    }

    const chart = chartRef.current;
    chart?.on("axisbreakchanged", (params: any) => updateCollapseButton(params));
    chart?.on("click", (params: any) => {
      if (params.name === "collapseAxisBreakBtn") collapseAxisBreak();
    });

    return () => {
      chart?.off("axisbreakchanged");
      chart?.off("click");
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, []);

  return <div ref={elRef} className={className} style={{ width: "100%", height: 360 }} />;
}


