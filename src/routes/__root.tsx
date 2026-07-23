import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { MobileShell } from "../components/expense/MobileShell";
import { ExpenseProvider } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { AuthScreen } from "@/components/auth/AuthScreen";
import type { Session } from "@supabase/supabase-js";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">
          Page not found
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back
          home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    head: () => ({
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title: "SLPlayer — Personal Expense Tracker" },
        {
          name: "description",
          content: "A clean and modern personal expense tracker app.",
        },
        { name: "author", content: "SLPlayer Dev" },
        { property: "og:title", content: "SLPlayer" },
        {
          property: "og:description",
          content: "A clean and modern personal expense tracker app.",
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
        { name: "theme-color", content: "#0e0e10" },
        { name: "mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
        { name: "apple-mobile-web-app-title", content: "Wallet" },
      ],
      links: [
        { rel: "manifest", href: "/manifest.json" },
        { rel: "apple-touch-icon", href: "/icons/icon-192.png" },
        {
          rel: "stylesheet",
          href: appCss,
        },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossOrigin: "anonymous",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap",
        },
      ],
    }),
    shellComponent: RootShell,
    component: RootComponent,
    notFoundComponent: NotFoundComponent,
    errorComponent: ErrorComponent,
  },
);

function RootShell({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [session, setSession] = useState<Session | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // 1. Monitor Supabase Auth Session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingAuth(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoadingAuth(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Migration v7 & Service Worker Registration
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isMigrated = localStorage.getItem("slplayer-migrated-v7");
      if (!isMigrated) {
        localStorage.removeItem("slplayer-transactions");
        localStorage.removeItem("slplayer-wallets");
        localStorage.removeItem("slplayer-wallet-spends");
        localStorage.removeItem("slplayer-sync-queue");
        localStorage.setItem("slplayer-migrated-v4", "true");
        localStorage.setItem("slplayer-migrated-v5", "true");
        localStorage.setItem("slplayer-migrated-v6", "true");
        localStorage.setItem("slplayer-migrated-v7", "true");
      }

      if ("serviceWorker" in navigator) {
        if (process.env.NODE_ENV === "production") {
          navigator.serviceWorker.register("/sw.js").then((reg) => {
            reg.update();
          }).catch((err) => {
            console.error("Service worker registration failed:", err);
          });
        } else {
          // Scorched earth in development: kill any rogue service workers to prevent cache traps
          navigator.serviceWorker.getRegistrations().then((registrations) => {
            for (const reg of registrations) {
              reg.unregister();
              console.log("Unregistered rogue service worker in dev mode.");
            }
          });
        }
      }
    }
  }, []);

  // 3. Render Loading Spinner while restoring auth session
  if (loadingAuth) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#09090b]">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-8 h-8 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin"
          />
          <p className="text-xs text-zinc-500">Connecting securely…</p>
        </div>
      </div>
    );
  }

  // 4. Render AuthScreen if unauthenticated
  if (!session) {
    return <AuthScreen />;
  }

  // 5. Render App Shell if authenticated
  return (
    <QueryClientProvider client={queryClient}>
      <ExpenseProvider>
        <MobileShell>
          <Outlet />
        </MobileShell>
      </ExpenseProvider>
    </QueryClientProvider>
  );
}
