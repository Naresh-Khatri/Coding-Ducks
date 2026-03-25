"use client";

import { redirect } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import {
  Terminal,
  Code2,
  Users,
  ArrowRight,
  Blocks,
  ChevronRight,
  Play,
  BookOpen,
  Braces,
  Menu,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { authClient } from "~/auth/client";
import { Button } from "~/components/ui/button";

const landingNavLinks = [
  { href: "/problems", label: "Problems" },
  { href: "/ducklets", label: "Ducklets" },
  { href: "/system-design", label: "System Design" },
  { href: "/playground", label: "Playground" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const features = [
  {
    icon: Code2,
    title: "Coding Problems",
    href: "/problems",
    description:
      "Solve algorithmic challenges across Easy, Medium, and Hard difficulties. Track your progress, bookmark problems, and review past submissions.",
    color: "text-green-400",
    gradient: "from-green-400/20 to-emerald-500/20",
    borderHover: "hover:border-green-500/20",
  },
  {
    icon: Users,
    title: "Ducklets",
    href: "/ducklets",
    description:
      "Real-time collaborative coding rooms powered by Y.js. Pair program, conduct interviews, or build together with live sync.",
    color: "text-blue-400",
    gradient: "from-blue-400/20 to-cyan-500/20",
    borderHover: "hover:border-blue-500/20",
  },
  {
    icon: Blocks,
    title: "System Design",
    href: "/system-design",
    description:
      "Drag-and-drop architecture challenges with traffic simulation, latency monitoring, and cost analysis. Build and validate distributed systems.",
    color: "text-amber-400",
    gradient: "from-amber-400/20 to-orange-500/20",
    borderHover: "hover:border-amber-500/20",
  },
  {
    icon: Braces,
    title: "Playground",
    href: "/playground",
    description:
      "Write and execute code in 50+ languages instantly. Python, Rust, Go, Java, C++ — pick your language and start coding.",
    color: "text-primary",
    gradient: "from-primary/20 to-rose-500/20",
    borderHover: "hover:border-primary/20",
  },
];

const steps = [
  {
    number: "01",
    title: "Pick a challenge",
    description: "Browse problems by difficulty and topic, or jump into a system design challenge.",
  },
  {
    number: "02",
    title: "Write your solution",
    description: "Code in our editor with syntax highlighting, auto-save drafts, and multi-language support.",
  },
  {
    number: "03",
    title: "Get instant feedback",
    description: "Run against test cases, see execution time, memory usage, and detailed verdicts in milliseconds.",
  },
];

export default function HomePage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: session, isPending } = authClient.useSession();

  if (!isPending && session) {
    if (session.user.isAdmin) {
      redirect("/admin");
    } else {
      redirect("/problems");
    }
  }

  const handleSignIn = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/problems",
    });
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white selection:bg-primary/30">
      {/* Ambient glow */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] h-[600px] w-[600px] rounded-full bg-primary/8 blur-[150px]" />
        <div className="absolute bottom-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-blue-500/6 blur-[150px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl">
          <div className="container mx-auto flex h-14 items-center justify-between px-6">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2.5 font-bold text-lg tracking-tight"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Terminal size={16} strokeWidth={3} />
              </div>
              <span>Coding Ducks</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden items-center gap-1 md:flex">
              {landingNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white hover:bg-white/5"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Desktop Right */}
            <div className="hidden items-center gap-3 md:flex">
              <Button
                variant="ghost"
                size="sm"
                className="text-zinc-400 hover:text-white hover:bg-white/5"
                onClick={handleSignIn}
              >
                Sign In
              </Button>
              <Button
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                onClick={handleSignIn}
              >
                Get Started
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="text-zinc-400 hover:text-white hover:bg-white/5 md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </Button>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="overflow-hidden border-t border-white/5 md:hidden"
              >
                <div className="container mx-auto space-y-1 px-6 py-4">
                  {landingNavLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="block rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:text-white hover:bg-white/5"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                  <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-3 mt-2">
                    <Button
                      variant="ghost"
                      className="text-zinc-400 hover:text-white hover:bg-white/5 justify-center"
                      onClick={async () => {
                        setIsMobileMenuOpen(false);
                        await handleSignIn();
                      }}
                    >
                      Sign In
                    </Button>
                    <Button
                      className="bg-primary text-primary-foreground hover:bg-primary/90 justify-center font-semibold"
                      onClick={async () => {
                        setIsMobileMenuOpen(false);
                        await handleSignIn();
                      }}
                    >
                      Get Started
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* Hero */}
        <section className="flex-1 container mx-auto px-6 flex flex-col items-center justify-center text-center pt-20 pb-32 md:pt-28 md:pb-40">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-zinc-400 mb-8"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
            </span>
            Problems, Ducklets, System Design & more
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6 max-w-4xl"
          >
            <span className="bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
              Code. Run.{" "}
            </span>
            <br />
            <span
              className="text-primary"
              style={{
                textShadow: "0 0 80px hsl(var(--primary) / 0.3)",
              }}
            >
              Quack.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            className="text-lg md:text-xl text-zinc-400 max-w-xl mb-10 leading-relaxed"
          >
            Solve coding problems, collaborate in real-time, and design
            distributed systems — all in one platform.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto"
          >
            <Button
              size="lg"
              className="h-12 px-8 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-base w-full sm:w-auto"
              onClick={handleSignIn}
            >
              Start Coding
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-8 border-white/10 text-white hover:bg-white/5 font-semibold text-base w-full sm:w-auto"
              asChild
            >
              <Link href="/playground">
                <Play className="mr-2 h-4 w-4" />
                Try Playground
              </Link>
            </Button>
          </motion.div>
        </section>

        {/* Features */}
        <section
          id="features"
          className="container mx-auto px-6 py-24 border-t border-white/5"
        >
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="mb-16 text-center"
          >
            <motion.p
              variants={fadeUp}
              className="text-sm font-medium text-primary uppercase tracking-widest mb-3"
            >
              Features
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="text-3xl md:text-4xl font-bold tracking-tight"
            >
              Everything you need to level up
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="grid md:grid-cols-2 gap-5"
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <Link
                  href={feature.href}
                  className={`group block p-8 rounded-2xl bg-zinc-900/50 border border-white/5 ${feature.borderHover} hover:bg-zinc-900/80 transition-all duration-300`}
                >
                  <div
                    className={`h-10 w-10 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <feature.icon className={feature.color} size={20} />
                  </div>
                  <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                    {feature.title}
                    <ArrowRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all duration-300" />
                  </h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* How it works */}
        <section
          id="how-it-works"
          className="container mx-auto px-6 py-24 border-t border-white/5"
        >
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="mb-16 text-center"
          >
            <motion.p
              variants={fadeUp}
              className="text-sm font-medium text-primary uppercase tracking-widest mb-3"
            >
              How it works
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="text-3xl md:text-4xl font-bold tracking-tight"
            >
              Three steps to start
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto"
          >
            {steps.map((step) => (
              <motion.div
                key={step.number}
                variants={fadeUp}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="text-center md:text-left"
              >
                <div className="text-4xl font-black text-white/10 mb-4 font-mono">
                  {step.number}
                </div>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-6 py-24 border-t border-white/5">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="relative overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/50 p-12 md:p-16 text-center"
          >
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-[-50%] left-[50%] -translate-x-1/2 h-[400px] w-[600px] rounded-full bg-primary/8 blur-[120px]" />
            </div>
            <motion.div variants={fadeUp} className="relative">
              <BookOpen className="mx-auto mb-6 text-primary" size={32} />
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                Ready to start solving?
              </h2>
              <p className="text-zinc-400 max-w-md mx-auto mb-8">
                Join Coding Ducks and sharpen your skills with real problems,
                collaborative rooms, and system design challenges.
              </p>
              <Button
                size="lg"
                className="h-12 px-8 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-base"
                onClick={handleSignIn}
              >
                Get Started Free
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </motion.div>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 py-10">
          <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground">
                <Terminal size={12} strokeWidth={3} />
              </div>
              <span className="font-semibold text-zinc-400">Coding Ducks</span>
            </div>
            <p>
              &copy; {new Date().getFullYear()} Coding Ducks. All rights
              reserved.
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}
