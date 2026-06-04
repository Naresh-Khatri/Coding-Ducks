"use client";

// This component is already loaded lazily via next/dynamic in canvas-info-overlay.tsx; recharts is not in the main bundle
// react-doctor-disable-next-line react-doctor/prefer-dynamic-import
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
