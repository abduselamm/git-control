"use client";

import { usePathname } from "next/navigation";
import { PlatformSwitcher } from "./PlatformSwitcher";
import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";

export function Header() {
  const pathname = usePathname();
  
  const generateBreadcrumbs = () => {
    if (pathname === "/") return [{ label: "Dashboard", href: "/" }];
    
    const parts = pathname.split("/").filter(Boolean);
    const breadcrumbs = [{ label: "Dashboard", href: "/" }];
    
    let currentPath = "";
    parts.forEach((part) => {
      currentPath += `/${part}`;
      breadcrumbs.push({
        label: part.charAt(0).toUpperCase() + part.slice(1),
        href: currentPath,
      });
    });
    
    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <header className="h-16 flex-none flex items-center justify-between px-4 sm:px-8 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))/80] backdrop-blur-md sticky top-0 z-30">
      <nav className="flex items-center space-x-1 text-sm text-[hsl(var(--muted-foreground))]">
        {breadcrumbs.map((crumb, i) => (
          <div key={crumb.href} className="flex items-center">
            {i > 0 && <ChevronRight size={14} className="mx-1 opacity-50" />}
            <Link 
              href={crumb.href}
              className={`flex items-center gap-1.5 transition-colors hover:text-[hsl(var(--foreground))] ${
                i === breadcrumbs.length - 1 ? "font-medium text-[hsl(var(--foreground))]" : ""
              }`}
            >
              {i === 0 && <Home size={14} />}
              <span className={i === 0 ? "hidden sm:inline" : ""}>{crumb.label}</span>
            </Link>
          </div>
        ))}
      </nav>
      
      <div className="flex items-center">
        <PlatformSwitcher />
      </div>
    </header>
  );
}
