"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Simple chart container component since recharts is not available
const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    config?: any;
  }
>(({ className, children, config, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("w-full h-full", className)}
    {...props}
  >
    {children}
  </div>
));
ChartContainer.displayName = "ChartContainer";

const ChartTooltip = ({ children, ...props }: any) => (
  <div {...props}>{children}</div>
);

const ChartTooltipContent = ({ children, ...props }: any) => (
  <div {...props}>{children}</div>
);

const ChartLegend = ({ children, ...props }: any) => (
  <div {...props}>{children}</div>
);

const ChartLegendContent = ({ children, ...props }: any) => (
  <div {...props}>{children}</div>
);

// Simple placeholder components for missing chart types
export const ResponsiveContainer = ({ children, ...props }: any) => (
  <div className="w-full h-full" {...props}>
    {children}
  </div>
);

export const AreaChart = ({ children, data, ...props }: any) => (
  <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center" {...props}>
    <div className="text-gray-500">Chart Placeholder - Install recharts for full functionality</div>
  </div>
);

export const Area = ({ ...props }: any) => null;
export const XAxis = ({ ...props }: any) => null;
export const YAxis = ({ ...props }: any) => null;
export const CartesianGrid = ({ ...props }: any) => null;
export const RadarChart = ({ children, ...props }: any) => (
  <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center" {...props}>
    <div className="text-gray-500">Radar Chart Placeholder</div>
  </div>
);
export const Radar = ({ ...props }: any) => null;
export const PolarAngleAxis = ({ ...props }: any) => null;
export const PolarGrid = ({ ...props }: any) => null;
export const RadialBarChart = ({ children, ...props }: any) => (
  <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center" {...props}>
    <div className="text-gray-500">Radial Bar Chart Placeholder</div>
  </div>
);
export const RadialBar = ({ ...props }: any) => null;
export const BarChart = ({ children, ...props }: any) => (
  <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center" {...props}>
    <div className="text-gray-500">Bar Chart Placeholder</div>
  </div>
);
export const Bar = ({ children, ...props }: any) => null;
export const LabelList = ({ ...props }: any) => null;

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
};
