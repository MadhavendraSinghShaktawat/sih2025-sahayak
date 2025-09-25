"use client";

import * as React from "react";
import * as echarts from "echarts";

/**
 * PolarStackBar
 * Purpose: Compare composition across categories in a compact radial form.
 * Example use in Sahayak: distribution of option selections (A/B/C) across days/rooms,
 * or content types consumed by students. Stacked radial bars make proportion obvious
 * while saving horizontal space.
 */
type PolarStackBarProps = {
  className?: string;
  labels?: string[];
  stacks?: Array<{ name: string; values: number[] }>;
};

export default function PolarStackBar({ className, labels, stacks }: PolarStackBarProps) {
  const elRef = React.useRef<HTMLDivElement | null>(null);
  const chartRef = React.useRef<echarts.ECharts | null>(null);

  React.useEffect(() => {
    if (!elRef.current) return;
    chartRef.current?.dispose();
    chartRef.current = echarts.init(elRef.current);

    const cats = labels || ["Mon", "Tue", "Wed", "Thu"];
    const defs = stacks || [
      { name: "A", values: [1, 2, 3, 4] },
      { name: "B", values: [2, 4, 6, 8] },
      { name: "C", values: [1, 2, 3, 4] },
    ];

    const option: echarts.EChartsOption = {
      angleAxis: {},
      radiusAxis: { type: "category", data: cats, z: 10 },
      polar: {},
      series: defs.map(s => ({
        type: "bar",
        data: s.values,
        coordinateSystem: "polar",
        name: s.name,
        stack: "a",
        emphasis: { focus: "series" },
      })),
      legend: { show: true, data: defs.map(d => d.name) },
    };

    chartRef.current.setOption(option);
    return () => chartRef.current?.dispose();
  }, []);

  return <div ref={elRef} className={className} style={{ width: "100%", height: 320 }} />;
}


