import Link from "next/link";
import { Github, Terminal, Twitter } from "lucide-react";

const FOOTER_LINKS: {
  heading: string;
  links: { label: string; href: string }[];
}[] = [
  {
    heading: "Practice",
    links: [
      { label: "Problems", href: "/problems" },
      { label: "UI Battles", href: "/battles" },
      { label: "System Design", href: "/system-design" },
    ],
  },
  {
    heading: "Collaborate",
    links: [
      { label: "Ducklets", href: "/ducklets" },
      { label: "Contests", href: "/contests" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
  {
    heading: "Account",
    links: [
      { label: "Sign in", href: "/login" },
      { label: "Settings", href: "/dashboard/settings" },
    ],
  },
];

const SOCIALS: { label: string; href: string; icon: typeof Github }[] = [
  { label: "GitHub", href: "https://github.com", icon: Github },
  { label: "Twitter", href: "https://twitter.com", icon: Twitter },
];

export function SiteFooter() {
  return (
    <footer className="relative border-t border-white/5 bg-black">
      {/* thin neon top edge */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-fuchsia-500/40 to-transparent" />

      <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-10">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          {/* brand */}
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="flex items-center gap-2 font-bold tracking-tight"
            >
              <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg">
                <Terminal size={18} strokeWidth={3} />
              </div>
              <span className="text-white">Coding Ducks</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-neutral-500">
              The playground for coders. Practice, battle, and build together in
              real time.
            </p>
          </div>

          {/* link columns */}
          {FOOTER_LINKS.map((col) => (
            <div key={col.heading}>
              <h3 className="font-mono text-xs tracking-[0.2em] text-neutral-500 uppercase">
                {col.heading}
              </h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-neutral-400 transition-colors hover:text-fuchsia-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 sm:flex-row">
          <p className="font-mono text-xs text-neutral-600">
            © {new Date().getFullYear()} Coding Ducks. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            {SOCIALS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.02] text-neutral-400 transition-all duration-300 hover:-translate-y-0.5 hover:border-fuchsia-400/30 hover:text-fuchsia-200"
              >
                <social.icon className="size-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
