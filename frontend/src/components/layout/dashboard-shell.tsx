"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { getStoredUser, getToken } from "@/lib/auth/storage";
import { Sidebar } from "@/components/layout/sidebar";
import { PageTransition } from "@/components/layout/page-transition";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tokenChecked, setTokenChecked] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setHasToken(Boolean(getToken()));
    setTokenChecked(true);
  }, []);

  useEffect(() => {
    if (!tokenChecked || loading) return;

    if (!getToken() && !user) {
      router.replace("/login");
    }
  }, [tokenChecked, loading, user, router]);

  const cachedUser = getStoredUser();
  const effectiveUser = user ?? cachedUser;

  if (!tokenChecked || (loading && hasToken && !effectiveUser)) {
    return <LoadingSpinner label="Chargement de votre espace..." />;
  }

  if (!hasToken && !effectiveUser) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto p-4 md:p-8">
        <button
          onClick={() => setMobileOpen(true)}
          className="mb-4 flex size-9 items-center justify-center rounded-lg border theme-sidebar md:hidden"
          aria-label="Menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="theme-text">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
