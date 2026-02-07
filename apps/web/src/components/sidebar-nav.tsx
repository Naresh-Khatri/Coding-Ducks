"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart2,
  BookOpen,
  Box,
  Key,
  LayoutDashboard,
  Settings,
  TerminalSquare,
  Zap,
} from "lucide-react";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/playground", label: "Playground", icon: TerminalSquare },
  { href: "/dashboard/api-keys", label: "API Keys", icon: Key },
  { href: "/dashboard/usage", label: "Usage & Limits", icon: BarChart2 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

interface SidebarNavProps {
  onOpenPlans?: () => void;
}

export function SidebarNav({ onOpenPlans }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col px-4 py-6">
      {/* Brand */}
      <div className="mb-10 flex items-center gap-3 px-2">
        <div className="bg-primary shadow-primary/20 flex h-10 w-10 items-center justify-center rounded-xl shadow-lg">
          <Zap
            className="text-primary-foreground fill-primary-foreground"
            size={20}
          />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">Coding Ducks</h1>
          <p className="text-muted-foreground text-xs">Practice & Improve</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        <div className="text-muted-foreground mb-2 px-2 text-xs font-semibold tracking-wider uppercase">
          Platform
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "to-primary/10 text-foreground border-border border bg-gradient-to-r from-transparent from-75% shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
            >
              <Icon
                size={18}
                className={cn(
                  "transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-foreground",
                )}
              />
              {item.label}
              {isActive && (
                <div className="bg-primary absolute right-0 h-6 w-1 rounded-l-md shadow-[0_0_8px_hsl(var(--primary)/0.6)]" />
              )}
            </Link>
          );
        })}

        <div className="text-muted-foreground mt-8 mb-2 px-2 text-xs font-semibold tracking-wider uppercase">
          Resources
        </div>
        <Link
          href="/dashboard/docs"
          className={cn(
            "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
            pathname === "/dashboard/docs"
              ? "bg-muted text-foreground border-border border shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
          )}
        >
          <BookOpen
            size={18}
            className="text-muted-foreground group-hover:text-foreground transition-colors"
          />
          Documentation
        </Link>
      </nav>

      {/* Upgrade Card */}
      <div className="from-card to-muted border-border group relative mt-auto overflow-hidden rounded-2xl border bg-gradient-to-br p-4">
        <div className="bg-primary/10 group-hover:bg-primary/20 absolute top-0 right-0 -mt-10 -mr-10 h-24 w-24 rounded-full blur-3xl transition-all duration-500"></div>
        <div className="relative z-10">
          <div className="bg-muted border-border mb-3 flex h-10 w-10 items-center justify-center rounded-lg border">
            <Box className="text-foreground" size={20} />
          </div>
          <h4 className="mb-1 text-sm font-semibold">Upgrade to Pro</h4>
          <p className="text-muted-foreground mb-3 text-xs">
            Unlock unlimited executions and priority support.
          </p>
          <Button onClick={onOpenPlans} className="w-full shadow-lg" size="sm">
            View Plans
          </Button>
        </div>
      </div>
    </div>
  );
}
