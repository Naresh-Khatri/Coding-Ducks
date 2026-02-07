"use client";

import { redirect } from "next/navigation";
import Link from "next/link";
import { Terminal, Code2, Cpu, ArrowRight, Zap, Trophy, Shield } from "lucide-react";

import { authClient } from "~/auth/client";
import { Button } from "~/components/ui/button";

export default function HomePage() {
  const { data: session, isPending } = authClient.useSession();

  // Redirect logic
  if (!isPending && session) {
    if (session.user.isAdmin) {
      redirect("/admin");
    } else {
      redirect("/problems");
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white selection:bg-yellow-500/30">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] h-[500px] w-[500px] rounded-full bg-yellow-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] h-[500px] w-[500px] rounded-full bg-orange-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Navigation */}
        <header className="container mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-400 text-black">
              <Terminal size={18} strokeWidth={3} />
            </div>
            <span>Coding Ducks</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <Link href="#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="#problems" className="hover:text-white transition-colors">Problems</Link>
            <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              className="text-zinc-400 hover:text-white hover:bg-white/5"
              onClick={async () => {
                await authClient.signIn.social({
                  provider: "google",
                  callbackURL: "/problems",
                });
              }}
            >
              Sign In
            </Button>
            <Button
              className="bg-yellow-400 text-black hover:bg-yellow-300 font-semibold"
              onClick={async () => {
                await authClient.signIn.social({
                  provider: "google",
                  callbackURL: "/problems",
                });
              }}
            >
              Get Started
            </Button>
          </div>
        </header>

        {/* Hero Section */}
        <section className="flex-1 container mx-auto px-6 flex flex-col items-center justify-center text-center py-20 pb-32">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-zinc-300 backdrop-blur-sm mb-8 animate-fade-in-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Now in Public Beta
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8 bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent max-w-4xl">
            Code. Run. <br />
            <span className="text-yellow-400 bg-none text-transparent bg-clip-text" style={{ textShadow: "0 0 80px rgba(250, 204, 21, 0.4)" }}>Quack.</span>
          </h1>

          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-10 leading-relaxed">
            The ultimate playground for developers. Solve problems, complete challenges,
            and master algorithms in a secure, high-performance environment.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Button
              size="lg"
              className="h-12 px-8 bg-yellow-400 text-black hover:bg-yellow-300 font-bold text-base w-full sm:w-auto"
              onClick={async () => {
                await authClient.signIn.social({
                  provider: "google",
                  callbackURL: "/problems",
                });
              }}
            >
              Start Coding Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-8 border-white/10 text-white hover:bg-white/5 font-semibold text-base w-full sm:w-auto"
            >
              View Problems
            </Button>
          </div>

          {/* Stats / Proof */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 border-t border-white/10 pt-10">
            <div>
              <div className="text-3xl font-bold text-white mb-1">50+</div>
              <div className="text-sm text-zinc-500 uppercase tracking-wider font-medium">Languages</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-1">10k+</div>
              <div className="text-sm text-zinc-500 uppercase tracking-wider font-medium">Problems</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-1">100ms</div>
              <div className="text-sm text-zinc-500 uppercase tracking-wider font-medium">Execution</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-1">99.9%</div>
              <div className="text-sm text-zinc-500 uppercase tracking-wider font-medium">Uptime</div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="container mx-auto px-6 py-24 border-t border-white/10">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="group p-8 rounded-3xl bg-zinc-900/50 border border-white/5 hover:border-yellow-500/20 hover:bg-zinc-900/80 transition-all duration-300">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-yellow-400/20 to-orange-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Code2 className="text-yellow-400" size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Multi-Language Support</h3>
              <p className="text-zinc-400 leading-relaxed">
                Run code in over 50 programming languages. From Python to Rust, we've got you covered with specialized environments.
              </p>
            </div>
            <div className="group p-8 rounded-3xl bg-zinc-900/50 border border-white/5 hover:border-blue-500/20 hover:bg-zinc-900/80 transition-all duration-300">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-400/20 to-cyan-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="text-blue-400" size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Secure Sandboxing</h3>
              <p className="text-zinc-400 leading-relaxed">
                Your code runs in isolated, secure containers. Experiment freely without worrying about system integrity or security risks.
              </p>
            </div>
            <div className="group p-8 rounded-3xl bg-zinc-900/50 border border-white/5 hover:border-green-500/20 hover:bg-zinc-900/80 transition-all duration-300">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-400/20 to-emerald-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="text-green-400" size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Instant Feedback</h3>
              <p className="text-zinc-400 leading-relaxed">
                Get real-time execution results, performance metrics, and test case validation instantly as you code.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 py-12 bg-black">
          <div className="container mx-auto px-6 text-center text-zinc-500 text-sm">
            <p>&copy; {new Date().getFullYear()} Coding Ducks. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </main>
  );
}
