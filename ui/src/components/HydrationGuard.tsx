"use client";

import { useSyncExternalStore } from "react";

export function HydrationGuard({ children }: { children: React.ReactNode }) {
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (!hydrated) {
    return null;
  }

  return <>{children}</>;
}
