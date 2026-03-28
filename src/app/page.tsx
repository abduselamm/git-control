"use client";

import Link from "next/link";
import { Variable, Shield, Layers, Settings, ArrowRight, Zap, AlertCircle } from "lucide-react";
import { useAppStore } from "@/lib/store/useStore";
import { motion, AnimatePresence } from "framer-motion";

const features = [
  { href: "/repos/variables", icon: Variable, label: "Repo Variables", desc: "Manage GitHub/GitLab repository variables", color: "var(--accent-github)" },
  { href: "/repos/secrets", icon: Shield, label: "Repo Secrets", desc: "Securely store encrypted repository secrets", color: "var(--accent-purple)" },
  { href: "/org/variables", icon: Layers, label: "Org Variables", desc: "Shared variables across an entire organization", color: "var(--accent-green)" },
  { href: "/org/secrets", icon: Shield, label: "Org Secrets", desc: "Shared organization-level encrypted secrets", color: "var(--accent-yellow)" },
  { href: "/org/bulk", icon: Zap, label: "Bulk Propagate", desc: "Push one payload to many repositories instantly", color: "var(--accent-gitlab)" },
];

export default function DashboardPage() {
  const { platform, tokens } = useAppStore();
  const hasToken = platform === "github" ? !!tokens.github : !!tokens.gitlab;

  return (
    <div className="flex-1 space-y-8 fade-in relative max-w-6xl mx-auto w-full">
      {/* Platform glowing mesh */}
      <div 
        className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full mix-blend-screen filter blur-[150px] opacity-10 pointer-events-none" 
        style={{ background: platform === "github" ? "var(--text-primary)" : "var(--accent-gitlab)" }}
      />

      <div className="flex flex-col space-y-2 relative z-10 pt-4">
        <h2 className="text-3xl font-bold tracking-tight">Git Control Manager</h2>
        <p className="text-[hsl(var(--muted-foreground))] text-lg max-w-2xl">
          Complete frontend-only management for your CI/CD variables and secrets across <strong className="text-[hsl(var(--foreground))]">GitHub</strong> and <strong className="text-[hsl(var(--foreground))]">GitLab</strong>.
        </p>
      </div>

      <AnimatePresence>
        {!hasToken && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="saas-card border-yellow-500/30 bg-yellow-500/5 relative overflow-hidden"
          >
            <div className="saas-card-content p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500 shrink-0">
                <AlertCircle size={24} />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-yellow-500 leading-none">Authentication Required</p>
                <p className="text-sm text-yellow-500/80">You need to configure your {platform === "github" ? "GitHub" : "GitLab"} personal access token to manage resources.</p>
              </div>
              <Link 
                href="/settings" 
                className="px-4 py-2 shrink-0 rounded-lg text-sm font-medium bg-yellow-500 text-black hover:bg-yellow-400 transition-colors"
              >
                Configure Settings
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 relative z-10">
        {features.map((card, i) => {
          const Icon = card.icon;
          return (
            <Link key={card.href} href={card.href} className="group block h-full">
              <div className="saas-card h-full transition-all duration-300 hover:border-[var(--text-muted)] hover:shadow-md relative overflow-hidden">
                <div 
                  className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-[40px] opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none"
                  style={{ background: card.color }}
                />
                
                <div className="saas-card-header pb-4">
                  <div className="flex items-center justify-between">
                    <div 
                      className="p-2.5 rounded-lg border transition-colors group-hover:bg-[hsl(var(--foreground))] group-hover:text-[hsl(var(--background))]"
                      style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
                    >
                      <Icon size={20} />
                    </div>
                    <ArrowRight size={16} className="text-[hsl(var(--muted-foreground))] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </div>
                
                <div className="saas-card-content">
                  <h3 className="saas-card-title mb-1">{card.label}</h3>
                  <p className="saas-card-description leading-relaxed">{card.desc}</p>
                </div>
              </div>
            </Link>
          );
        })}
        
        {/* Settings Card */}
        <Link href="/settings" className="group block h-full">
          <div className="saas-card h-full transition-all duration-300 hover:border-[var(--text-muted)] hover:shadow-md border-dashed bg-transparent">
            <div className="saas-card-header pb-4">
              <div className="p-2.5 rounded-lg border border-dashed text-[hsl(var(--muted-foreground))]">
                <Settings size={20} />
              </div>
            </div>
            <div className="saas-card-content">
              <h3 className="saas-card-title mb-1">Platform Settings</h3>
              <p className="saas-card-description leading-relaxed">Manage your personal access tokens, API proxies, and local security settings.</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
