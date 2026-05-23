"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";

export function ClosingCta() {
  return (
    <section className="relative overflow-hidden border-t border-white/5 bg-black py-32">
      {/* grid texture fading upward */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(157,78,221,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(157,78,221,0.07)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_80%_at_50%_100%,black,transparent)] [background-size:56px_56px]" />
      {/* horizon bloom */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-[radial-gradient(ellipse_50%_100%_at_50%_100%,rgba(157,78,221,0.25),transparent_70%)] blur-2xl" />

      <motion.div
        className="relative mx-auto max-w-3xl px-6 text-center"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <h2 className="text-4xl leading-[1.05] font-black tracking-tight text-balance text-white md:text-6xl">
          Ready to start
          <br />
          <span className="bg-gradient-to-r from-fuchsia-400 via-violet-400 to-fuchsia-300 bg-clip-text text-transparent">
            shipping code?
          </span>
        </h2>
        <p className="mx-auto mt-6 max-w-md text-base text-neutral-400">
          Join the playground where coders practice, battle, and build together
          — in real time.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href="/problems">
            <Button
              size="lg"
              className="group bg-primary hover:bg-primary/90 text-white shadow-[0_0_30px_-5px_rgba(157,78,221,0.7)]"
            >
              Start coding
              <ArrowRight className="ml-1 size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
          </Link>
          <Link href="/ducklets">
            <Button
              size="lg"
              variant="outline"
              className="border-white/15 bg-white/[0.02] text-neutral-200 hover:border-fuchsia-400/30 hover:bg-white/5 hover:text-white"
            >
              Open a Ducklet
            </Button>
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
