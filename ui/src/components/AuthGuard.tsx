"use client";

import { useAuthStore } from "@/lib/auth-store";
import { LoginScreen } from "./LoginScreen";
import { HydrationGuard } from "./HydrationGuard";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const currentUser = useAuthStore((s) => s.currentUser);

  return (
    <HydrationGuard>
      {currentUser ? children : <LoginScreen />}
    </HydrationGuard>
  );
}
