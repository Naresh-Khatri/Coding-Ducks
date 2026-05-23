"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RetroGrid } from "@/components/ui/retro-grid";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";

const AnimatedTerminal = dynamic(
  () => import("@/components/animated-terminal"),
  { ssr: false, loading: () => null },
);

export function HeroSection() {
  return (
    <section className="relative min-h-[calc(100dvh-4rem)] overflow-hidden">
      {/* Retro "sky" — deep indigo/violet fading toward the horizon */}
      <div className="absolute inset-0 z-[5] bg-[linear-gradient(to_bottom,#1a0033_0%,#2d0b4e_28%,rgba(60,20,90,0.4)_46%,transparent_55%)]" />

      {/* Wide atmospheric bloom rising off the horizon */}
      <div className="absolute inset-x-0 top-1/2 z-[6] h-[420px] -translate-y-[55%] bg-[radial-gradient(ellipse_70%_55%_at_50%_85%,rgba(157,78,221,0.3),transparent_70%)] blur-2xl" />
      {/* Tight bright core on the horizon line */}
      <div className="absolute inset-x-0 top-1/2 z-[6] h-[160px] -translate-y-1/2 bg-[radial-gradient(ellipse_35%_60%_at_50%_50%,rgba(255,86,160,0.45),rgba(157,78,221,0.2)_55%,transparent_80%)] blur-xl" />

      {/* Animated WebGL retro grid */}
      <RetroGrid
        className="absolute inset-0 z-0"
        darkLineColor="#9d4edd"
        lightLineColor="#9d4edd"
      />

      {/* Top-down dark gradient for depth */}
      <div className="absolute inset-0 z-10 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.5)_0%,transparent_45%,transparent_100%)]" />
      {/* Edge vignette to focus toward center */}
      <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_85%_85%_at_50%_50%,transparent_45%,rgba(0,0,0,0.6)_100%)]" />
      {/* Bottom fade back to black */}
      <div className="absolute inset-x-0 bottom-0 z-10 h-1/3 bg-[linear-gradient(to_bottom,transparent,#000)]" />

      {/* Subtle CRT scanlines for retro texture */}
      <div className="absolute inset-0 z-[11] bg-[repeating-linear-gradient(to_bottom,#fff_0px,#fff_1px,transparent_1px,transparent_3px)] opacity-[0.06]" />

      {/* 3D terminal */}
      <div className="absolute inset-0 z-[17] h-full w-full">
        <AnimatedTerminal />
      </div>

      {/* Baseline hero — cohesive text column, vertically centered */}
      <div className="pointer-events-none absolute inset-0 z-20 flex items-center">
        <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
          <motion.div
            className="pointer-events-auto"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Announcement pill */}
            <Link
              href="/system-design"
              className="group mb-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.03] py-1.5 pr-3 pl-4 text-sm text-neutral-300 backdrop-blur transition-colors hover:border-fuchsia-400/40 hover:text-white"
            >
              <span className="text-fuchsia-300">✦</span>
              <span className="font-medium text-white">New</span>
              <span className="hidden h-3.5 w-px bg-white/15 sm:block" />
              <span>System Design simulator</span>
              <ArrowRight className="size-3.5 text-fuchsia-300 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>

            <div className="mb-6 flex items-center gap-3">
              <span className="h-px w-12 bg-gradient-to-r from-fuchsia-500 to-transparent" />
              <span className="font-mono text-xs tracking-[0.25em] text-neutral-400 uppercase">
                The playground for coders
              </span>
            </div>
            <h1 className="text-6xl leading-[0.9] font-black tracking-tight text-white md:text-7xl xl:text-8xl">
              BUILD. BATTLE.
              <br />
              <span className="bg-gradient-to-r from-fuchsia-400 via-violet-400 to-fuchsia-300 bg-clip-text text-transparent">
                BELONG.
              </span>
            </h1>
            <div className="mt-8 flex flex-wrap items-center gap-6">
              <Link href="/problems">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-white shadow-[0_0_25px_-5px_rgba(157,78,221,0.7)]"
                >
                  Start coding
                </Button>
              </Link>
              <p className="max-w-xs text-sm text-neutral-400">
                Problems, UI battles, and real-time collaboration — all in one
                place.
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* scroll cue */}
      <motion.div
        className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="font-mono text-[10px] tracking-[0.3em] text-neutral-500 uppercase">
          scroll
        </span>
      </motion.div>
    </section>
  );
}
