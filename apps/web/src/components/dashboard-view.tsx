// "use client";
//
// import Link from "next/link";
// import { Activity, AlertCircle, CheckCircle, Clock, Code } from "lucide-react";
// import {
//   Area,
//   AreaChart,
//   CartesianGrid,
//   ResponsiveContainer,
//   Tooltip,
//   XAxis,
//   YAxis,
// } from "recharts";
//
// import { Button } from "~/components/ui/button";
// import { Card } from "~/components/ui/card";
// import { CHART_DATA } from "../_lib/mock-data";
// import { StatsCard } from "./stats-card";
//
// export function DashboardView() {
//   return (
//     <div className="space-y-8">
//       {/* Welcome Section */}
//       <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
//         <div>
//           <h2 className="mb-1 text-2xl font-bold">Welcome to Coding Ducks! 🦆</h2>
//           <p className="text-muted-foreground">
//             You're running on the{" "}
//             <span className="text-foreground font-medium">Free Tier</span>.
//             Everything looks healthy.
//           </p>
//         </div>
//         <div className="flex gap-3">
//           <Button variant="outline" asChild>
//             <Link href="/dashboard/api-keys">Manage Keys</Link>
//           </Button>
//           <Button asChild className="shadow-lg">
//             <Link href="/dashboard/playground">
//               <Code size={16} />
//               Test Endpoint
//             </Link>
//           </Button>
//         </div>
//       </div>
//
//       {/* Stats Grid */}
//       <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
//         <StatsCard
//           title="Total Requests"
//           value="124,592"
//           trend="+12.5%"
//           trendUp={true}
//           icon={Activity}
//         />
//         <StatsCard
//           title="Avg. Latency"
//           value="45ms"
//           trend="-2ms"
//           trendUp={true}
//           icon={Clock}
//         />
//         <StatsCard
//           title="Success Rate"
//           value="99.92%"
//           trend="+0.1%"
//           trendUp={true}
//           icon={CheckCircle}
//         />
//         <StatsCard
//           title="Active Keys"
//           value="3"
//           trend="Max 5"
//           trendUp={false}
//           icon={AlertCircle}
//         />
//       </div>
//
//       <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
//         {/* Main Chart */}
//         <Card className="p-6 lg:col-span-2">
//           <div className="mb-6 flex items-center justify-between">
//             <div>
//               <h3 className="text-lg font-semibold">Execution Volume</h3>
//               <p className="text-muted-foreground text-sm">
//                 Requests processed over the last 7 days
//               </p>
//             </div>
//             <select className="bg-muted border-border text-foreground focus:ring-ring rounded-lg border p-2 text-sm outline-none focus:ring-1">
//               <option>Last 7 days</option>
//               <option>Last 30 days</option>
//             </select>
//           </div>
//
//           <div className="h-[300px] w-full">
//             <ResponsiveContainer width="100%" height="100%">
//               <AreaChart data={CHART_DATA}>
//                 <defs>
//                   <linearGradient
//                     id="colorRequests"
//                     x1="0"
//                     y1="0"
//                     x2="0"
//                     y2="1"
//                   >
//                     <stop
//                       offset="5%"
//                       stopColor="hsl(var(--primary))"
//                       stopOpacity={0.3}
//                     />
//                     <stop
//                       offset="95%"
//                       stopColor="hsl(var(--primary))"
//                       stopOpacity={0}
//                     />
//                   </linearGradient>
//                 </defs>
//                 <CartesianGrid
//                   strokeDasharray="3 3"
//                   stroke="hsl(var(--border))"
//                   vertical={false}
//                 />
//                 <XAxis
//                   dataKey="name"
//                   stroke="hsl(var(--muted-foreground))"
//                   fontSize={12}
//                   tickLine={false}
//                   axisLine={false}
//                   dy={10}
//                 />
//                 <YAxis
//                   stroke="hsl(var(--muted-foreground))"
//                   fontSize={12}
//                   tickLine={false}
//                   axisLine={false}
//                   dx={-10}
//                   tickFormatter={(value) => `${value / 1000}k`}
//                 />
//                 <Tooltip
//                   contentStyle={{
//                     backgroundColor: "hsl(var(--popover))",
//                     borderColor: "hsl(var(--border))",
//                     borderRadius: "8px",
//                     color: "hsl(var(--popover-foreground))",
//                   }}
//                   itemStyle={{ color: "hsl(var(--primary))" }}
//                 />
//                 <Area
//                   type="monotone"
//                   dataKey="requests"
//                   stroke="hsl(var(--primary))"
//                   strokeWidth={2}
//                   fillOpacity={1}
//                   fill="url(#colorRequests)"
//                 />
//               </AreaChart>
//             </ResponsiveContainer>
//           </div>
//         </Card>
//
//         {/* Getting Started / Learn */}
//         <Card className="flex flex-col p-6">
//           <h3 className="mb-2 text-lg font-semibold">Quick Start Guide</h3>
//           <p className="text-muted-foreground mb-6 text-sm">
//             Master the API workflow in less than 5 minutes.
//           </p>
//
//           <div className="flex-1 space-y-4">
//             {[
//               { title: "Generate your first API Key", done: true },
//               { title: "Install the SDK or use cURL", done: true },
//               { title: "Make your first execution request", done: false },
//               { title: "View execution logs", done: false },
//             ].map((step, idx) => (
//               <div key={idx} className="flex items-start gap-3">
//                 <div
//                   className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs ${
//                     step.done
//                       ? "bg-primary/20 text-primary"
//                       : "bg-muted text-muted-foreground"
//                   }`}
//                 >
//                   {step.done ? <CheckCircle size={12} /> : idx + 1}
//                 </div>
//                 <div
//                   className={
//                     step.done
//                       ? "text-muted-foreground line-through"
//                       : "text-foreground"
//                   }
//                 >
//                   <p className="text-sm leading-tight font-medium">
//                     {step.title}
//                   </p>
//                 </div>
//               </div>
//             ))}
//           </div>
//
//           <Button variant="outline" className="mt-6 w-full" asChild>
//             <Link href="/dashboard/docs">Read Full Documentation</Link>
//           </Button>
//         </Card>
//       </div>
//     </div>
//   );
// }
