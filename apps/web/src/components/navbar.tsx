"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Terminal, X } from "lucide-react";
import { useState } from "react";

import { authClient } from "~/auth/client";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { AnimatedThemeToggler } from "./ui/animated-theme-toggler";
import { cn } from "~/lib/utils";

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
  const userInitials = user?.name
    ? user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
    : "??";

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
        <Link href="/problems" className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-400 text-black">
            <Terminal size={18} strokeWidth={3} />
          </div>
          <span>Coding Ducks</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                pathname?.startsWith(link.href)
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Side - Desktop */}
        <div className="hidden md:flex items-center gap-4">
          <AnimatedThemeToggler />
          {user ? (
            <>
              <div className="bg-border h-8 w-px"></div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="hover:bg-muted hover:border-border flex items-center gap-3 rounded-full border border-transparent p-1.5 pr-3 transition-colors">
                    <div className="from-primary to-primary/60 text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr text-sm font-medium">
                      {userInitials}
                    </div>
                    <span className="text-sm font-medium">{user.name ?? "User"}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings" className="w-full cursor-pointer">
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
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-2">
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
          <div className="container mx-auto px-6 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "block px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname?.startsWith(link.href)
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t pt-3 space-y-2">
              {user ? (
                <>
                  <div className="flex items-center gap-3 px-4 py-2">
                    <div className="from-primary to-primary/60 text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr text-sm font-medium">
                      {userInitials}
                    </div>
                    <span className="text-sm font-medium">{user.name ?? "User"}</span>
                  </div>
                  <Link
                    href="/dashboard/settings"
                    className="block px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Settings
                  </Link>
                  <button
                    className="w-full text-left px-4 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
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
                    className="justify-center text-muted-foreground hover:text-foreground"
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
                    className="justify-center bg-yellow-400 text-black hover:bg-yellow-300 font-semibold"
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
