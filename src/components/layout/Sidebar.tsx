"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, Shield, Variable, Layers, Zap } from "lucide-react";
import { useAppStore } from "@/lib/store/useStore";
import { GithubIcon } from "@/components/shared/GithubIcon";

const navItems = [
  {
    title: "Repositories",
    items: [
      { name: "Variables", href: "/repos/variables", icon: Variable },
      { name: "Secrets", href: "/repos/secrets", icon: Shield },
    ],
  },
  {
    title: "Organizations",
    items: [
      { name: "Variables", href: "/org/variables", icon: Layers },
      { name: "Secrets", href: "/org/secrets", icon: Shield },
      { name: "Bulk Propagate", href: "/org/bulk", icon: Zap },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { platform } = useAppStore();

  const accentColor = platform === "github" ? "hsl(var(--foreground))" : "var(--accent-gitlab)";
  const accentText = platform === "github" ? "hsl(var(--background))" : "#fff";

  return (
    <aside className="w-64 bg-[hsl(var(--card))] border-r border-[hsl(var(--border))] flex flex-col h-full shrink-0 shadow-sm relative z-20">
      <div className="h-16 flex items-center px-6 border-b border-[hsl(var(--border))]">
        <Link href="/" className="flex items-center gap-3 font-semibold text-lg tracking-tight group w-full">
          <div className="p-1.5 rounded-lg bg-[hsl(var(--foreground))] text-[hsl(var(--background))] group-hover:bg-[hsl(var(--muted-foreground))] transition-colors shadow-sm">
            {platform === "github" ? <GithubIcon size={16} /> : <Shield size={16} />}
          </div>
          <span className="text-[hsl(var(--foreground))] truncate">Git Control</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6">
        {navItems.map((section) => (
          <div key={section.title}>
            <h4 className="px-3 text-[11px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2">
              {section.title}
            </h4>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2 text-[13px] font-medium rounded-md transition-all relative group overflow-hidden"
                    style={{
                      color: isActive ? accentText : "hsl(var(--muted-foreground))",
                    }}
                  >
                    {isActive && (
                      <div 
                        className="absolute inset-0 z-0 shadow-sm"
                        style={{ backgroundColor: accentColor }}
                      />
                    )}
                    {!isActive && (
                      <div className="absolute inset-0 bg-[hsl(var(--muted))] opacity-0 group-hover:opacity-100 transition-opacity z-0" />
                    )}
                    <Icon size={15} className={`relative z-10 transition-colors ${isActive ? "" : "group-hover:text-[hsl(var(--foreground))]"}`} />
                    <span className="relative z-10 hidden sm:block">
                      {item.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-[hsl(var(--border))]">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2 text-[13px] font-medium rounded-md transition-all relative group overflow-hidden"
          style={{
            color: pathname === "/settings" ? accentText : "hsl(var(--muted-foreground))",
          }}
        >
          {pathname === "/settings" && (
            <div 
              className="absolute inset-0 z-0 shadow-sm"
              style={{ backgroundColor: accentColor }}
            />
          )}
          {!pathname.startsWith("/settings") && (
            <div className="absolute inset-0 bg-[hsl(var(--muted))] opacity-0 group-hover:opacity-100 transition-opacity z-0" />
          )}
          <Settings size={15} className={`relative z-10 transition-colors ${pathname === "/settings" ? "" : "group-hover:text-[hsl(var(--foreground))]"}`} />
          <span className="relative z-10 hidden sm:block">Settings</span>
        </Link>
      </div>
    </aside>
  );
}
