"use client";

import { useEffect, useRef, useState } from "react";
import { SectionLabel } from "./primitives";

interface Stat {
  value: number;
  suffix: string;
  label: string;
}

const STATS: Stat[] = [
  { value: 500, suffix: "+", label: "Coding problems" },
  { value: 120, suffix: "K", label: "Submissions judged" },
  { value: 4, suffix: "", label: "Languages supported" },
  { value: 99, suffix: "%", label: "Uptime, real-time sync" },
];

/** Eases a number from 0 → target once the element scrolls into view. */
function useCountUp(target: number, run: boolean, duration = 1400) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!run) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run, duration]);

  return value;
}

function StatItem({ stat, run }: { stat: Stat; run: boolean }) {
  const value = useCountUp(stat.value, run);
  return (
    <div className="group relative text-center">
      <div className="bg-gradient-to-b from-white to-neutral-400 bg-clip-text font-mono text-4xl font-bold text-transparent tabular-nums md:text-5xl">
        {value}
        {stat.suffix}
      </div>
      <div className="mt-2 text-sm text-neutral-500">{stat.label}</div>
    </div>
  );
}

export function StatsBand() {
  const ref = useRef<HTMLDivElement>(null);
  const [run, setRun] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setRun(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative border-t border-white/5 bg-black py-24">
      <div ref={ref} className="mx-auto w-full max-w-7xl px-6 lg:px-10">
        <SectionLabel className="justify-center">By the numbers</SectionLabel>
        <div className="mt-12 grid grid-cols-2 gap-y-12 lg:grid-cols-4">
          {STATS.map((stat) => (
            <StatItem key={stat.label} stat={stat} run={run} />
          ))}
        </div>
      </div>
    </section>
  );
}
