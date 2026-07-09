import { useState, useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Renders children in a portal attached to document.body, but ONLY on the client.
 * This prevents SSR/hydration mismatches that cause dialogs to be unresponsive
 * when rendered by TanStack Start's server-side rendering.
 */
export function ClientPortal({ children, enabled = true }: { children: ReactNode; enabled?: boolean }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !enabled) return null;

  return createPortal(children, document.body);
}
