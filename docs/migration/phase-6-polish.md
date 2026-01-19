# Phase 6: Polish & Launch

> **Prerequisite**: Complete all previous phases.

---

## Goals

1. ✅ Redesigned landing page
2. ✅ SEO and metadata
3. ✅ Error boundaries
4. ✅ Loading states
5. ✅ Performance optimization

---

## Ticket 6.1: Landing Page

### File: `apps/web/src/app/(main)/page.tsx`

```tsx
import Link from "next/link";
import Image from "next/image";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  Code,
  Palette,
  Users,
  Zap,
  Trophy,
  Terminal,
  ArrowRight,
} from "lucide-react";

const FEATURES = [
  {
    icon: Code,
    title: "LeetCode-style Problems",
    description: "Practice with curated coding challenges. Support for Python, JavaScript, Java, C++, and more.",
    color: "text-green-500",
    bg: "bg-green-500/10",
  },
  {
    icon: Palette,
    title: "UI Design Battles",
    description: "Recreate designs with HTML & CSS. AI-powered similarity scoring compares your work to the target.",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    icon: Users,
    title: "Collaborative Coding",
    description: "Real-time pair programming with Ducklets. Share code, chat, and build together.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: Terminal,
    title: "Online IDE",
    description: "Write, compile, and run code in 5+ languages. No setup required.",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        {/* Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        </div>

        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">
              🎉 Now with collaborative editing
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
              The ultimate playground for{" "}
              <span className="text-primary">developers</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Solve coding problems, compete in UI battles, and collaborate in real-time.
              Level up your skills with Coding Ducks.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/problems">
                <Button size="lg" className="w-full sm:w-auto">
                  Start Coding
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/challenges">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  View Challenges
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Everything you need</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A complete platform for learning, practicing, and collaborating.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-xl border bg-card hover:shadow-lg transition-shadow"
              >
                <div className={`p-3 rounded-lg ${feature.bg} w-fit mb-4`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">50+</div>
              <div className="text-muted-foreground">Coding Problems</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">20+</div>
              <div className="text-muted-foreground">UI Challenges</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">5</div>
              <div className="text-muted-foreground">Languages Supported</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary/5">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to level up?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join developers who are improving their skills every day.
          </p>
          <Link href="/signup">
            <Button size="lg">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">🦆 Coding Ducks</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/problems" className="hover:text-foreground">Problems</Link>
              <Link href="/challenges" className="hover:text-foreground">Challenges</Link>
              <Link href="/ducklets" className="hover:text-foreground">Ducklets</Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Coding Ducks
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
```

---

## Ticket 6.2: SEO & Metadata

### File: `apps/web/src/app/layout.tsx` (update)

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Coding Ducks - Learn, Practice, Compete",
    template: "%s | Coding Ducks",
  },
  description: "The ultimate playground for developers. Solve coding problems, compete in UI battles, and collaborate in real-time.",
  keywords: [
    "coding practice",
    "leetcode alternative",
    "ui challenges",
    "pair programming",
    "collaborative coding",
    "online ide",
  ],
  authors: [{ name: "Coding Ducks" }],
  creator: "Coding Ducks",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://codingducks.xyz",
    siteName: "Coding Ducks",
    title: "Coding Ducks - Learn, Practice, Compete",
    description: "The ultimate playground for developers.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Coding Ducks",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Coding Ducks",
    description: "The ultimate playground for developers.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};
```

### Per-page Metadata

```tsx
// apps/web/src/app/(main)/problems/page.tsx
export const metadata: Metadata = {
  title: "Problems",
  description: "Practice coding problems in Python, JavaScript, Java, C++, and more.",
};

// apps/web/src/app/(main)/challenges/page.tsx
export const metadata: Metadata = {
  title: "UI Challenges",
  description: "Recreate designs with HTML & CSS and compete for the highest score.",
};
```

---

## Ticket 6.3: Error Boundaries

### File: `apps/web/src/app/error.tsx`

```tsx
"use client";

import { useEffect } from "react";
import { Button } from "~/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center">
      <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
      <h2 className="text-2xl font-bold mb-2">Something went wrong!</h2>
      <p className="text-muted-foreground mb-6">
        {error.message || "An unexpected error occurred."}
      </p>
      <Button onClick={reset}>
        <RefreshCw className="h-4 w-4 mr-2" />
        Try again
      </Button>
    </div>
  );
}
```

### File: `apps/web/src/app/not-found.tsx`

```tsx
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center">
      <h1 className="text-6xl font-bold text-muted-foreground mb-4">404</h1>
      <h2 className="text-2xl font-bold mb-2">Page not found</h2>
      <p className="text-muted-foreground mb-6">
        The page you're looking for doesn't exist.
      </p>
      <Link href="/">
        <Button>
          <Home className="h-4 w-4 mr-2" />
          Go home
        </Button>
      </Link>
    </div>
  );
}
```

---

## Ticket 6.4: Loading States

### File: `apps/web/src/app/(main)/loading.tsx`

```tsx
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
```

### Skeleton Components

```tsx
// apps/web/src/components/skeletons/problem-list-skeleton.tsx
import { Skeleton } from "~/components/ui/skeleton";

export function ProblemListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border rounded">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}
```

---

## Performance Tips

1. **Image Optimization**
   - Use `next/image` for all images
   - Enable lazy loading
   - Use appropriate sizes

2. **Code Splitting**
   - Use `dynamic` imports for heavy components (editors)
   - Split routes automatically with App Router

3. **Caching**
   - Enable tRPC query caching
   - Use `staleTime` for appropriate queries

4. **Bundle Size**
   - Analyze with `@next/bundle-analyzer`
   - Tree-shake unused code
   - Lazy load icons

```tsx
// Lazy load heavy components
const CodeEditor = dynamic(
  () => import("~/components/code-editor").then((mod) => mod.CodeEditor),
  { loading: () => <Skeleton className="h-96" />, ssr: false }
);
```

---

## Verification Checklist

- [ ] Landing page loads with all sections
- [ ] SEO metadata appears correctly
- [ ] 404 page shows for invalid routes
- [ ] Error boundary catches errors gracefully
- [ ] Loading states display during data fetching
- [ ] Lighthouse score > 90 for performance
- [ ] All images optimized

---

## Launch Checklist

- [ ] Environment variables configured for production
- [ ] Database migrated and seeded
- [ ] PartyKit deployed
- [ ] Python comparison service running
- [ ] R2 bucket configured with public access
- [ ] Domain configured
- [ ] SSL enabled
- [ ] Error monitoring set up (Sentry)
- [ ] Analytics configured

---

## 🎉 Congratulations!

You've completed the Coding Ducks migration! The platform now includes:

- ✅ Problems with code execution
- ✅ Collaborative Ducklets with PartyKit
- ✅ UI Challenges with image comparison
- ✅ User profiles and dashboard
- ✅ Modern landing page

Future enhancements to consider:
- Email notifications
- Leaderboards
- Achievement badges
- Problem discussions
- Solution sharing
