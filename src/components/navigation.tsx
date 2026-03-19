"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/intel", label: "Intel", icon: "🔍" },
  { href: "/tasks", label: "Tasks", icon: "✅" },
  { href: "/calendar", label: "Calendar", icon: "📅" },
  { href: "/memory", label: "Memory", icon: "📚" },
  { href: "/team", label: "Team", icon: "🧭" },
  { href: "/office", label: "Office", icon: "🏢" },
  { href: "/health", label: "Health", icon: "🦁" },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2">
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={`rounded-xl px-4 py-2 text-xs font-medium transition ${
              isActive
                ? "bg-aurora-500/20 text-aurora-300 border border-aurora-500/50"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <span className="mr-2">{link.icon}</span>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
