"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/contexts/theme-context";
import { AppLogo } from "@/components/layout/app-logo";
import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useRef, useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Tableau de bord", icon: "🏠" },
  { href: "/dashboard/tasks", label: "Tâches", icon: "✅" },
  { href: "/dashboard/calendar", label: "Agenda", icon: "📅" },
  { href: "/dashboard/goals", label: "Objectifs", icon: "🎯" },
  { href: "/dashboard/mood", label: "Bien-être", icon: "💚" },
  { href: "/dashboard/focus", label: "Focus", icon: "⏱️" },
  { href: "/dashboard/ai", label: "IA", icon: "✨" },
];

const STORAGE_KEY = "life_os_sidebar_width";
const MIN_WIDTH = 200;
const MAX_WIDTH = 420;
const DEFAULT_WIDTH = 256;

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [resizing, setResizing] = useState(false);
  const asideRef = useRef<HTMLElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (parsed >= MIN_WIDTH && parsed <= MAX_WIDTH) {
          setWidth(parsed);
        }
      }
    } catch {}
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setResizing(true);
  }, []);

  useEffect(() => {
    if (!resizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, e.clientX));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setResizing(false);
      try {
        localStorage.setItem(STORAGE_KEY, String(width));
      } catch {}
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizing, width]);

  useEffect(() => {
    if (!resizing) return;
    try {
      localStorage.setItem(STORAGE_KEY, String(width));
    } catch {}
  }, [width, resizing]);

  const sidebarContent = (
    <>
      <div className="mb-8 flex justify-center px-2">
        <AppLogo size={52} />
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item, index) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onMobileClose()}
              style={{ animationDelay: `${index * 0.05}s` }}
              className={`nav-link animate-list-item flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                active
                  ? "nav-link-active bg-emerald-600/20 text-emerald-500"
                  : "theme-muted hover:bg-emerald-600/10 hover:theme-text"
              }`}
            >
              <span className="transition-transform duration-300 group-hover:scale-110">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="theme-sidebar-footer mt-4 border-t pt-4">
        <Button variant="ghost" className="mb-2 w-full" onClick={toggleTheme}>
          {theme === "dark" ? "☀️ Mode clair" : "🌙 Mode sombre"}
        </Button>
        <p className="truncate px-2 text-sm font-medium theme-text">{user?.name}</p>
        <p className="truncate px-2 text-xs theme-muted">{user?.email}</p>
        <Button variant="ghost" className="mt-3 w-full" onClick={logout}>
          Déconnexion
        </Button>
      </div>
    </>
  );

  return (
    <>
      <aside
        ref={asideRef}
        style={{ width: `${width}px` }}
        className={`theme-sidebar fixed left-0 top-0 z-40 flex h-screen shrink-0 flex-col border-r p-4 backdrop-blur-md transition-[width] duration-75 md:relative md:translate-x-0 ${
          mobileOpen
            ? "translate-x-0 shadow-2xl shadow-black/50"
            : "-translate-x-full"
        } ${resizing ? "select-none" : ""}`}
      >
        {sidebarContent}

        <div
          onMouseDown={handleMouseDown}
          className={`absolute right-0 top-0 z-50 h-full w-1.5 cursor-col-resize transition-colors hover:bg-emerald-500/40 ${
            resizing ? "bg-emerald-500/50" : "bg-transparent"
          }`}
        />
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => onMobileClose()}
        />
      )}
    </>
  );
}
