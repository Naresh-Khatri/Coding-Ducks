"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, FileCode2, LayoutDashboard, Shield } from "lucide-react";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/problems", label: "Problems", icon: FileCode2 },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="border-border bg-card flex h-full w-64 flex-col border-r">
      {/* Header */}
      <div className="border-border flex items-center gap-3 border-b px-4 py-4">
        <div className="bg-destructive/10 flex h-9 w-9 items-center justify-center rounded-lg">
          <Shield className="text-destructive h-5 w-5" />
        </div>
        <div>
          <h1 className="text-sm font-semibold">Coding Ducks Admin</h1>
          <p className="text-muted-foreground text-xs">Manage content</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-border border-t p-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2"
          asChild
        >
          <Link href="/problems">
            <ChevronLeft className="h-4 w-4" />
            Back to Problems
          </Link>
        </Button>
      </div>
    </div>
  );
}
