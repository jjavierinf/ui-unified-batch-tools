"use client";

import { useAuthStore, USERS, UserRole } from "@/lib/auth-store";

const roleBadgeConfig: Record<UserRole, { label: string; className: string }> = {
  user: {
    label: "Data Engineer",
    className: "bg-badge-submitted/15 text-badge-submitted",
  },
  leader: {
    label: "Team Leader",
    className: "bg-badge-pending/15 text-badge-pending",
  },
};

export function LoginScreen() {
  const login = useAuthStore((s) => s.login);

  return (
    <div className="h-full flex items-center justify-center bg-background">
      <div className="w-full max-w-sm mx-4">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-accent flex items-center justify-center">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-foreground">
            Unified Batch Tools
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Select a profile to continue
          </p>
        </div>

        {/* User buttons */}
        <div className="flex flex-col gap-3">
          {USERS.map((user) => {
            const badge = roleBadgeConfig[user.role];
            return (
              <button
                key={user.id}
                onClick={() => login(user.id)}
                className="group flex items-center gap-4 w-full px-4 py-3.5 rounded-xl bg-surface border border-sidebar-border hover:border-accent/50 hover:bg-surface-hover transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-accent/15 text-accent flex items-center justify-center text-sm font-semibold shrink-0 group-hover:bg-accent/25 transition-colors">
                  {user.avatar}
                </div>

                {/* Info */}
                <div className="flex flex-col items-start gap-1 min-w-0">
                  <span className="text-sm font-medium text-foreground">
                    {user.name}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full ${badge.className}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        user.role === "leader"
                          ? "bg-badge-pending"
                          : "bg-badge-submitted"
                      }`}
                    />
                    {badge.label}
                  </span>
                </div>

                {/* Arrow */}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="ml-auto text-text-tertiary group-hover:text-accent transition-colors"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            );
          })}
        </div>

        {/* Footer hint */}
        <p className="text-center text-[11px] text-text-tertiary mt-6">
          Demo login &mdash; no credentials required
        </p>
      </div>
    </div>
  );
}
