"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Terminal, X } from "lucide-react";

import { authClient } from "~/auth/client";
import { getAvatarUrl } from "~/lib/avatar";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { cn } from "~/lib/utils";
import { AnimatedThemeToggler } from "./ui/animated-theme-toggler";

const navLinks = [
  { href: "/problems", label: "Problems" },
  { href: "/ducklets", label: "Ducklets" },
];

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const user = session?.user;

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
        },
      },
    });
  };

  return (
    <header className="bg-background/80 sticky top-0 z-50 border-b backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        {/* Logo */}
        <Link
          href="/problems"
          className="flex items-center gap-2 text-xl font-bold tracking-tight"
        >
          <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg">
            <Terminal size={18} strokeWidth={3} />
          </div>
          <span>Coding Ducks</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks
            .map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  pathname?.startsWith(link.href)
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                {link.label}
              </Link>
            ))}
        </nav>

        {/* Right Side - Desktop */}
        <div className="hidden items-center gap-4 md:flex">
          <AnimatedThemeToggler />
          {user ? (
            <>
              <div className="bg-border h-8 w-px"></div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="hover:bg-muted hover:border-border flex items-center gap-3 rounded-full border border-transparent p-1.5 pr-3 transition-colors">
                    <img
                      src={getAvatarUrl(user.username, 32)}
                      alt={user.name ?? "User"}
                      className="bg-muted h-8 w-8 rounded-full"
                    />
                    <span className="text-sm font-medium">
                      {user.name ?? "User"}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {user.username && (
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/u/${user.username}`}
                        className="w-full cursor-pointer"
                      >
                        My Profile
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="w-full cursor-pointer">
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard/settings"
                      className="w-full cursor-pointer"
                    >
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive cursor-pointer"
                    onClick={handleLogout}
                  >
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-foreground"
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
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                onClick={async () => {
                  await authClient.signIn.social({
                    provider: "google",
                    callbackURL: "/problems",
                  });
                }}
              >
                Get Started
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-2 md:hidden">
          <AnimatedThemeToggler />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="border-t md:hidden">
          <div className="container mx-auto space-y-3 px-6 py-4">
            {navLinks
              .filter((link) => !link.auth || user)
              .map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "block rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                    pathname?.startsWith(link.href)
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            <div className="space-y-2 border-t pt-3">
              {user ? (
                <>
                  <div className="flex items-center gap-3 px-4 py-2">
                    <img
                      src={getAvatarUrl(user.username, 32)}
                      alt={user.name ?? "User"}
                      className="bg-muted h-8 w-8 rounded-full"
                    />
                    <span className="text-sm font-medium">
                      {user.name ?? "User"}
                    </span>
                  </div>
                  {user.username && (
                    <Link
                      href={`/u/${user.username}`}
                      className="text-muted-foreground hover:text-foreground hover:bg-muted/50 block rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      My Profile
                    </Link>
                  )}
                  <Link
                    href="/dashboard"
                    className="text-muted-foreground hover:text-foreground hover:bg-muted/50 block rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    className="text-muted-foreground hover:text-foreground hover:bg-muted/50 block rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Settings
                  </Link>
                  <button
                    className="text-destructive hover:bg-destructive/10 w-full rounded-lg px-4 py-2 text-left text-sm font-medium transition-colors"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                  >
                    Log out
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2 px-4 py-2">
                  <Button
                    variant="ghost"
                    className="text-muted-foreground hover:text-foreground justify-center"
                    onClick={async () => {
                      setIsMobileMenuOpen(false);
                      await authClient.signIn.social({
                        provider: "google",
                        callbackURL: "/problems",
                      });
                    }}
                  >
                    Sign In
                  </Button>
                  <Button
                    className="bg-primary text-primary-foreground hover:bg-primary/90 justify-center font-semibold"
                    onClick={async () => {
                      setIsMobileMenuOpen(false);
                      await authClient.signIn.social({
                        provider: "google",
                        callbackURL: "/problems",
                      });
                    }}
                  >
                    Get Started
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
