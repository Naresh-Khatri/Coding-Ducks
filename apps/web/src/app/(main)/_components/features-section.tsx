"use client";

import Link from "next/link";
import { ArrowUpRight, Code2, Network, Palette, Users } from "lucide-react";

import { Reveal, SectionLabel } from "./primitives";
import { SpotlightCard } from "./spotlight-card";

interface Feature {
  icon: typeof Code2;
  name: string;
  description: string;
  href: string;
  cta: string;
  className: string;
  glow: string;
}

const FEATURES: Feature[] = [
  {
    icon: Code2,
    name: "Practice Problems",
    description:
      "Hundreds of LeetCode-style challenges with real test cases across Python, JavaScript, Java, and C++. Instant feedback, every submission.",
    href: "/problems",
    cta: "Browse problems",
    className: "lg:col-span-2",
    glow: "rgba(157,78,221,0.22)",
  },
  {
    icon: Users,
    name: "Ducklets",
    description:
      "Real-time collaborative editors. Code together with a shared cursor, live output, and chat.",
    href: "/ducklets",
    cta: "Open a Ducklet",
    className: "lg:col-span-1",
    glow: "rgba(255,41,117,0.2)",
  },
  {
    icon: Palette,
    name: "UI Battles",
    description:
      "Recreate a design with HTML & CSS and go head-to-head with other developers.",
    href: "/battles",
    cta: "Enter a battle",
    className: "lg:col-span-1",
    glow: "rgba(255,41,117,0.2)",
  },
  {
    icon: Network,
    name: "System Design",
    description:
      "Drag, drop, and wire up architectures on an interactive canvas — then run a traffic simulation to see if your design holds up.",
    href: "/system-design",
    cta: "Start designing",
    className: "lg:col-span-2",
    glow: "rgba(157,78,221,0.22)",
  },
];

export function FeaturesSection() {
  return (
    <section className="relative border-t border-white/5 bg-black py-28">
      {/* faint grid texture */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(157,78,221,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(157,78,221,0.06)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_40%,black,transparent)] [background-size:48px_48px]" />

      <div className="relative mx-auto w-full max-w-7xl px-6 lg:px-10">
        <Reveal>
          <SectionLabel>Everything in one place</SectionLabel>
          <h2 className="mt-4 max-w-2xl text-4xl font-bold tracking-tight text-white md:text-5xl">
            One platform to practice,
            <br />
            compete, and collaborate.
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <Reveal
              key={feature.name}
              delay={i * 0.08}
              className={feature.className}
            >
              <SpotlightCard glow={feature.glow} className="h-full">
                <Link href={feature.href} className="flex h-full flex-col p-7">
                  <div className="mb-5 flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-fuchsia-300 transition-colors duration-300 group-hover:border-fuchsia-400/40 group-hover:text-fuchsia-200">
                    <feature.icon className="size-5" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">
                    {feature.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                    {feature.description}
                  </p>
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-medium text-neutral-300 transition-colors group-hover:text-fuchsia-200">
                    {feature.cta}
                    <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </Link>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
