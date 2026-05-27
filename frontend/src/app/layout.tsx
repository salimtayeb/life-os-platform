import type { Metadata } from "next";
import { AuthProvider } from "@/contexts/auth-context";
import { ThemeProvider } from "@/contexts/theme-context";
import { ToastProvider } from "@/contexts/toast-context";
import { AppBackground } from "@/components/layout/app-background";
import { ToastContainer } from "@/components/ui/toast-container";
import { RegisterSW } from "@/components/pwa/register-sw";
import "./globals.css";

export const metadata: Metadata = {
  title: "Life OS — Hub personnel",
  description: "Centralisez tâches, agenda, bien-être et recommandations IA",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "Life OS", statusBarStyle: "black-translucent" },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "msapplication-tile-color": "#0a0f1a",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <RegisterSW />
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <AppBackground>{children}</AppBackground>
            </AuthProvider>
            <ToastContainer />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
