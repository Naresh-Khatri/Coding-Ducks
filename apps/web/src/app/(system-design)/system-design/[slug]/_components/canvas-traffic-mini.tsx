"use client";

import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

interface TrafficPoint {
  time: number;
  rps: number;
}

interface CanvasTrafficMiniProps {
  trafficPattern: TrafficPoint[];
}

export function CanvasTrafficMini({ trafficPattern }: CanvasTrafficMiniProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={trafficPattern}>
        <XAxis dataKey="time" hide />
        <YAxis hide />
        <Area
          type="monotone"
          dataKey="rps"
          stroke="#3b82f6"
          fill="#3b82f640"
          strokeWidth={1.5}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
